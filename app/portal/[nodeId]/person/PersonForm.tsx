"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Chip,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { differenceInYears } from "date-fns";
import {
  Controller,
  FormContainer,
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
import { FormSection } from "@/app/(components)/FormSection";
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
import { PersonHeader } from "./PersonHeader";

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
  // Buttons next to the name, such as deleting the person.
  actions?: React.ReactNode;
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
  actions,
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

  const nodeName = node?.name ?? "este lugar";

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Stack spacing={3}>
        <PersonHeader
          title={suggestMatches ? `Agregar persona a ${nodeName}` : undefined}
          subtitle={
            suggestMatches
              ? "Escribe el nombre: si ya está en la iglesia, la agregas desde aquí sin duplicarla."
              : "Datos generales de persona"
          }
          actions={actions}
        />
        <FormSection
          title="Contacto"
          description="Lo básico para ubicar a la persona."
        >
          <Grid container spacing={2}>
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
          </Grid>
        </FormSection>
        {suggestMatches && <PersonMatches nodeId={nodeId} />}
        {/* Optional data: folded away so the form stays short. The fields stay
            mounted, so what is typed is saved even while it is folded. */}
        <Accordion
          disableGutters
          variant="outlined"
          sx={{ borderRadius: 3, "&::before": { display: "none" } }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="personal-data-content"
            id="personal-data-header"
          >
            <Box>
              <Typography variant="h6" component="h2">
                Datos personales
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Fecha de nacimiento, edad y bautismo · opcional
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails id="personal-data-content">
            <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
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
                  helperText="Se calcula con la fecha de nacimiento"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <BaptizedField />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        <FormSection
          title={`En ${nodeName}`}
          description="Cómo participa y qué responsabilidades tiene aquí."
        >
          <Stack spacing={3}>
            <MemberStateField nodeName={nodeName} />
            <PositionsField positions={positions} />
          </Stack>
        </FormSection>
        <Box>
          <SaveButton
            name="Guardar"
            loading={formContext.formState.isSubmitting}
          />
        </Box>
      </Stack>
    </FormContainer>
  );
};

// Yes or no, kept as "YES"/"NO" in the form like the radio buttons were.
const BaptizedField = () => {
  const { control } = useFormContext<PersonDetailFormData>();
  return (
    <Controller
      control={control}
      name="hasBeenBaptized"
      render={({ field }) => (
        <FormControlLabel
          sx={{ minHeight: 56 }}
          label="Bautizado"
          control={
            <Switch
              checked={field.value === "YES"}
              onChange={(_event, checked) =>
                field.onChange(checked ? "YES" : "NO")
              }
            />
          }
        />
      )}
    />
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
