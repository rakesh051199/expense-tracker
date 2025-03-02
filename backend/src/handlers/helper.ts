import Ajv from "ajv";

const expenseSchema = {
  type: "object",
  required: ["userId", "amount", "type", "category", "description"],
  properties: {
    userId: { type: "string", minLength: 1 },
    amount: { type: "number", minimum: 0.01 }, // Must be a positive number
    category: {
      type: "string",
      enum: [
        "Food",
        "Transport",
        "Shopping",
        "Salary",
        "House Rental income",
        "Other",
      ],
    }, // Predefined categories
    description: { type: "string", maxLength: 255 }, // Optional field
    type: { type: "string", enum: ["expense", "income", "transfer"] },
    sourceAccount: { type: "string", minLength: 1 },
    destinationAccount: { type: "string", minLength: 1 },
  },
  additionalProperties: false, // Prevents extra fields from being added
};

export const requestValidator = (data: any) => {
  const ajv = new Ajv();
  const validate = ajv.compile(expenseSchema);
  const valid = validate(data);
  if (!valid) {
    throw new Error(validate.errors?.map((error) => error.message).join(", "));
  }
};
