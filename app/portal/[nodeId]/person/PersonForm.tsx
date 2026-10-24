"use client";

import { Option } from "@/app/(components)/Option";
import { zodResolver } from "@hookform/resolvers/zod";
import { Typography, Grid } from "@mui/material";
import { differenceInYears } from "date-fns";
import { MuiTelInput } from "mui-tel-input";
import {
  AutocompleteElement,
  Controller,
  FormContainer,
  RadioButtonGroup,
  TextFieldElement,
  useForm,
  useFormContext,
} from "react-hook-form-mui";
import { DatePickerElement } from "react-hook-form-mui/date-pickers";
import { z } from "zod";
import { useGetOrganizationsLocationsByIdRoles } from "@/app/(api)/generated";
import type {
  AccountabilityTypeDto,
  CreatePersonRequest,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { formatISO } from "date-fns";
import { toSpanish } from "../location/Roles";
import { SaveButton } from "@/app/(components)/SaveButton";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";

const requiredFirstNameMessage = "Por favor ingrese su nombre";
const requiredLastNameMessage = "Por favor ingrese su apellido";

const schema = z.object({
  firstName: z.string().trim().min(1, { message: requiredFirstNameMessage }),
  lastName: z.string().trim().min(1, { message: requiredLastNameMessage }),
  phoneNumber: z.string().optional(),
  age: z.number().optional(),
  birthdate: z.date().optional().nullable(),
  hasBeenBaptized: z.enum(["YES", "NO"]).optional(),
  roles: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
});

export type PersonDetailFormData = z.infer<typeof schema>;

// Form values -> body of POST/PUT /people.
export const toPersonPayload = (
  data: PersonDetailFormData,
  organizationId: string,
): CreatePersonRequest => ({
  firstName: data.firstName,
  lastName: data.lastName,
  phoneNumber: data.phoneNumber,
  age: data.age,
  birthdate: data.birthdate
    ? formatISO(data.birthdate, { representation: "date" })
    : undefined,
  hasBeenBaptized: data.hasBeenBaptized === "YES",
  organizationId,
  roles: data.roles.map((x) => x.id),
});

type PersonFormProps = {
  initialValues: PersonDetailFormData;
  submit: (data: PersonDetailFormData) => Promise<void>;
  locId: string;
};

function isValidDate(date: Date) {
  return date instanceof Date && !isNaN(date.getTime());
}

export const PersonForm = ({
  initialValues,
  submit,
  locId,
}: PersonFormProps) => {
  const {
    data: roles,
    error: rolesError,
    isLoading,
  } = useGetOrganizationsLocationsByIdRoles(locId);

  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });

  if (isLoading) return <Loading />;
  if (!roles) return <ResourceError error={rolesError} />;

  const handleChange = (birthdate: Date | null) => {
    formContext.setValue("birthdate", birthdate);

    if (birthdate && isValidDate(birthdate)) {
      const age = differenceInYears(new Date(), birthdate);
      formContext.setValue("age", age);
    }
  };

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Grid container spacing={2} margin={4}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" gutterBottom>
            Datos generales de persona
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement
            fullWidth
            name="firstName"
            label="Nombre"
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement
            fullWidth
            name="lastName"
            label="Apellido"
            required
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TelFieldElement name="phoneNumber" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <DatePickerElement
            sx={{ width: "100%" }}
            name="birthdate"
            label="Fecha de nacimiento"
            onChange={handleChange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextFieldElement
            fullWidth
            name="age"
            label="Edad"
            type="number"
            disabled
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <RadioButtonGroup
            label="Bautizado:"
            name="hasBeenBaptized"
            options={[
              {
                id: "YES",
                label: "Si",
              },
              {
                id: "NO",
                label: "No",
              },
            ]}
            row
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Grid sx={{ paddingBottom: "10px" }}>
            <Typography variant="h6">Roles:</Typography>
          </Grid>
          <AutocompleteElement
            multiple
            name="roles"
            label="Escriba o seleccione el rol(es)"
            options={roles.map(roleToOption)}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SaveButton
            name="Guardar"
            loading={formContext.formState.isSubmitting}
          />
        </Grid>
      </Grid>
    </FormContainer>
  );
};

export const TelFieldElement = ({ name }: { name: string }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <MuiTelInput
          name={field.name}
          value={field.value}
          onChange={(value) => {
            field.onChange(value.replace(/\s+/g, ""));
          }}
          error={Boolean(errors[name])}
          helperText={errors[name]?.message as string | undefined}
          fullWidth
          label="Teléfono"
          onlyCountries={["PE", "CO"]}
        />
      )}
    />
  );
};

export function roleToOption(x: AccountabilityTypeDto): Option {
  return {
    id: x.id ?? "",
    label: x.isPredefined ? toSpanish(x.name ?? "") : (x.name ?? ""),
  };
}
