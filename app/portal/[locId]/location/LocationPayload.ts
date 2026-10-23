import type { UpdateLocationRequest } from "@/app/(api)/generated/aPISrTommy.schemas";
import type { LocationDetailForm } from "./LocationSchema";

// The API overwrites the whole location on update, so the description the form
// does not edit must travel with the request or it would be cleared on save.
export const toLocationPayload = (
  values: LocationDetailForm,
  {
    description,
    fixedOptions,
  }: { description?: string; fixedOptions: string[] },
): UpdateLocationRequest => ({
  name: values.name,
  description: description ?? "",
  address: values.address,
  phoneNumber: values.phoneNumber,
  roles: values.roles.filter((role) => !fixedOptions.includes(role)),
});
