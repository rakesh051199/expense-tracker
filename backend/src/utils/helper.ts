import Ajv from "ajv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import logger from "./logger";

const dynamoDbClient = new DynamoDBClient({ region: "us-west-2" });
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);
const TableName = process.env.TRANSACTIONS_TABLE || "";

export const requestValidator = (data: any, schema: any) => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    throw new Error(validate.errors?.map((error) => error.message).join(", "));
  }
};

export const validateUser = async (userId: string) => {
  if (!TableName) {
    throw new Error("TableName is not set in the environment variables.");
  }

  try {
    const user = await dynamoDb.send(
      new GetCommand({
        TableName: TableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `PROFILE`,
        },
      }),
    );

    if (!user.Item) {
      throw {
        statusCode: 404,
        message: "User not found",
      };
    }
  } catch (error: any) {
    logger.error("Error in validateUser", error);
    throw {
      statusCode: 500,
      message: error.message,
    };
  }
};
