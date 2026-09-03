import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";
import { ValidationError } from "../errors/AppError";

type ValidationTarget = "body" | "query" | "params";

const targetKeyMap = {
  body: "validatedBody",
  query: "validatedQuery",
  params: "validatedParams",
} as const;

function fieldsFromZod(error: {
  issues: { path: (string | number)[]; message: string }[];
}): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_root";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function validate(schema: ZodTypeAny, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fields = fieldsFromZod(result.error);
      const message =
        Object.values(fields).join(", ") || "Validation failed";
      next(new ValidationError(message, fields));
      return;
    }

    const key = targetKeyMap[target];
    (req as Request)[key] = result.data as never;
    next();
  };
}
