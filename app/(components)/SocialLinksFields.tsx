"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { TextFieldElement } from "react-hook-form-mui";
import { socialLinkFields } from "./SocialLinks";

// "Otras opciones": optional links, collapsed so they do not slow down the
// main form. `prefix` is the path of the links object in the form values.
export const SocialLinksFields = ({ prefix }: { prefix: string }) => (
  <Accordion disableGutters variant="outlined">
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Otras opciones (redes sociales y sitio web)</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Stack spacing={2}>
        {socialLinkFields.map(({ name, label }) => (
          <TextFieldElement
            key={name}
            name={`${prefix}.${name}`}
            label={label}
            placeholder="https://"
            fullWidth
          />
        ))}
      </Stack>
    </AccordionDetails>
  </Accordion>
);
