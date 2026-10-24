import { z } from "zod";
import type { CreateChurchRequest } from "@/app/(api)/generated/aPISrTommy.schemas";
import {
  emptySocialLinks,
  socialLinksSchema,
  toSocialLinksRequest,
} from "../(components)/SocialLinks";

// Positions (cargos) offered when a church is created. They are only a start:
// the church can rename or remove them, before saving and at any time after.
export const suggestedPositions = [
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
  positions: z.array(z.string()),
});

export type CreateChurchForm = z.infer<typeof createChurchSchema>;

export const emptyCreateChurchForm: CreateChurchForm = {
  name: "",
  socialLinks: emptySocialLinks,
  location: { name: "Sede principal", address: "", phoneNumber: "+51" },
  positions: suggestedPositions,
};

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
  positions: values.positions.map((name) => name.trim()).filter(Boolean),
});
