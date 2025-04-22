import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { RemovalPolicy } from "aws-cdk-lib";
import {
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
  CachePolicy,
  AllowedMethods,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

export class MoneyTrackingSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Create a DynamoDB table
    const moneyTrackingTable = new dynamodb.Table(this, "MoneyTrackingTable", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "MoneyTrackingTableV2",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    moneyTrackingTable.addGlobalSecondaryIndex({
      indexName: "dateIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    moneyTrackingTable.addGlobalSecondaryIndex({
      indexName: "emailIndex",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
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

    const requestValidatorLambda = createLambdaFunction(
      "RequestValidatorLambda",
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

    const sessionLambda = createLambdaFunction("SessionLambda", "session", {
      JWT_SECRET: "my-temp-auth-key",
    });

    const lambdaFunctions = [transactionsLambda, budgetLambda, usersLambda];
    lambdaFunctions.forEach((fn) => moneyTrackingTable.grantReadWriteData(fn));

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
        allowOrigins: ["https://d24248z4qoc5x0.cloudfront.net"],
        allowMethods: apigateway.Cors.ALL_METHODS, // Allow all HTTP methods
        allowHeaders: [
          "Authorization",
          "Content-Type",
          "X-Api-Key",
          "Cookie", // ✅ Allow Cookie Header
        ],
        allowCredentials: true, // ✅ Crucial for cookies
        statusCode: 204, // Best practice for preflight
      },
    });

    const requestAuthorizer = new apigateway.RequestAuthorizer(
      this,
      "MoneyTrackerRequestAuthorizer",
      {
        handler: requestValidatorLambda,
        identitySources: [apigateway.IdentitySource.header("Cookie")],
        resultsCacheTtl: cdk.Duration.seconds(0),
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

    const transactions = api.root.addResource("transactions");
    const budgets = api.root.addResource("budgets");
    const users = api.root.addResource("users").addResource("{userAction}");
    const session = api.root.addResource("session");

    addLambdaMethod(
      transactions,
      ["POST", "GET", "PATCH", "DELETE"],
      transactionsLambda,
      requestAuthorizer,
    );
    addLambdaMethod(
      budgets,
      ["POST", "GET", "PATCH", "DELETE"],
      budgetLambda,
      requestAuthorizer,
    );
    addLambdaMethod(users, ["POST", "GET"], usersLambda);
    addLambdaMethod(session, ["GET"], sessionLambda, requestAuthorizer);

    // ✅ S3 Bucket for Static Website Hosting
    const myMoneyAppBucket = new Bucket(this, "MyMoneyAppBucket", {
      bucketName: "my-money-app-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true, // Automatically delete objects when the bucket is destroyed
    });

    const originAccessIdentity = new OriginAccessIdentity(this, "MyOAI");
    myMoneyAppBucket.grantRead(originAccessIdentity);

    const distribution = new Distribution(this, "MyMoneyAppDistribution", {
      defaultBehavior: {
        origin: new S3Origin(myMoneyAppBucket, { originAccessIdentity }),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: "/index.html",
          responseHttpStatus: 200,
        },
      ],
    });

    transactionsLambda.addEnvironment(
      "CLOUD_FRONT_URL",
      `https://${distribution.distributionDomainName}`,
    );

    budgetLambda.addEnvironment(
      "CLOUD_FRONT_URL",
      `https://${distribution.distributionDomainName}`,
    );
    usersLambda.addEnvironment(
      "CLOUD_FRONT_URL",
      `https://${distribution.distributionDomainName}`,
    );
    sessionLambda.addEnvironment(
      "CLOUD_FRONT_URL",
      `https://${distribution.distributionDomainName}`,
    );

    new BucketDeployment(this, "DeployMyMoneyAppBucket", {
      sources: [Source.asset("./mobile-ui/build")],
      destinationBucket: myMoneyAppBucket,
      distribution,
      distributionPaths: ["/*"],
      memoryLimit: 1024, // Increase memory to 1 GB
    });

    // ✅ S3 Bucket for categories.json
    const categoriesBucket = new Bucket(this, "CategoryBucket", {
      bucketName: "my-money-app-categories-bucket",
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      autoDeleteObjects: true, // Automatically delete objects when the bucket is destroyed
      cors: [
        {
          allowedMethods: [HttpMethods.GET],
          allowedOrigins: [`https://${distribution.distributionDomainName}`],
          allowedHeaders: ["*"],
        },
      ],
    });

    // ✅ Deploy categories.json file
    new BucketDeployment(this, "DeployCategoriesJson", {
      sources: [Source.asset("backend/src/categories")], // Folder containing categories.json
      destinationBucket: categoriesBucket,
    });

    new cdk.CfnOutput(this, "APIEndpoint", { value: api.url });
    new cdk.CfnOutput(this, "S3BucketURL", {
      value: myMoneyAppBucket.bucketWebsiteUrl,
    });
  }
}
