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
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  // The API sends null for people who never gave a phone, such as the owner
  // who created the church.
  phoneNumber: z
    .string()
    .nullish()
    .transform((val) => val ?? ""),
  email: z
    .string()
    .nullish()
    .transform((val) => val ?? ""),
  age: z
    .number()
    .nullable()
    .transform((val) => val ?? undefined),
  birthdate: z.union([z.string(), z.null()]).transform((val) => {
    if (val === null || val === "") return undefined;
    return LocalDateSchema.parse(val);
  }),
  hasBeenBaptized: z
    .boolean()
    .nullish()
    .transform((val) => val ?? undefined),
});

export type PersonResponse = z.infer<typeof PersonResponseSchema>;
