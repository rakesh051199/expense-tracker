import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ExpenseTrackerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Create a DynamoDB table
    const transactionsTable = new dynamodb.Table(this, "TransactionsTable", {
      partitionKey: {
        name: "transactionId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "Transactions",
    });

    // ✅ Create a Lambda function
    const expenseLambda = new lambda.Function(this, "ExpenseLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        TRANSACTIONS_TABLE: transactionsTable.tableName,
      },
    });

    // ✅ Grant Lambda access to DynamoDB
    transactionsTable.grantReadWriteData(expenseLambda);

    // ✅ Create API Gateway
    const api = new apigateway.RestApi(this, "ExpenseTrackerAPI", {
      restApiName: "ExpenseTrackerService",
    });

    // ✅ Add a Lambda-backed endpoint
    const transactions = api.root.addResource("transactions");
    transactions.addMethod(
      "POST",
      new apigateway.LambdaIntegration(expenseLambda),
    );

    new cdk.CfnOutput(this, "APIEndpoint", { value: api.url });
  }
}
