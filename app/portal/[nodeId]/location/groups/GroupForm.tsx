import { Box, Grid, Stack, Typography } from "@mui/material";
import {
  CheckboxElement,
  FormContainer,
  RadioButtonGroup,
  TextFieldElement,
  useForm,
  useWatch,
} from "react-hook-form-mui";
import React from "react";
import { GroupTypeLabels } from "./Group";
import { GroupAutocomplete } from "./GroupAutocomplete";
import { leadersToInvite } from "./leaderInvitations";
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
      // Only people picked from the search carry it; saved leaders do not.
      email: z.string().optional(),
    }),
  ),
  // Invite the leaders that have an email to use the app, after saving.
  inviteLeaders: z.boolean(),
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
  // The user may invite people to use the app (shows the checkbox).
  canInvite?: boolean;
};

export const GroupForm = ({
  nodeId,
  submit,
  initialValues,
  canSave = true,
  canInvite = false,
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
                {canInvite && (
                  <Grid size={{ xs: 12 }}>
                    <InviteLeadersCheckbox />
                  </Grid>
                )}
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

// Offered when some chosen leader has an email: they get an invitation to use
// the app once the group is saved.
const InviteLeadersCheckbox = () => {
  const leaders = useWatch<GroupInitialValues, "leaders">({ name: "leaders" });
  const count = leadersToInvite(leaders ?? []).length;
  if (count === 0) return null;
  return (
    <CheckboxElement
      name="inviteLeaders"
      label={
        count === 1
          ? "Invitar a usar la app al líder con correo"
          : `Invitar a usar la app a los ${count} líderes con correo`
      }
    />
  );
};
