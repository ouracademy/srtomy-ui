"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import {
  CheckboxElement,
  RadioButtonGroup,
  TextFieldElement,
  useWatch,
} from "react-hook-form-mui";
import {
  memberVisibilities,
  memberVisibilityLabels,
  publicPagePath,
  type MemberVisibility,
} from "./visibility";

type VisibilityFieldsProps = Readonly<{
  // Offer the org chart switch (churches and locations only).
  orgChart?: boolean;
  // Slug of the node, to show the address of its public page.
  slug?: string;
  // Copies the address to the clipboard.
  onCopy?: (url: string) => void;
}>;

// "Horario y visibilidad": when the node meets and who sees its people. The
// form must have `schedule`, `memberVisibility` and `showOrgChart` fields.
export const VisibilityFields = ({
  orgChart = false,
  slug,
  onCopy,
}: VisibilityFieldsProps) => {
  const visibility = useWatch({ name: "memberVisibility" }) as MemberVisibility;
  const url = slug
    ? `${globalThis.location?.origin ?? ""}${publicPagePath(slug)}`
    : undefined;

  return (
    <Accordion disableGutters variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Horario y visibilidad</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <TextFieldElement
            name="schedule"
            label="Horario de reunión"
            placeholder="Sábados 5 pm"
            fullWidth
          />
          <RadioButtonGroup
            name="memberVisibility"
            label="¿Quién ve la lista de personas?"
            options={memberVisibilities.map((value) => ({
              id: value,
              label: memberVisibilityLabels[value].label,
            }))}
          />
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            {memberVisibilityLabels[visibility]?.help} El nombre, la
            descripción, el horario y los líderes se ven siempre en el
            directorio de la iglesia. Nunca se muestra a menores de 18 años, y
            la página pública solo nombra a personas con edad registrada.
          </Typography>
          {orgChart && (
            <CheckboxElement
              name="showOrgChart"
              label="Mostrar el organigrama en la página pública"
            />
          )}
          {url && visibility === "PUBLIC" && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
              }}
            >
              <Typography variant="body2">
                Página pública: <a href={url}>{url}</a>
              </Typography>
              {onCopy && (
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => onCopy(url)}
                >
                  Copiar enlace
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
