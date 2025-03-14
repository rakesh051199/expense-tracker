import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import logger from "../utils/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { requestValidator } from "./helper";
import { budgetSchema } from "./schema";

const dynamoDbClient = new DynamoDBClient({ region: "us-west-2" });
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);
const TableName = process.env.TRANSACTIONS_TABLE || "";

export async function budgetHandler(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  logger.info("Budget Handler got invoked");
  try {
    switch (event.httpMethod) {
      case "POST":
        return await createBudget(event);
      case "GET":
        return await getBudgets(event);
      case "PATCH":
        return await updateBudget(event);
      case "DELETE":
        return await deleteBudget(event);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Bad request" }),
        };
    }
  } catch (error: any) {
    logger.error("Error in budgetHandler", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

async function createBudget(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "");
  requestValidator(body, budgetSchema);
  const { userId, monthlyLimit, category, description } = body;
  const budget = {
    PK: `USER#${userId}`,
    SK: `BUDGET#${category}`,
    createdAt: new Date().toISOString(),
    userId,
    monthlyLimit,
    category,
    description,
  };
  await dynamoDb.send(new PutCommand({ TableName, Item: budget }));
  return {
    statusCode: 201,
    body: JSON.stringify({ message: "Budget created successfully" }),
  };
}

async function getBudgets(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const userId = event.queryStringParameters?.userId;
  const year = event.queryStringParameters?.year;
  const month = event.queryStringParameters?.month;
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "userId is required" }),
    };
  }

  const params: any = {
    TableName,
    IndexName: "dateIndex",
    KeyConditionExpression: "userId = :userId",
    ProjectionExpression: "monthlyLimit, category, description",
    FilterExpression: "begins_with(SK, :budgetPrefix)",
    ExpressionAttributeValues: {
      ":budgetPrefix": "BUDGET#",
      ":userId": userId,
    },
  };

  if (year && month) {
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

async function updateBudget(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "");

  const { userId, category, monthlyLimit } = body;

  if (!userId || !category || !monthlyLimit) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "userId ,budgetId and monthlyLimit are required",
      }),
    };
  }

  await dynamoDb.send(
    new UpdateCommand({
      TableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `BUDGET#${category}`,
      },
      UpdateExpression: "SET monthlyLimit = :monthlyLimit",
      ExpressionAttributeValues: {
        ":monthlyLimit": monthlyLimit,
      },
    }),
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Budget updated successfully" }),
  };
}

async function deleteBudget(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const userId = event.queryStringParameters?.userId;
  const category = event.queryStringParameters?.category;

  if (!userId || !category) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "userId and category are required",
      }),
    };
  }

  await dynamoDb.send(
    new DeleteCommand({
      TableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `BUDGET#${category}`,
      },
    }),
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Budget deleted successfully" }),
  };
}
