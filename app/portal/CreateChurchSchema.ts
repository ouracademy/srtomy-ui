import { z } from "zod";
import type {
  CreateChurchRequest,
  RoleResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { levelIdByName, toAccessRoleId } from "../(components)/accessLevels";
import {
  emptySocialLinks,
  socialLinksSchema,
  toSocialLinksRequest,
} from "../(components)/SocialLinks";

// Positions (cargos) offered when a church is created, with the access level
// they usually have (by the level's name). They are only a start: the church
// can rename, remove or change them, before saving and at any time after.
export const suggestedPositions = [
  { name: "Pastor", level: "Administrador" },
  { name: "Líder de alabanza", level: "Líder" },
  { name: "Servidor", level: "Colaborador" },
  { name: "Maestro", level: "Colaborador" },
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
  positions: z.array(z.object({ name: z.string(), accessRoleId: z.string() })),
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

/** The form with the suggested positions, once the church's levels are known. */
export const initialCreateChurchForm = (
  levels: RoleResponse[],
): CreateChurchForm => ({
  ...emptyCreateChurchForm,
  positions: suggestedPositions.map(({ name, level }) => ({
    name,
    accessRoleId: levelIdByName(levels, level),
  })),
  creator: { ...emptyCreateChurchForm.creator, positionName: "Pastor" },
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
    .map(({ name, accessRoleId }) => ({
      name: name.trim(),
      accessRoleId: toAccessRoleId(accessRoleId),
    }))
    .filter(({ name }) => name),
  creator: {
    firstName: values.creator.firstName.trim(),
    lastName: values.creator.lastName.trim(),
    positionName: values.creator.positionName.trim() || undefined,
  },
});
