import type { HttpStatus } from "@nestjs/common";
import { HttpException } from "@nestjs/common";
import type { ZodError } from "zod";
import { EntryToKey, type ErrorEntry, type ErrorKey } from "./errors";

export type AppErrorBody = {
  statusCode: HttpStatus;
  errorCode: ErrorKey;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  id: string;
};

export type AppErrorMeta =
  | { errors: ZodError }
  | { [key: string]: unknown };

export class AppError<E extends ErrorEntry = ErrorEntry> extends HttpException {
  readonly code: ErrorKey; // Unique API error code
  readonly id: string;
  readonly meta?: AppErrorMeta;

  constructor(
    entry: E,
    opts?: { message?: string; meta?: AppErrorMeta; cause?: unknown },
  ) {
    const status = entry.status;
    const code = EntryToKey.get(entry);
    
    if (!code) {
      throw new Error(
        `Invalid error entry: entry not found in EntryToKey map. This should never happen if using Errors object.`,
      );
    }

    const id = crypto.randomUUID();

    // Extract ZodError issues if present, otherwise undefined
    let errors: AppErrorBody["errors"];
    if (opts?.meta && "errors" in opts.meta && opts.meta.errors instanceof Error) {
      const zodError = opts.meta.errors as ZodError;
      errors = zodError.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));
    }

    const body: AppErrorBody = {
      statusCode: status,
      errorCode: code,
      message: opts?.message ?? entry.message,
      errors,
      id,
    };

    super(body, status, { cause: opts?.cause });

    // augment after super
    this.code = code;
    this.id = id;
    this.meta = opts?.meta;

    // keeps stack clean
    Error.captureStackTrace?.(this, AppError);
  }
}
