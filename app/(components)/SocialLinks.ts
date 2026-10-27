import { z } from "zod";
import type {
  SocialLinks,
  SocialLinksRequest,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";

// Optional public links of a church, location, group or ministry.
export const socialLinkFields = [
  { name: "website", label: "Sitio web" },
  { name: "facebookUrl", label: "Facebook" },
  { name: "instagramUrl", label: "Instagram" },
  { name: "youtubeUrl", label: "YouTube" },
  { name: "tiktokUrl", label: "TikTok" },
] as const;

const link = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\/\S+$/.test(value), {
    message: "Debe ser un enlace que empiece con http:// o https://",
  });

export const socialLinksSchema = z.object({
  website: link,
  facebookUrl: link,
  instagramUrl: link,
  youtubeUrl: link,
  tiktokUrl: link,
});

export type SocialLinksForm = z.infer<typeof socialLinksSchema>;

export const emptySocialLinks: SocialLinksForm = {
  website: "",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
};

/** Form values from the links the API returned (missing ones become ""). */
export const toSocialLinksForm = (links?: SocialLinks): SocialLinksForm => ({
  website: links?.website ?? "",
  facebookUrl: links?.facebookUrl ?? "",
  instagramUrl: links?.instagramUrl ?? "",
  youtubeUrl: links?.youtubeUrl ?? "",
  tiktokUrl: links?.tiktokUrl ?? "",
});

/** Request body: blank links are sent as absent. */
export const toSocialLinksRequest = (
  links: SocialLinksForm,
): SocialLinksRequest =>
  Object.fromEntries(
    Object.entries(links)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== ""),
  );
