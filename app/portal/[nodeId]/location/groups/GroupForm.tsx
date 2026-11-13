import { Alert, Box, Grid, Stack } from "@mui/material";
import {
  FormContainer,
  TextFieldElement,
  ToggleButtonGroupElement,
  useForm,
} from "react-hook-form-mui";
import React from "react";
import { GroupTypeLabels } from "./Group";
import { GroupHeader } from "./GroupHeader";
import { GroupSocialLinksSection } from "./GroupSocialLinksSection";
import { GroupVisibilitySection } from "./GroupVisibilitySection";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormSection } from "@/app/(components)/FormSection";
import { SaveButton } from "@/app/(components)/SaveButton";
import { socialLinksSchema } from "@/app/(components)/SocialLinks";
import { visibilitySchema } from "@/app/(components)/visibility";

const baseSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Por favor ingrese el nombre del Grupo o ministerio" }),
  description: z.string().optional(),
  type: z.enum(["GROUP", "MINISTRY"]),
  ...visibilitySchema.shape,
  socialLinks: socialLinksSchema,
});

export const initialValuesSchema = baseSchema;

export type GroupInitialValues = z.infer<typeof initialValuesSchema>;

type GroupFormContext = {
  initialValues: GroupInitialValues;
  submit: (data: GroupInitialValues) => Promise<void>;
  canSave?: boolean;
  // Address of the public page, to show and copy.
  slug?: string;
  onCopy?: (url: string) => void;
};

export const GroupForm = ({
  submit,
  initialValues,
  canSave = true,
  slug,
  onCopy,
}: GroupFormContext) => {
  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(initialValuesSchema),
  });

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Stack spacing={3} sx={{ maxWidth: 760 }}>
        <GroupHeader />
        {!canSave && (
          <Alert severity="info">
            Puede ver estos datos, pero no cambiarlos. Pídale a un líder que lo
            haga.
          </Alert>
        )}
        <FormSection
          title="Identidad"
          description="Cómo se llama y de qué trata."
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: "grow" }}>
              <TextFieldElement
                fullWidth
                name="name"
                label="Nombre"
                required
                disabled={!canSave}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: "auto" }}>
              <ToggleButtonGroupElement
                name="type"
                aria-label="Tipo"
                exclusive
                enforceAtLeastOneSelected
                disabled={!canSave}
                sx={{
                  height: 56,
                  // The default selected look (primary text on a pale wash)
                  // is under the 4.5:1 contrast of WCAG AA.
                  // "& .MuiToggleButton-root.Mui-selected": {
                  //   bgcolor: "primary.dark",
                  //   color: "primary.contrastText",
                  //   "&:hover": { bgcolor: "primary.dark" },
                  // },
                  "&& .MuiToggleButton-root.Mui-selected": {
                    bgcolor: "primary.dark",
                    color: "#ffffff",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                }}
                options={[
                  { id: "GROUP", label: GroupTypeLabels.GROUP },
                  { id: "MINISTRY", label: GroupTypeLabels.MINISTRY },
                ]}
              />
            </Grid>
            <Grid size={12}>
              <TextFieldElement
                fullWidth
                name="description"
                label="Descripción"
                multiline
                rows={3}
                disabled={!canSave}
              />
            </Grid>
          </Grid>
        </FormSection>
        <FormSection title="Reunión" description="Cuándo se junta.">
          <TextFieldElement
            fullWidth
            name="schedule"
            label="Horario"
            placeholder="Sábados 5 pm"
            disabled={!canSave}
          />
        </FormSection>
        <GroupVisibilitySection
          disabled={!canSave}
          slug={slug}
          onCopy={onCopy}
        />
        <GroupSocialLinksSection prefix="socialLinks" disabled={!canSave} />
        {canSave && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              borderTop: 1,
              borderColor: "divider",
              pt: 2,
            }}
          >
            <SaveButton
              name="Guardar"
              loading={formContext.formState.isSubmitting}
            />
          </Box>
        )}
      </Stack>
    </FormContainer>
  );
};
