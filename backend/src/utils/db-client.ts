import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// DynamoDB client setup
const dynamoDbClient = new DynamoDBClient({ region: "us-west-2" });
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const putItem = async (params: any) => {
  await docClient.send(new PutCommand(params));
};

const getItem = async (params: any) => {
  return await docClient.send(new GetCommand(params));
};

const queryItems = async (params: any) => {
  return await docClient.send(new QueryCommand(params));
};

const updateItem = async (params: any) => {
  await docClient.send(new UpdateCommand(params));
};

const deleteItem = async (params: any) => {
  await docClient.send(new DeleteCommand(params));
};

export { putItem, getItem, queryItems, updateItem, deleteItem };
