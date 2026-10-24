import { z } from "zod";

// A new location needs at least one role of its own. Predefined roles are fixed
// options the API already offers, so they do not count toward that requirement.
// Editing does not require it: locations created before the rule must stay editable.
export const locationSchema = (
  fixedOptions: string[],
  { requireOwnRole }: { requireOwnRole: boolean },
) =>
  z.object({
    name: z
      .string()
      .min(1, { message: "Por favor ingrese el nombre de la sede" }),
    address: z.string().min(1, { message: "Por favor ingrese la dirección" }),
    phoneNumber: z.string(),
    roles: requireOwnRole
      ? z
          .array(z.string())
          .refine(
            (roles) => roles.some((role) => !fixedOptions.includes(role)),
            { message: "Agregue al menos un rol propio de la sede" },
          )
      : z.array(z.string()),
  });

export type LocationDetailForm = z.infer<ReturnType<typeof locationSchema>>;
