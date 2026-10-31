"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Autocomplete, Chip, Grid, TextField, Typography } from "@mui/material";
import { differenceInYears } from "date-fns";
import {
  Controller,
  FormContainer,
  RadioButtonGroup,
  SelectElement,
  TextFieldElement,
  useForm,
  useFormContext,
} from "react-hook-form-mui";
import { DatePickerElement } from "react-hook-form-mui/date-pickers";
import { z } from "zod";
import {
  useGetOrganizationsById,
  useGetOrganizationsByIdPositions,
} from "@/app/(api)/generated";
import type {
  CreatePersonRequest,
  PositionSummaryResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { formatISO } from "date-fns";
import {
  toChoice,
  accessHints,
  toPositionChoice,
  type PositionChoice,
} from "./positionSelection";
import { SaveButton } from "@/app/(components)/SaveButton";
import {
  effectiveMemberState,
  memberStateHelp,
  memberStateLabels,
  memberStates,
} from "@/app/(components)/memberState";
import { TelFieldElement } from "@/app/(components)/TelFieldElement";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { PersonMatches } from "./PersonMatches";

const requiredFirstNameMessage = "Por favor ingrese su nombre";
const requiredLastNameMessage = "Por favor ingrese su apellido";
const invalidEmailMessage = "Ingrese un correo válido";

const schema = z.object({
  firstName: z.string().trim().min(1, { message: requiredFirstNameMessage }),
  lastName: z.string().trim().min(1, { message: requiredLastNameMessage }),
  phoneNumber: z.string().optional(),
  email: z.union([z.literal(""), z.string().trim().email(invalidEmailMessage)]),
  age: z.number().optional(),
  birthdate: z.date().optional().nullable(),
  hasBeenBaptized: z.enum(["YES", "NO"]).optional(),
  // Visitor, attending or member. Whoever holds a position is a member.
  memberState: z.enum(memberStates),
  positions: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string(),
    }),
  ),
});

export type PersonDetailFormData = z.infer<typeof schema>;

// Form values -> body of POST/PUT /people. New positions must be created
// first (see resolvePositionIds), so their ids come separately.
export const toPersonPayload = (
  data: PersonDetailFormData,
  organizationId: string,
  positionIds: string[],
): CreatePersonRequest => ({
  firstName: data.firstName,
  lastName: data.lastName,
  phoneNumber: data.phoneNumber,
  email: data.email.trim() || undefined,
  age: data.age,
  birthdate: data.birthdate
    ? formatISO(data.birthdate, { representation: "date" })
    : undefined,
  hasBeenBaptized: data.hasBeenBaptized === "YES",
  memberState: effectiveMemberState(data.memberState, positionIds.length),
  organizationId,
  positionIds,
});

type PersonFormProps = {
  initialValues: PersonDetailFormData;
  submit: (data: PersonDetailFormData) => Promise<void>;
  nodeId: string;
  // When registering someone new, point out people who may already be them.
  suggestMatches?: boolean;
};

// How involved the person is. With a position they are a member, and it cannot
// be lowered while they hold it.
const MemberStateField = ({ nodeName }: { nodeName: string }) => {
  const { watch, setValue } = useFormContext<PersonDetailFormData>();
  const holdsPosition = watch("positions").length > 0;
  // The select shows the state the person will be saved with.
  React.useEffect(() => {
    if (holdsPosition) setValue("memberState", "MEMBER");
  }, [holdsPosition, setValue]);
  return (
    <SelectElement
      name="memberState"
      label={`Estado en ${nodeName}`}
      fullWidth
      disabled={holdsPosition}
      options={memberStates.map((state) => ({
        id: state,
        label: memberStateLabels[state],
      }))}
      helperText={memberStateHelp}
    />
  );
};

function isValidDate(date: Date) {
  return date instanceof Date && !isNaN(date.getTime());
}

export const PersonForm = ({
  initialValues,
  submit,
  nodeId,
  suggestMatches = false,
}: PersonFormProps) => {
  const {
    data: positions,
    error: positionsError,
    isLoading,
  } = useGetOrganizationsByIdPositions(nodeId);
  const { data: node } = useGetOrganizationsById(nodeId);

  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });

  if (isLoading) return <Loading />;
  if (!positions) return <ResourceError error={positionsError} />;

  const handleChange = (birthdate: Date | null) => {
    formContext.setValue("birthdate", birthdate);

    if (birthdate && isValidDate(birthdate)) {
      const age = differenceInYears(new Date(), birthdate);
      formContext.setValue("age", age);
    }
  };

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Grid
        container
        spacing={2}
        sx={{
          margin: 4,
        }}
      >
        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" gutterBottom>
            {suggestMatches
              ? `Agregar persona a ${node?.name ?? "este lugar"}`
              : "Datos generales de persona"}
          </Typography>
          {suggestMatches && (
            <Typography
              sx={{
                color: "text.secondary",
              }}
            >
              Escribe el nombre: si ya está en la iglesia, la agregas desde aquí
              sin duplicarla.
            </Typography>
          )}
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <TelFieldElement name="phoneNumber" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement
            fullWidth
            name="email"
            label="Correo electrónico"
            type="email"
            helperText="Con este correo podrá recibir una invitación a la aplicación"
          />
        </Grid>
        {suggestMatches && (
          <Grid size={{ xs: 12 }}>
            <PersonMatches nodeId={nodeId} />
          </Grid>
        )}
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <MemberStateField nodeName={node?.name ?? "este lugar"} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Grid sx={{ paddingBottom: "10px" }}>
            <Typography variant="h6">Cargos:</Typography>
          </Grid>
          <PositionsField positions={positions} />
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

// Positions of the church, or any new name: it is created when saving.
const PositionsField = ({
  positions,
}: {
  positions: PositionSummaryResponse[];
}) => {
  const { control } = useFormContext<PersonDetailFormData>();
  return (
    <Controller
      control={control}
      name="positions"
      render={({ field }) => (
        <Autocomplete<PositionChoice, true, false, true>
          multiple
          freeSolo
          options={positions.map(toPositionChoice)}
          value={field.value}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.label
          }
          isOptionEqualToValue={(option, value) =>
            typeof value !== "string" && option.label === value.label
          }
          onChange={(_event, values) =>
            field.onChange(
              values
                .map((value) => toChoice(value, positions))
                .filter(
                  (choice, index, all) =>
                    choice.label &&
                    all.findIndex((other) => other.label === choice.label) ===
                      index,
                ),
            )
          }
          renderValue={(values, getItemProps) =>
            values.map((option, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              const label = typeof option === "string" ? option : option.label;
              return <Chip key={key} label={label} {...itemProps} />;
            })
          }
          renderInput={(params) => {
            const hints = accessHints(field.value, positions);
            return (
              <TextField
                {...params}
                label="Escriba o seleccione los cargos"
                helperText={
                  <>
                    Si escribe un cargo nuevo, se agregará a los cargos de la
                    iglesia, sin acceso a la aplicación.
                    {hints.length > 0 &&
                      ` Da acceso a la aplicación: ${hints.join("; ")}.`}
                  </>
                }
              />
            );
          }}
        />
      )}
    />
  );
};
