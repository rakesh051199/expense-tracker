import {
  PutCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

// DynamoDB client setup
const dynamoDBClient = new DynamoDBClient({ region: "us-west-2" });
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

// Ensure environment variables are set
const TableName = process.env.TRANSACTIONS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

if (!TableName || !JWT_SECRET) {
  throw new Error("Missing required environment variables");
}

// Main handler function
export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const userAction = event.pathParameters?.userAction;
    if (userAction === "register") {
      return registerUser(event);
    } else if (userAction === "login") {
      return loginUser(event);
    }
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid action" }),
    };
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

// Register User
async function registerUser(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const { name, password, email } = JSON.parse(event.body || "{}");

  if (!name || !password || !email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" }),
    };
  }

  // Check if the user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return {
      statusCode: 409,
      body: JSON.stringify({ message: "User already exists" }),
    };
  }

  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  const userItem = {
    TableName,
    Item: {
      PK: `USER#${userId}`,
      SK: "PROFILE",
      name,
      hashedPassword,
      email,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    await docClient.send(new PutCommand(userItem));

    const token = generateJwt(userId, email);
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User registered successfully",
        user: { id: userId, name, email },
        token,
      }),
    };
  } catch (error) {
    console.error("❌ Error during user registration:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
}

// Login User
async function loginUser(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  const { email, password } = JSON.parse(event.body || "{}");

  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" }),
    };
  }

  const user: any = await findUserByEmail(email);
  if (!user) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  }

  const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
  if (!isValidPassword) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Invalid password" }),
    };
  }

  const token = generateJwt(user.userId, user.email);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "User logged in successfully",
      user: { id: user.userId, name: user.name, email: user.email },
      token,
    }),
  };
}

// Helper: Generate JWT
function generateJwt(userId: string, email: string) {
  return jwt.sign({ id: userId, email: email, role: "user" }, JWT_SECRET!, {
    expiresIn: "1h",
  });
}

// Helper: Find User by Email
async function findUserByEmail(email: string) {
  const params: any = {
    TableName,
    IndexName: "emailIndex",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  const result = await docClient.send(new QueryCommand(params));
  return result.Items && result.Items.length > 0
    ? {
        userId: result.Items[0].PK.replace("USER#", ""),
        ...result.Items[0],
      }
    : null;
}
