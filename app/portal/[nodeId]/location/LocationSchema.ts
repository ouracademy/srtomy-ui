import { z } from "zod";
import type {
  OrganizationRequest,
  OrganizationResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import {
  socialLinksSchema,
  toSocialLinksForm,
  toSocialLinksRequest,
} from "@/app/(components)/SocialLinks";

// Details of a church or a location. Positions (cargos) are no longer edited
// here: they belong to the church and have their own section.
export const organizationSchema = z.object({
  name: z.string().trim().min(1, { message: "Por favor ingrese el nombre" }),
  address: z.string(),
  phoneNumber: z.string(),
  socialLinks: socialLinksSchema,
});

export type OrganizationDetailForm = z.infer<typeof organizationSchema>;

export const toOrganizationForm = (
  organization: OrganizationResponse,
): OrganizationDetailForm => ({
  name: organization.name ?? "",
  address: organization.address ?? "",
  phoneNumber: organization.phoneNumber ?? "",
  socialLinks: toSocialLinksForm(organization.socialLinks),
});

// The API overwrites the whole node on update, so the description the form
// does not edit must travel with the request or it would be cleared on save.
export const toOrganizationPayload = (
  values: OrganizationDetailForm,
  { description, parentId }: { description?: string; parentId?: string },
): OrganizationRequest => ({
  name: values.name.trim(),
  description: description ?? "",
  address: values.address,
  phoneNumber: values.phoneNumber,
  socialLinks: toSocialLinksRequest(values.socialLinks),
  parentId,
});
