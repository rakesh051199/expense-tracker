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

// Define global headers
const GLOBAL_HEADERS = {
  "Access-Control-Allow-Origin": "https://dlujnv9c6ivls.cloudfront.net",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

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
  const schema = await budgetSchema;
  requestValidator(body, schema);
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
    ConditionExpression: "attribute_not_exists(SK)", // Prevent overwriting existing budget
  };

  await putItem(createBudgetParams);
  return {
    statusCode: 201,
    headers: GLOBAL_HEADERS,
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

  // Fetch all budgets for the user
  const budgetParams: any = {
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
    budgetParams.KeyConditionExpression +=
      " AND createdAt BETWEEN :startDate AND :endDate";
    budgetParams.ExpressionAttributeValues[":startDate"] = startDate;
    budgetParams.ExpressionAttributeValues[":endDate"] = endDate;
  }

  const budgetResult = await queryItems(budgetParams);
  const budgets = budgetResult.Items || [];

  // Fetch all transactions for the user in a single query
  const transactionParams: any = {
    TableName,
    IndexName: "dateIndex",
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "begins_with(SK, :transactionPrefix)",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":transactionPrefix": "#TRANSACTION#",
    },
    ProjectionExpression: "amount, category",
  };

  if (year && month) {
    const startDate = `${year}-${month.padStart(2, "0")}-01T00:00:00Z`;
    const endDate = `${year}-${month.padStart(2, "0")}-31T23:59:59Z`;
    transactionParams.KeyConditionExpression +=
      " AND createdAt BETWEEN :startDate AND :endDate";
    transactionParams.ExpressionAttributeValues[":startDate"] = startDate;
    transactionParams.ExpressionAttributeValues[":endDate"] = endDate;
  }

  const transactionResult = await queryItems(transactionParams);
  const transactions = transactionResult.Items || [];

  // Calculate total spent for each category
  const categorySpendMap: { [key: string]: number } = {};
  for (const transaction of transactions) {
    const category = transaction.category;
    const amount = transaction.amount || 0;
    categorySpendMap[category] = (categorySpendMap[category] || 0) + amount;
  }

  // Merge total spent into budgets
  const enrichedBudgets = budgets.map((budget) => ({
    ...budget,
    totalSpent: categorySpendMap[budget.category] || 0,
  }));

  return {
    statusCode: 200,
    headers: GLOBAL_HEADERS,
    body: JSON.stringify(enrichedBudgets),
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
    headers: GLOBAL_HEADERS,
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
    headers: GLOBAL_HEADERS,
    body: JSON.stringify({ message: "Budget deleted successfully" }),
  };
}
