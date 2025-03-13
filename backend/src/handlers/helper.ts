import Ajv from "ajv";

export const requestValidator = (data: any, schema: any) => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    throw new Error(validate.errors?.map((error) => error.message).join(", "));
  }
};
