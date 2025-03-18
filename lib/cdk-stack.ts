import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

export class MoneyTrackingSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Create a DynamoDB table
    const moneyTrackingTable = new dynamodb.Table(this, "MoneyTrackingTable", {
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "MoneyTrackingTableV1",
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Avoid accidental deletion
    });

    moneyTrackingTable.addGlobalSecondaryIndex({
      indexName: "dateIndex",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "createdAt",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    moneyTrackingTable.addGlobalSecondaryIndex({
      indexName: "emailIndex",
      partitionKey: {
        name: "email",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const createLambdaFunction = (
      id: string,
      handler: string,
      environment: Record<string, string>,
    ) => {
      return new lambdaNodeJs.NodejsFunction(this, id, {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `backend/src/handlers/${handler}.ts`,
        handler: "handler",
        environment,
      });
    };

    const transactionsLambda = createLambdaFunction(
      "TransactionLambda",
      "transaction",
      {
        TRANSACTIONS_TABLE: moneyTrackingTable.tableName,
      },
    );

    const tokenValidatorLambda = createLambdaFunction(
      "TokenValidatorLambda",
      "jwt-authorizer",
      {
        JWT_SECRET: "my-temp-auth-key",
      },
    );

    const budgetLambda = createLambdaFunction("BudgetsLambda", "budget", {
      TRANSACTIONS_TABLE: moneyTrackingTable.tableName,
    });

    const usersLambda = createLambdaFunction("UsersLambda", "user_management", {
      TRANSACTIONS_TABLE: moneyTrackingTable.tableName,
      JWT_SECRET: "my-temp-auth-key",
    });

    const lambdaFunctions = [transactionsLambda, budgetLambda, usersLambda];

    lambdaFunctions.forEach((fn) => {
      moneyTrackingTable.grantReadWriteData(fn);
    });

    // Grant SES permissions to transactionsLambda
    transactionsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:*"],
        resources: ["*"],
      }),
    );

    // ✅ Create API Gateway
    const api = new apigateway.RestApi(this, "MoneyTrackerAPI", {
      restApiName: "MoneyTrackerAPI",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      "MoneyTrackerAPIAuthorizer",
      {
        handler: tokenValidatorLambda,
        identitySource: "method.request.header.Authorization",
      },
    );

    const addLambdaMethod = (
      resource: apigateway.IResource,
      methods: string[],
      lambda: lambda.IFunction,
      authorizer?: apigateway.IAuthorizer,
    ) => {
      methods.forEach((method) =>
        resource.addMethod(method, new apigateway.LambdaIntegration(lambda), {
          authorizer,
          authorizationType: authorizer
            ? apigateway.AuthorizationType.CUSTOM
            : undefined,
        }),
      );
    };

    // ✅ Add a Lambda-backed endpoint
    const transactions = api.root.addResource("transactions");
    const budgets = api.root.addResource("budgets");
    const users = api.root.addResource("users");
    const usersResource = users.addResource("{userAction}");

    addLambdaMethod(
      transactions,
      ["POST", "GET", "PATCH", "DELETE"],
      transactionsLambda,
      authorizer,
    );
    addLambdaMethod(
      budgets,
      ["POST", "GET", "PATCH", "DELETE"],
      budgetLambda,
      authorizer,
    );
    addLambdaMethod(usersResource, ["POST", "GET"], usersLambda);

    new cdk.CfnOutput(this, "APIEndpoint", { value: api.url });
  }
}
