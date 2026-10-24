import { z } from "zod";
import type { CreateInvitationRequest } from "@/app/(api)/generated/aPISrTommy.schemas";

export const invitationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingrese el correo")
    .email("Ingrese un correo válido"),
  firstName: z.string().trim().min(1, "Ingrese el nombre"),
  lastName: z.string().trim().min(1, "Ingrese el apellido"),
  // Empty: no position, the invitation only links the account.
  positionId: z.string(),
});

export type InvitationFormValues = z.infer<typeof invitationSchema>;

export const emptyInvitation: InvitationFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  positionId: "",
};

// Body of POST /organizations/{id}/invitations.
export const toInvitationRequest = (
  values: InvitationFormValues,
): CreateInvitationRequest => ({
  email: values.email.trim(),
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  ...(values.positionId ? { positionId: values.positionId } : {}),
});

// First message of each failing field, by field name.
export const invitationErrors = (
  values: InvitationFormValues,
): Partial<Record<keyof InvitationFormValues, string>> => {
  const result = invitationSchema.safeParse(values);
  if (result.success) return {};
  const errors: Partial<Record<keyof InvitationFormValues, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof InvitationFormValues;
    errors[field] ??= issue.message;
  }
  return errors;
};
