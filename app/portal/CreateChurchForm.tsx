"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import { FormContainer, TextFieldElement, useForm } from "react-hook-form-mui";
import { useGetPositionsSuggestions } from "@/app/(api)/generated";
import { NamesInput } from "../(components)/NamesInput";
import { SaveButton } from "../(components)/SaveButton";
import { SocialLinksFields } from "../(components)/SocialLinksFields";
import { TelFieldElement } from "../(components)/TelFieldElement";
import {
  createChurchSchema,
  emptyCreateChurchForm,
  suggestedPositions,
  type CreateChurchForm as CreateChurchValues,
} from "./CreateChurchSchema";

// A church is always created with its first location, so the app never has a
// church without a place where people meet.
export const CreateChurchForm = ({
  submit,
}: {
  submit: (values: CreateChurchValues) => Promise<void>;
}) => {
  const formContext = useForm<CreateChurchValues>({
    defaultValues: emptyCreateChurchForm,
    resolver: zodResolver(createChurchSchema),
  });
  const { data: suggestions } = useGetPositionsSuggestions();

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            1. Tu iglesia
          </Typography>
          <Stack spacing={2}>
            <TextFieldElement
              name="name"
              label="Nombre de la iglesia"
              required
              fullWidth
            />
            <SocialLinksFields prefix="socialLinks" />
          </Stack>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            2. Primera sede
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Toda iglesia tiene al menos una sede. Luego podrá registrar más.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextFieldElement
                name="location.name"
                label="Nombre de la sede"
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextFieldElement
                name="location.address"
                label="Dirección"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TelFieldElement name="location.phoneNumber" />
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            3. Cargos
          </Typography>
          <NamesInput
            name="positions"
            label="Cargos de su iglesia"
            suggestions={suggestions ?? suggestedPositions}
            helperText="Quite, agregue o renombre los cargos como los llaman en su iglesia. Podrá cambiarlos después."
          />
        </Paper>
        <div>
          <SaveButton
            name="Crear iglesia"
            loading={formContext.formState.isSubmitting}
          />
        </div>
      </Stack>
    </FormContainer>
  );
};
