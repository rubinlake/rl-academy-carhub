import { HttpStatus } from "@nestjs/common";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import type { ErrorKey } from "./errors";

// Create a schema for HTTP status codes (numbers)
const httpStatusSchema = z
  .number()
  .int()
  .min(100)
  .max(599)
  .describe("The HTTP status code");

export const ErrorSchema = z.object({
  statusCode: httpStatusSchema,
  errorCode: z
    .string()
    .describe("The application specific error code")
    .transform((v) => v as ErrorKey),
  message: z.string().describe("The error message"),
  errors: z
    .array(
      z.object({
        field: z.string().describe("The field path (e.g., 'email' or 'user.name')"),
        message: z.string().describe("The validation error message"),
        code: z.string().describe("The Zod error code (e.g., 'too_small', 'invalid_type')"),
      }),
    )
    .optional()
    .describe("Validation errors (typically from Zod)"),
  id: z.string().uuid().describe("Unique error identifier for tracking"),
});

export class ErrorDto extends createZodDto(ErrorSchema) {}
