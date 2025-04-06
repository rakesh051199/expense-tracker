import {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
} from "aws-lambda";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";

const SECRET_KEY = process.env.JWT_SECRET!;

// Helper function to extract "authToken" from Cookie header
const getAuthTokenFromCookie = (
  cookieHeader: string | undefined,
): string | null => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const authTokenCookie = cookies.find((c) => c.startsWith("authToken="));
  return authTokenCookie ? authTokenCookie.split("=")[1] : null;
};

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  try {
    logger.info("Authorizing user", { event });

    // Extract the authToken from the Cookie header
    const token = getAuthTokenFromCookie(
      event.headers?.Cookie || event.headers?.cookie,
    );

    if (!token) {
      logger.error("authToken not found in cookies");
      throw new Error("Unauthorized, token not found");
    }

    logger.info("Extracted authToken from cookies", { token });

    // Verify JWT
    const decoded: any = jwt.verify(token, SECRET_KEY);
    logger.info("Decoded JWT", { decoded });

    return {
      principalId: decoded.id ?? "unknown",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: event.methodArn,
          },
        ],
      },
      context: { userId: decoded.id ?? "unknown", role: decoded.role },
    };
  } catch (error) {
    logger.error("User unauthorized", { error });

    return {
      principalId: "unauthorized",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn,
          },
        ],
      },
    };
  }
};
