import type { z } from "zod";
import { ApiError } from "./errors";

/** Parse dữ liệu bằng schema Zod; sai thì ném ApiError(kind "validation"). */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw new ApiError("validation", "errors.invalidData", {
    message: result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; "),
    cause: result.error,
  });
}
