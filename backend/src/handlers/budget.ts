import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import logger from "../utils/logger";
import { requestValidator } from "../utils/helper";
import { budgetSchema } from "../utils/schema";
import { validateUser } from "../utils/helper";
import {
  updateItem,
  deleteItem,
  queryItems,
  putItem,
} from "../utils/db-client";

const TableName = process.env.TRANSACTIONS_TABLE || "";

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
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
};

async function createBudget(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "");
  requestValidator(body, budgetSchema);
  const { userId, monthlyLimit, category, description } = body;
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "userId is required" }),
    };
  }
  await validateUser(userId);
  const createBudgetParams = {
    TableName,
    Item: {
      PK: `USER#${userId}`,
      SK: `BUDGET#${category}`,
      createdAt: new Date().toISOString(),
      userId,
      monthlyLimit,
      category,
      description,
    },
  };
  await putItem(createBudgetParams);
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

  await validateUser(userId);

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

  const result = await queryItems(params);
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

  await validateUser(userId);

  const updateBudgetParams = {
    TableName,
    Key: {
      PK: `USER#${userId}`,
      SK: `BUDGET#${category}`,
    },
    UpdateExpression: "SET monthlyLimit = :monthlyLimit",
    ExpressionAttributeValues: {
      ":monthlyLimit": monthlyLimit,
    },
  };
  await updateItem(updateBudgetParams);

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

  await validateUser(userId);

  const deleteBudgetParams = {
    TableName,
    Key: {
      PK: `USER#${userId}`,
      SK: `BUDGET#${category}`,
    },
  };
  await deleteItem(deleteBudgetParams);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Budget deleted successfully" }),
  };
}
