"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PublicOutlined from "@mui/icons-material/PublicOutlined";
import {
  Box,
  Button,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form-mui";
import { FormSection } from "@/app/(components)/FormSection";
import {
  memberVisibilities,
  memberVisibilityLabels,
  publicPagePath,
  type MemberVisibility,
} from "@/app/(components)/visibility";

type GroupVisibilitySectionProps = Readonly<{
  // Without permission to edit, the options are shown but cannot be changed.
  disabled?: boolean;
  // Slug of the group, to show the address of its public page.
  slug?: string;
  // Copies the address to the clipboard.
  onCopy?: (url: string) => void;
}>;

// Who sees the list of people of the group, one card per option. The form
// must have a `memberVisibility` field.
export const GroupVisibilitySection = ({
  disabled = false,
  slug,
  onCopy,
}: GroupVisibilitySectionProps) => {
  const { control } = useFormContext();
  const url = slug
    ? `${globalThis.location?.origin ?? ""}${publicPagePath(slug)}`
    : undefined;

  return (
    <FormSection
      title="Visibilidad"
      description="¿Quién ve la lista de personas? El nombre, la descripción, el horario y el equipo se ven siempre en el directorio de la iglesia."
    >
      <Controller
        control={control}
        name="memberVisibility"
        render={({ field }) => (
          <>
            <RadioGroup
              name={field.name}
              value={field.value}
              onChange={(_event, value) => field.onChange(value)}
              aria-label="¿Quién ve la lista de personas?"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              {memberVisibilities.map((value) => (
                <VisibilityOption
                  key={value}
                  value={value}
                  selected={field.value === value}
                  disabled={disabled}
                />
              ))}
            </RadioGroup>
            {url && field.value === "PUBLIC" && (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  flexWrap: "wrap",
                  mt: 2,
                  p: 1,
                  pl: 1.5,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                <PublicOutlined
                  fontSize="small"
                  sx={{ color: "text.secondary" }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    flex: "1 1 200px",
                    minWidth: 0,
                    overflowWrap: "anywhere",
                  }}
                >
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
          </>
        )}
      />
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
        Nunca se muestra a menores de 18 años, y la página pública solo nombra a
        personas con edad registrada.
      </Typography>
    </FormSection>
  );
};

const VisibilityOption = ({
  value,
  selected,
  disabled,
}: Readonly<{
  value: MemberVisibility;
  selected: boolean;
  disabled: boolean;
}>) => {
  const { label, help } = memberVisibilityLabels[value];
  const titleId = `visibility-${value}-title`;
  const helpId = `visibility-${value}-help`;
  return (
    <Paper
      component="label"
      variant="outlined"
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        borderRadius: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        borderWidth: selected ? 2 : 1,
        // The border grows by 1px when selected: take it from the padding so
        // the card does not change size.
        p: selected ? "11px" : "12px",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "action.selected" : "background.paper",
      }}
    >
      <Radio
        value={value}
        disabled={disabled}
        sx={{ p: 0.25 }}
        slotProps={{
          input: {
            "aria-labelledby": titleId,
            "aria-describedby": helpId,
          },
        }}
      />
      <Box>
        <Typography id={titleId} sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography
          id={helpId}
          variant="body2"
          sx={{ color: "text.secondary" }}
        >
          {help}
        </Typography>
      </Box>
    </Paper>
  );
};
