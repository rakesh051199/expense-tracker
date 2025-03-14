import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import logger from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { requestValidator } from "./helper";
import { expenseSchema } from "./schema";

const dynamoDbClient = new DynamoDBClient({ region: "us-west-2" });
const sesClient = new SESClient({ region: "us-west-2" }); // Change region if needed
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);
const TableName = process.env.TRANSACTIONS_TABLE || "";

interface Transaction {
  PK: string;
  SK: string;
  createdAt: string;
  userId?: string;
  transactionId?: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  category: string;
  description: string;
  sourceAccount?: string;
  destinationAccount?: string;
}

export const expenseHandler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  logger.info("Expense Handler got invoked");

  try {
    switch (event.httpMethod) {
      case "POST":
        return await createTransaction(event);
      case "GET":
        return await getAllTransactions(event);
      case "PATCH":
        return await updateTransaction(event);
      case "DELETE":
        return await deleteTransaction(event);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Bad request" }),
        };
    }
  } catch (error: any) {
    logger.error("Error in expenseHandler", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

async function createTransaction(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const body: Partial<Transaction> = JSON.parse(event.body || "{}");
  const transactionId = `txn-${uuidv4()}`;
  const transactionAmount = Number(body.amount) || 0;

  requestValidator(body, expenseSchema);

  const transaction: Transaction = {
    PK: `USER#${body.userId}`,
    SK: `#TRANSACTION#${transactionId}`,
    transactionId: transactionId,
    userId: body.userId,
    type: body.type!,
    amount: body.amount!,
    category: body.category!,
    description: body.description || "",
    createdAt: new Date().toISOString(),
    sourceAccount: body.sourceAccount,
    destinationAccount: body.destinationAccount,
  };

  if (body.type === "expense") {
    await checkBudgetAndSendAlert(
      body.userId!,
      body.category!,
      transactionAmount,
    );
  }

  await dynamoDb.send(
    new PutCommand({
      TableName: TableName,
      Item: transaction,
    }),
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Transaction added successfully" }),
  };
}

async function getAllTransactions(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const userId = event.queryStringParameters?.userId;
  const type = event.queryStringParameters?.type;
  const month = event.queryStringParameters?.month;
  const year = event.queryStringParameters?.year;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "userid is required" }),
    };
  }
  const params: any = {
    TableName: TableName,
    IndexName: "dateIndex",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
    ProjectionExpression:
      "transactionId, #type, amount, category, description, createdAt",
    ExpressionAttributeNames: { "#type": "type" },
  };

  if (type) {
    params.FilterExpression = "#type = :type";
    params.ExpressionAttributeValues[":type"] = type;
  }

  if (month && year) {
    const startDate = `${year}-${month.padStart(2, "0")}-01T00:00:00Z`;
    const endDate = `${year}-${month.padStart(2, "0")}-31T23:59:59Z`;
    params.KeyConditionExpression +=
      " AND createdAt BETWEEN :startDate AND :endDate";
    params.ExpressionAttributeValues[":startDate"] = startDate;
    params.ExpressionAttributeValues[":endDate"] = endDate;
  }

  const result = await dynamoDb.send(new QueryCommand(params));
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
}

async function updateTransaction(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const body: Partial<Transaction> = JSON.parse(event.body || "{}");

  const { userId, transactionId, ...updateFields } = body;

  if (!userId || !transactionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "userId and transactionId are required",
      }),
    };
  }

  const updateExpression: string[] = [];
  const expressionAttributeValues: { [key: string]: any } = {};
  const expressionAttributeNames: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(updateFields)) {
    if (value !== undefined) {
      const attributeName = `#${key}`;
      const attributeValue = `:${key}`;
      updateExpression.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeValues[attributeValue] = value;
      expressionAttributeNames[attributeName] = key;
    }
  }

  if (updateExpression.length === 0) {
    return {
      statusCode: 204,
      body: JSON.stringify({ message: "No fields to update" }),
    };
  }

  const updateParams = {
    TableName: TableName,
    Key: {
      PK: `USER#${userId}`,
      SK: `#TRANSACTION#${transactionId}`,
    },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
  };
  await dynamoDb.send(new UpdateCommand(updateParams));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Transaction updated successfully" }),
  };
}

async function deleteTransaction(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const userId = event.queryStringParameters?.userId;
  const transactionId = event.queryStringParameters?.transactionId;

  if (!userId || !transactionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "userId and transactionId are required",
      }),
    };
  }

  await dynamoDb.send(
    new DeleteCommand({
      TableName: TableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `#TRANSACTION#${transactionId}`,
      },
    }),
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Transaction deleted successfully" }),
  };
}

async function checkBudgetAndSendAlert(
  userId: string,
  category: string,
  transactionAmount: number,
) {
  const budgetCategory = await dynamoDb.send(
    new GetCommand({
      TableName: TableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `BUDGET#${category}`,
      },
    }),
  );

  if (!budgetCategory.Item) {
    logger.info(`No budget set for category: ${category}`);
    return;
  }

  if (budgetCategory.Item) {
    const budgetLimit = budgetCategory.Item.amount;
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString();
    const startDate = `${year}-${month.padStart(2, "0")}-01T00:00:00Z`;
    const endDate = `${year}-${month.padStart(2, "0")}-31T23:59:59Z`;
    const params: any = {
      TableName: TableName,
      IndexName: "dateIndex",
      KeyConditionExpression:
        "userId = :userId and createdAt BETWEEN :startDate AND :endDate",
      ProjectionExpression: "amount",
      FilterExpression:
        "category = :category and begins_with(SK, :transactionPrefix)",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":category": category,
        ":transactionPrefix": "#TRANSACTION#",
        ":startDate": startDate,
        ":endDate": endDate,
      },
    };
    const transactionsData = await dynamoDb.send(new QueryCommand(params));
    const totalExpensesForMonth: number =
      transactionsData.Items?.reduce(
        (acc: number, item: any) => acc + item.amount,
        0,
      ) || 0;

    if (totalExpensesForMonth + transactionAmount > budgetLimit) {
      logger.info(
        `Send email to user. budgetLimit: ${budgetLimit}, sum: ${totalExpensesForMonth}, transaction amount: ${transactionAmount}`,
      );
      await sendBudgetAlertEmail(
        userId,
        category,
        budgetLimit,
        totalExpensesForMonth,
      );
    }
  }
}

async function sendBudgetAlertEmail(
  userEmail: string,
  category: string,
  limit: number,
  spent: number,
) {
  const params = {
    Source: "rakesh8886949770@gmail.com", // Your verified sender email
    Destination: {
      ToAddresses: ["rakeshvanka123@gmail.com"], // Dynamically send to the user
    },
    Message: {
      Subject: {
        Data: "⚠️ Budget Alert: Limit Exceeded!",
      },
      Body: {
        Text: {
          Data: `Hello,

Your budget for ${category} has exceeded the limit.
Budget Limit: $${limit}
Total Spent: $${spent}

Consider reviewing your expenses.

Best,
Your Expense Tracker App`,
        },
        Html: {
          Data: `
            <html>
              <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: red;">⚠️ Budget Alert: Limit Exceeded!</h2>
                <p>Hello,</p>
                <p>Your budget for <strong>${category}</strong> has exceeded the limit.</p>
                <ul>
                  <li><strong>Budget Limit:</strong> $${limit}</li>
                  <li><strong>Total Spent:</strong> $${spent}</li>
                </ul>
                <p>Please review your expenses.</p>
                <p>Best,<br>Your Expense Tracker App</p>
              </body>
            </html>
          `,
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log("📩 Email sent successfully to:", userEmail);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}
