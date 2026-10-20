"use client";

import {
  Autocomplete,
  Button,
  Chip,
  TextField,
  Typography,
  Grid,
} from "@mui/material";
import { FormContainer, TextFieldElement, useForm } from "react-hook-form-mui";
import { TelFieldElement } from "../person/PersonForm";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveButton } from "@/app/(components)/SaveButton";

const schema = z.object({
  name: z
    .string()
    .min(1, { message: "Por favor ingrese el nombre de la sede" }),
  address: z.string().min(1, { message: "Por favor ingrese la dirección" }),
  phoneNumber: z.string(),
  roles: z.array(z.string()),
});

export type LocationDetailForm = z.infer<typeof schema>;

type LocationFormProps = {
  title: string;
  initialValues: LocationDetailForm;
  submit: (data: LocationDetailForm) => Promise<void>;
  fixedOptions: string[];
};

export const LocationForm = ({
  title,
  submit,
  initialValues,
  fixedOptions,
}: LocationFormProps) => {
  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Grid container spacing={2} margin={4}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement name="name" label="Nombre" required fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement
            name="address"
            label="Dirección"
            required
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TelFieldElement name="phoneNumber" />
        </Grid>
        <Grid size={{ xs: 12 }} container alignItems="center">
          <Grid size={{ xs: 12 }} sx={{ padding: "0px 0px 0px 8px" }}>
            <Typography variant="h6">Roles en la Iglesia:</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              freeSolo
              multiple
              clearOnBlur
              id="roles"
              options={[]}
              value={formContext.getValues().roles}
              onChange={(event, newValue) => {
                formContext.setValue(
                  "roles",
                  [
                    ...fixedOptions,
                    ...newValue.filter(
                      (option) => fixedOptions.indexOf(option) === -1,
                    ),
                  ],
                  { shouldValidate: true },
                );
              }}
              renderValue={(tagValue, getTagProps) => {
                return Array.isArray(tagValue)
                  ? tagValue.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                        disabled={fixedOptions.indexOf(option) !== -1}
                      />
                    ))
                  : null;
              }}
              renderInput={(params) => (
                <TextField
                  required
                  placeholder="Si desea añada otros roles, luego presione enter"
                  {...params}
                />
              )}
            />
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SaveButton name="Guardar" />
          {/* <Button type="submit" variant="contained">
            Guardar
          </Button> */}
        </Grid>
      </Grid>
    </FormContainer>
  );
};
