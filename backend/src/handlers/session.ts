import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET!;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract 'Cookie' header
    const cookieHeader = event.headers?.Cookie || event.headers?.cookie;
    if (!cookieHeader) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "https://dlujnv9c6ivls.cloudfront.net",
          "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({ message: "Unauthorized: No cookie found" }),
      };
    }

    // Extract 'authToken' from cookie
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const authToken = cookies
      .find((c) => c.startsWith("authToken="))
      ?.split("=")[1];

    if (!authToken) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "https://dlujnv9c6ivls.cloudfront.net",
          "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({ message: "Unauthorized: No authToken found" }),
      };
    }

    // Verify token
    const decoded: any = jwt.verify(authToken, SECRET_KEY);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decoded.exp < currentTime) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "https://dlujnv9c6ivls.cloudfront.net",
          "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({ message: "Session expired" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://dlujnv9c6ivls.cloudfront.net",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({
        message: "Session active",
        userId: decoded.id,
        expiresAt: decoded.exp,
      }),
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: {
        "Access-Control-Allow-Origin": "https://dlujnv9c6ivls.cloudfront.net",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({ message: "Invalid token" }),
    };
  }
};
