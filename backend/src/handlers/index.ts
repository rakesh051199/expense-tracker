import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import logger from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { requestValidator } from "./helper";

const dynamoDbClient = new DynamoDBClient({ region: "us-west-2" });
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

  requestValidator(body);

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
  const type = event.queryStringParameters?.type; // Optional filter (expense, income, transfer)
  const month = event.queryStringParameters?.month; // Optional filter (1-12)
  const year = event.queryStringParameters?.year; // Optional filter (2021)

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
  const body: Partial<Transaction> = JSON.parse(event.body || "{}");
  const userId = body?.userId;
  const transactionId = body?.transactionId;

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
