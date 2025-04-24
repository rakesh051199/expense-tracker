import axios from "axios";
import logger from "./logger";
import { Category } from "aws-sdk/clients/cloudformation";

let categories: any = { income: [], expense: [] };

// Function to load categories before exporting schemas
async function loadCategories() {
  try {
    const response = await axios.get(
      "https://my-money-app-categories-bucket.s3.us-west-2.amazonaws.com/categories.json",
    );
    logger.info(`Categories loaded: ${JSON.stringify(response.data)}`);
    categories = response.data;
  } catch (error) {
    logger.error("Error loading categories:", error);
  }
}

// Call the function and ensure the categories are loaded
const initializeCategories = loadCategories();

export const transactionSchema = initializeCategories.then(() => ({
  type: "object",
  required: ["userId", "amount", "type", "category", "description"],
  properties: {
    userId: { type: "string", minLength: 1 },
    amount: { type: "number", minimum: 0.01 }, // Must be a positive number
    category: {
      type: "string",
      enum: [
        ...categories.income.map((category: any) => category.name),
        ...categories.expense.map((category: any) => category.name),
      ], // Use populated categories
    },
    description: { type: "string", maxLength: 255 }, // Optional field
    type: { type: "string", enum: ["expense", "income", "transfer"] },
    sourceAccount: { type: "string", minLength: 1 },
    destinationAccount: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
}));

export const budgetSchema = initializeCategories.then(() => ({
  type: "object",
  required: ["userId", "monthlyLimit", "category"],
  properties: {
    userId: { type: "string", minLength: 1 },
    monthlyLimit: { type: "number", minimum: 0.01 }, // Must be a positive number
    category: {
      type: "string",
      enum: categories.expense.map((category: any) => category.name), // Use populated categories
    },
    description: { type: "string", maxLength: 255 }, // Optional field
  },
  additionalProperties: false,
}));
