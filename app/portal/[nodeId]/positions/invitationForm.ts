import { z } from "zod";
import type { CreateInvitationRequest } from "@/app/(api)/generated/aPISrTommy.schemas";

export const invitationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingrese el correo")
    .email("Ingrese un correo válido"),
  // Empty: no position, the invitation only links the account.
  positionId: z.string(),
  // Empty: only the email is known; the API links the person of the node that
  // has it, and whoever accepts says their name when there is none.
  personId: z.string(),
});

export type InvitationFormValues = z.infer<typeof invitationSchema>;

export const emptyInvitation: InvitationFormValues = {
  email: "",
  positionId: "",
  personId: "",
};

// Body of POST /organizations/{id}/invitations.
export const toInvitationRequest = (
  values: InvitationFormValues,
): CreateInvitationRequest => ({
  email: values.email.trim(),
  ...(values.positionId ? { positionId: values.positionId } : {}),
  ...(values.personId ? { personId: values.personId } : {}),
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
