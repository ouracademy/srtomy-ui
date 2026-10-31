import type {
  OrganizationResponse,
  UpdateLocationChildRequest,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import type { GroupInitialValues } from "./GroupForm";
import {
  toVisibilityForm,
  toVisibilityRequest,
} from "@/app/(components)/visibility";
import {
  toSocialLinksForm,
  toSocialLinksRequest,
} from "@/app/(components)/SocialLinks";

// Maps a group to the form values. Its people are managed in "Personas".
export const toGroupInitialValues = (
  group: OrganizationResponse,
): GroupInitialValues => ({
  name: group.name ?? "",
  description: group.description ?? "",
  type: group.type === "MINISTRY" ? "MINISTRY" : "GROUP",
  socialLinks: toSocialLinksForm(group.socialLinks),
  ...toVisibilityForm(group),
});

// Builds the body of PUT /organizations/locations/childs/{id} from the form values.
export const toUpdateLocationChildRequest = (
  values: GroupInitialValues,
): UpdateLocationChildRequest => ({
  name: values.name,
  description: values.description,
  type: values.type,
  socialLinks: toSocialLinksRequest(values.socialLinks),
  ...toVisibilityRequest(values),
});
