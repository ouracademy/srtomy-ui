import { z } from "zod";
import { parseISO, isValid } from "date-fns";

// Custom transformer: "YYYY-MM-DD" → Date
export const LocalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
  .transform((str) => {
    const date = parseISO(str);
    if (!isValid(date)) throw new Error("Invalid date");
    return date;
  });

export const PersonResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  age: z
    .number()
    .nullable()
    .transform((val) => val ?? undefined),
  birthdate: z.union([z.string(), z.null()]).transform((val) => {
    if (val === null || val === "") return undefined;
    return LocalDateSchema.parse(val);
  }),
  hasBeenBaptized: z.boolean().optional(),
});

export type PersonResponse = z.infer<typeof PersonResponseSchema>;
