import type { PersonResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

// How a person's name is shown in lists and pickers.
export const fullName = (
  person: Readonly<Pick<PersonResponse, "firstName" | "lastName">>,
) => person.firstName + " " + person.lastName;
