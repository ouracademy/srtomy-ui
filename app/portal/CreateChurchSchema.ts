import { z } from "zod";
import type {
  CreateChurchRequest,
  PositionSuggestionResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import {
  emptySocialLinks,
  socialLinksSchema,
  toSocialLinksRequest,
} from "../(components)/SocialLinks";

// Positions (cargos) the sign-up starts with. Their permissions come from the
// API's suggestions (a copy of what each one usually gives). They are only a
// start: the church can rename, remove or change them, now and at any time.
export const startingPositions = [
  "Pastor",
  "Líder de alabanza",
  "Servidor",
  "Maestro",
];

export const createChurchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Ingrese el nombre de la iglesia" }),
  socialLinks: socialLinksSchema,
  location: z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Ingrese el nombre de la primera sede" }),
    address: z.string().trim(),
    phoneNumber: z.string(),
  }),
  positions: z.array(
    z.object({ name: z.string(), permissions: z.array(z.string()) }),
  ),
  // Whoever creates the church is its first person, with their own position.
  creator: z.object({
    firstName: z.string().trim().min(1, { message: "Ingrese su nombre" }),
    lastName: z.string().trim().min(1, { message: "Ingrese su apellido" }),
    positionName: z.string(),
  }),
});

export type CreateChurchForm = z.infer<typeof createChurchSchema>;

export const emptyCreateChurchForm: CreateChurchForm = {
  name: "",
  socialLinks: emptySocialLinks,
  location: { name: "Sede principal", address: "", phoneNumber: "+51" },
  positions: [],
  creator: { firstName: "", lastName: "", positionName: "" },
};

/** The form with the starting positions, once the suggestions are known. */
export const initialCreateChurchForm = (
  suggestions: PositionSuggestionResponse[],
  creatorName: { firstName: string; lastName: string } = {
    firstName: "",
    lastName: "",
  },
): CreateChurchForm => ({
  ...emptyCreateChurchForm,
  positions: startingPositions.map((name) => ({
    name,
    permissions: suggestions.find((s) => s.name === name)?.permissions ?? [],
  })),
  creator: { ...creatorName, positionName: "Pastor" },
});

// "+51" alone is the country prefix the phone field starts with, not a number.
const phoneOrUndefined = (phone: string) =>
  /^\+\d{1,3}$/.test(phone.trim()) || phone.trim() === "" ? undefined : phone;

export const toCreateChurchRequest = (
  values: CreateChurchForm,
): CreateChurchRequest => ({
  name: values.name.trim(),
  socialLinks: toSocialLinksRequest(values.socialLinks),
  location: {
    name: values.location.name.trim(),
    address: values.location.address.trim() || undefined,
    phoneNumber: phoneOrUndefined(values.location.phoneNumber),
  },
  positions: values.positions
    .map(({ name, permissions }) => ({ name: name.trim(), permissions }))
    .filter(({ name }) => name),
  creator: {
    firstName: values.creator.firstName.trim(),
    lastName: values.creator.lastName.trim(),
    positionName: values.creator.positionName.trim() || undefined,
  },
});
