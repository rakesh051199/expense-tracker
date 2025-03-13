import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ExpenseTrackerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Create a DynamoDB table
    const transactionsTable = new dynamodb.Table(this, "TransactionsTable", {
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "TransactionsV5",
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Avoid accidental deletion
    });

    transactionsTable.addGlobalSecondaryIndex({
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

    transactionsTable.addGlobalSecondaryIndex({
      indexName: "emailIndex",
      partitionKey: {
        name: "email",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ✅ Create a Lambda function with NodejsFunction
    const expenseLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "ExpenseLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "backend/src/handlers/index.ts", // Corrected path to TypeScript entry file
        handler: "expenseHandler", // Ensure your function in index.ts is exported as `main`
        environment: {
          TRANSACTIONS_TABLE: transactionsTable.tableName,
        },
      },
    );

    const expenseAPIAuthorizerLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "ExpenseAPIAuthorizerLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "backend/src/handlers/jwt-authorizer.ts",
        handler: "handler",
        environment: {
          JWT_SECRET: "my-temp-auth-key",
        },
      },
    );

    const budgetLambda = new lambdaNodeJs.NodejsFunction(this, "BudgetLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: "backend/src/handlers/budget.ts",
      handler: "budgetHandler",
      environment: {
        TRANSACTIONS_TABLE: transactionsTable.tableName,
      },
    });

    const usersLambda = new lambdaNodeJs.NodejsFunction(this, "UsersLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: "backend/src/handlers/user_management.ts",
      handler: "userHandler",
      environment: {
        TRANSACTIONS_TABLE: transactionsTable.tableName,
        JWT_SECRET: "my-temp-auth-key",
      },
    });

    // ✅ Grant Lambda access to DynamoDB
    transactionsTable.grantReadWriteData(expenseLambda);
    transactionsTable.grantReadWriteData(budgetLambda);
    transactionsTable.grantReadWriteData(usersLambda);

    // ✅ Create API Gateway
    const api = new apigateway.RestApi(this, "ExpenseTrackerAPI", {
      restApiName: "ExpenseTrackerService",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      "ExpenseAPIAuthorizer",
      {
        handler: expenseAPIAuthorizerLambda,
        identitySource: "method.request.header.Authorization",
      },
    );

    // ✅ Add a Lambda-backed endpoint
    const transactions = api.root.addResource("transactions");
    transactions.addMethod(
      "POST",
      new apigateway.LambdaIntegration(expenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      },
    );
    transactions.addMethod(
      "GET",
      new apigateway.LambdaIntegration(expenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      },
    );
    transactions.addMethod(
      "PATCH",
      new apigateway.LambdaIntegration(expenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      },
    );
    transactions.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(expenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      },
    );

    const budgets = api.root.addResource("budgets");
    budgets.addMethod("POST", new apigateway.LambdaIntegration(budgetLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });
    budgets.addMethod("GET", new apigateway.LambdaIntegration(budgetLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });
    budgets.addMethod("PATCH", new apigateway.LambdaIntegration(budgetLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });
    budgets.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(budgetLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      },
    );

    const users = api.root.addResource("users");
    const usersResource = users.addResource("{userAction}");
    usersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(usersLambda),
    );
    usersResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(usersLambda),
    );

    new cdk.CfnOutput(this, "APIEndpoint", { value: api.url });
  }
}
