"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Autocomplete,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Controller,
  FormContainer,
  TextFieldElement,
  useForm,
  useWatch,
} from "react-hook-form-mui";
import {
  useGetIamPermissions,
  useGetPositionsSuggestions,
} from "@/app/(api)/generated";
import type {
  PermissionGroupResponse,
  PositionSuggestionResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import Loading from "../(components)/Loading";
import { PositionsField } from "../(components)/PositionsField";
import { SaveButton } from "../(components)/SaveButton";
import { SocialLinksFields } from "../(components)/SocialLinksFields";
import { TelFieldElement } from "../(components)/TelFieldElement";
import {
  createChurchSchema,
  initialCreateChurchForm,
  type CreateChurchForm as CreateChurchValues,
} from "./CreateChurchSchema";

// A church is always created with its first location, so the app never has a
// church without a place where people meet.
export const CreateChurchForm = ({
  submit,
}: {
  submit: (values: CreateChurchValues) => Promise<void>;
}) => {
  const { data: suggestions } = useGetPositionsSuggestions();
  const { data: catalog } = useGetIamPermissions();
  // The starting positions copy the permissions of the suggestions, so wait.
  if (!suggestions || !catalog) return <Loading />;
  return (
    <CreateChurchFields
      suggestions={suggestions}
      catalog={catalog}
      submit={submit}
    />
  );
};

const CreateChurchFields = ({
  suggestions,
  catalog,
  submit,
}: {
  suggestions: PositionSuggestionResponse[];
  catalog: PermissionGroupResponse[];
  submit: (values: CreateChurchValues) => Promise<void>;
}) => {
  const formContext = useForm<CreateChurchValues>({
    defaultValues: initialCreateChurchForm(suggestions),
    resolver: zodResolver(createChurchSchema),
  });
  const positions = useWatch({
    control: formContext.control,
    name: "positions",
  });

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
            3. Cargos y permisos
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Cada cargo da un nivel de acceso a la aplicación a quien lo tenga.
            Quite, agregue o renombre los cargos como los llaman en su iglesia y
            cambie el nivel de cada uno. Podrá ajustarlos después.
          </Typography>
          <Controller
            control={formContext.control}
            name="positions"
            render={({ field }) => (
              <PositionsField
                value={field.value}
                onChange={field.onChange}
                catalog={catalog}
                suggestions={suggestions}
              />
            )}
          />
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            4. Usted
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Quedará registrado como persona de la iglesia con su cargo. Siempre
            será Propietario.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextFieldElement
                name="creator.firstName"
                label="Sus nombres"
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextFieldElement
                name="creator.lastName"
                label="Sus apellidos"
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                control={formContext.control}
                name="creator.positionName"
                render={({ field }) => (
                  <Autocomplete
                    freeSolo
                    options={positions
                      .map((p) => p.name.trim())
                      .filter(Boolean)}
                    inputValue={field.value}
                    onInputChange={(_event, value) => field.onChange(value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Su cargo" />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>
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
