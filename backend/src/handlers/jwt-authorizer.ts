import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";

const SECRET_KEY = process.env.JWT_SECRET!; // Store in AWS Secrets Manager or ENV

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  try {
    logger.info("Authorizing user", { event });
    const token = event.authorizationToken.replace("Bearer ", "");

    logger.info("Token", { token });
    logger.info("Secret Key", { SECRET_KEY });

    // Verify JWT
    const decoded: any = jwt.verify(token, SECRET_KEY);
    logger.info("Decoded JWT", { decoded });
    logger.info("User was authorized", { user: decoded.id });

    return {
      principalId: typeof decoded.id === "string" ? decoded.id : "",
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
      context: { userId: typeof decoded.id === "string" ? decoded.id : "" },
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
