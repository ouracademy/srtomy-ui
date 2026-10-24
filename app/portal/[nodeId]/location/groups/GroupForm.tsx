import { Box, Grid, Stack, Typography } from "@mui/material";
import {
  FormContainer,
  RadioButtonGroup,
  TextFieldElement,
  useForm,
} from "react-hook-form-mui";
import React from "react";
import { GroupTypeLabels } from "./Group";
import { GroupAutocomplete } from "./GroupAutocomplete";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SaveButton } from "@/app/(components)/SaveButton";
import { socialLinksSchema } from "@/app/(components)/SocialLinks";
import { SocialLinksFields } from "@/app/(components)/SocialLinksFields";

const baseSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Por favor ingrese el nombre del Grupo o ministerio" }),
  description: z.string().optional(),
  type: z.enum(["GROUP", "MINISTRY"]),
  members: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
  leaders: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
  socialLinks: socialLinksSchema,
});

export const initialValuesSchema = baseSchema;

export type GroupInitialValues = z.infer<typeof initialValuesSchema>;

type GroupFormContext = {
  // Node whose people can be picked as leaders and members (the parent).
  nodeId: string;
  initialValues: GroupInitialValues;
  submit: (data: GroupInitialValues) => Promise<void>;
  canSave?: boolean;
};

export const GroupForm = ({
  nodeId,
  submit,
  initialValues,
  canSave = true,
}: GroupFormContext) => {
  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(initialValuesSchema),
  });

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Box sx={{ maxWidth: 1200, margin: 4 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              <Typography variant="h5" gutterBottom>
                Datos generales del Grupo / Ministerio
              </Typography>
              <TextFieldElement fullWidth name="name" label="Nombre" required />
              <TextFieldElement
                fullWidth
                name="description"
                label="Descripción"
                multiline
                rows={4}
              />
              <RadioButtonGroup
                label="Tipo"
                name="type"
                options={[
                  {
                    id: "GROUP",
                    label: GroupTypeLabels.GROUP,
                  },
                  {
                    id: "MINISTRY",
                    label: GroupTypeLabels.MINISTRY,
                  },
                ]}
                row
              />
              <SocialLinksFields prefix="socialLinks" />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Miembros
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Seleccione quienes conforman su grupo / ministerio
                </Typography>
              </Box>

              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="h6">Lider(es):</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                  <GroupAutocomplete
                    nodeId={nodeId}
                    name="leaders"
                    label="Escriba/seleccione el lider o lideres"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="h6">Miembro(s):</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                  <GroupAutocomplete
                    nodeId={nodeId}
                    name="members"
                    label="Escriba/seleccione los miembros"
                  />
                </Grid>
              </Grid>
            </Stack>
          </Grid>
          {canSave && (
            <Box>
              <SaveButton
                name="Guardar"
                loading={formContext.formState.isSubmitting}
              />
            </Box>
          )}
        </Grid>
      </Box>
    </FormContainer>
  );
};
