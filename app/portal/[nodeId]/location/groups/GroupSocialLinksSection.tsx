"use client";

import React from "react";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Facebook from "@mui/icons-material/Facebook";
import Instagram from "@mui/icons-material/Instagram";
import LanguageOutlined from "@mui/icons-material/LanguageOutlined";
import MusicNoteOutlined from "@mui/icons-material/MusicNoteOutlined";
import YouTube from "@mui/icons-material/YouTube";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import {
  TextFieldElement,
  useFormContext,
  useWatch,
} from "react-hook-form-mui";
import {
  socialLinkFields,
  type SocialLinksForm,
} from "@/app/(components)/SocialLinks";

// TikTok has no icon in MUI: a music note stands in for it.
const icons: Record<keyof SocialLinksForm, SvgIconComponent> = {
  website: LanguageOutlined,
  facebookUrl: Facebook,
  instagramUrl: Instagram,
  youtubeUrl: YouTube,
  tiktokUrl: MusicNoteOutlined,
};

type GroupSocialLinksSectionProps = Readonly<{
  // `prefix` is the path of the links object in the form values.
  prefix: string;
  disabled?: boolean;
}>;

// Optional links of the group, folded away so the form stays short. The
// summary shows which networks already have a link. The fields stay mounted,
// so what is typed is saved even while it is folded.
export const GroupSocialLinksSection = ({
  prefix,
  disabled = false,
}: GroupSocialLinksSectionProps) => {
  const [userOpen, setUserOpen] = React.useState(false);
  const {
    formState: { errors },
  } = useFormContext();
  const links = useWatch({ name: prefix }) as Partial<SocialLinksForm>;
  // A wrong link inside a folded block would stop the save without a sign.
  const open = userOpen || Boolean(errors[prefix]);

  return (
    <Accordion
      disableGutters
      variant="outlined"
      expanded={open}
      onChange={() => setUserOpen(!open)}
      sx={{ borderRadius: 3, "&::before": { display: "none" } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="social-links-content"
        id="social-links-header"
      >
        <Box>
          <Typography variant="h6" component="h2">
            Redes sociales y sitio web
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Sitio, Facebook, Instagram, YouTube y TikTok · opcional
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} aria-hidden>
            {socialLinkFields.map(({ name }) => (
              <NetworkIcon
                key={name}
                name={name}
                filled={Boolean(links?.[name]?.trim())}
                size={28}
              />
            ))}
          </Stack>
        </Box>
      </AccordionSummary>
      <AccordionDetails id="social-links-content">
        <Stack spacing={2}>
          {socialLinkFields.map(({ name, label }) => (
            <Stack
              key={name}
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "flex-start" }}
            >
              <NetworkIcon name={name} filled size={40} />
              <TextFieldElement
                name={`${prefix}.${name}`}
                label={label}
                placeholder="https://"
                fullWidth
                disabled={disabled}
              />
            </Stack>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

const NetworkIcon = ({
  name,
  filled,
  size,
}: Readonly<{
  name: keyof SocialLinksForm;
  filled: boolean;
  size: number;
}>) => {
  const Icon = icons[name];
  return (
    <Avatar
      variant="rounded"
      sx={{
        width: size,
        height: size,
        borderRadius: 2,
        flex: "none",
        bgcolor: filled ? "primary.light" : "action.hover",
        color: filled ? "primary.contrastText" : "text.secondary",
      }}
    >
      <Icon sx={{ fontSize: size * 0.55 }} />
    </Avatar>
  );
};
