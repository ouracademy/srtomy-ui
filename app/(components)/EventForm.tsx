import { Box, Chip, Grid, Typography } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import React from "react";
import {
  AutocompleteElement,
  FormContainer,
  SubmitHandler,
  TextFieldElement,
  useForm,
} from "react-hook-form-mui";
import { DatePickerElement } from "react-hook-form-mui/date-pickers";
import { useDebounce } from "use-debounce";
import { useGetOrganizationsById } from "@/app/(api)/generated";
import { useGetPeople } from "@/app/(api)/generated";
import { DEBOUNCE_WAIT_MS } from "./helpers/debouncing";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { RecurrenceFields } from "./RecurrenceFields";
import { recurrenceSchema } from "./recurrence";
import { ToggleButton } from "./ToggleButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SaveButton } from "./SaveButton";
import { RegistrationFields } from "./RegistrationFields";
import { registrationErrors, type RegistrationFormData } from "./registration";
import { eventRange, lastsSeveralDays } from "./eventRange";
import { EndDateField } from "./EndDateField";
import { RegistrationModeField } from "./RegistrationModeField";

const fields = z.object({
  name: z.string().trim().min(1, { message: "Por favor ingrese el título" }),
  date: z.date(),
  // The day the event ends: the same as `date` unless it lasts several days.
  endDate: z.date(),
  startTime: z.date(),
  endTime: z.date(),
  address: z.string().optional(),
  description: z.string().optional(),
  recurrence: recurrenceSchema,
  type: z.number(),
  speakers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
  // How the event takes sign-ups. Only new events that do not repeat set it
  // here; for an existing event it is set from the event itself.
  // How a sub-event is entered; only a sub-event has it.
  registrationMode: z.enum(["INHERIT", "OWN", "OPEN"]).optional(),
  registration: z
    .custom<RegistrationFormData>()
    .superRefine((value, context) => {
      for (const message of registrationErrors(value)) {
        context.addIssue({ code: "custom", message });
      }
    }),
});

const schema = fields.superRefine((values, context) => {
  const { start, end } = eventRange(values);
  if (end <= start) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "El evento debe terminar después de empezar",
    });
  }
});

export type EventDetailFormData = z.infer<typeof schema>;

type EventFormProps = {
  nodeId: string;
  initialValues: EventDetailFormData;
  submit: SubmitHandler<EventDetailFormData>;
  editable: boolean;
  // Offers the sign-up setup (new events only; a repeating event is not offered
  // it because each date is its own event).
  showRegistration?: boolean;
  // An existing event cannot become a course, nor a course an event: its kind
  // is shown as a value instead of buttons.
  lockType?: boolean;
  // The event this one is part of (a sub-event): it stays inside its dates, does
  // not repeat and says how it is entered.
  container?: Readonly<{ title: string; start: Date; end: Date }>;
};

export const EventForm = ({
  nodeId,
  initialValues,
  submit,
  editable,
  showRegistration = false,
  lockType = false,
  container,
}: EventFormProps) => {
  const [searchTextSpeaker, setSearchTextSpeaker] = React.useState("");

  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });

  const watch = formContext.watch;

  const [searchTextDebounced] = useDebounce(
    searchTextSpeaker,
    DEBOUNCE_WAIT_MS,
  );

  const { data: location } = useGetOrganizationsById(nodeId);

  const { data: people } = useGetPeople({
    organizationId: nodeId,
    searchText: searchTextDebounced,
  });

  const type = watch("type");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const registration = watch("registration");
  const repeats = watch("recurrence").frequency !== "NONE";
  const severalDays = lastsSeveralDays({
    date: watch("date"),
    endDate: watch("endDate"),
  });

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      {/* A form that is only shown cannot be typed into. */}
      <Box
        component="fieldset"
        disabled={!editable}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
      >
        <Grid container spacing={2} margin={4}>
          {container && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="overline" color="text.secondary">
                Parte de «{container.title}»
              </Typography>
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <TextFieldElement
              fullWidth
              name="name"
              placeholder="Agregar título"
              sx={{ padding: "10px 0px" }}
              variant="standard"
              required
              autoFocus
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            {lockType ? (
              <Chip
                label={type === 1 ? "Curso" : "Evento"}
                variant="outlined"
                color="primary"
                sx={{ mb: 1 }}
              />
            ) : (
              <ToggleButton
                eventType={type}
                onChange={(type) => formContext.setValue("type", type)}
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePickerElement
              sx={{ width: "100%" }}
              label="Fecha"
              name="date"
              minDate={container?.start}
              maxDate={container?.end}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <EndDateField maxDate={container?.end} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TimePicker
              ampm
              sx={{ width: "100%" }}
              value={startTime}
              onChange={(value) => {
                if (value !== null) {
                  formContext.setValue("startTime", value);
                }
              }}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TimePicker
              ampm
              minTime={severalDays ? undefined : startTime}
              sx={{ width: "100%" }}
              value={endTime}
              onChange={(value) => {
                if (value !== null) {
                  formContext.setValue("endTime", value);
                }
              }}
              slotProps={{
                textField: {
                  error: Boolean(formContext.formState.errors.endTime),
                  helperText: formContext.formState.errors.endTime?.message,
                },
              }}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
              }}
            />
          </Grid>
          {!severalDays && !container && (
            <Grid size={{ xs: 12 }}>
              <RecurrenceFields readOnly={!editable} />
            </Grid>
          )}
          {container && (
            <Grid size={{ xs: 12 }}>
              <RegistrationModeField />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <AutocompleteElement
              autocompleteProps={{
                freeSolo: true,
                onInputChange: (_event, newInputValue) => {
                  formContext.setValue("address", newInputValue);
                },
              }}
              textFieldProps={{
                InputProps: {
                  startAdornment: <PlaceOutlinedIcon />,
                },
                placeholder: " Agregar lugar",
                variant: "standard",
                sx: {
                  padding: "10px 0px",
                },
              }}
              name="address"
              options={[location?.address]}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <AutocompleteElement
              multiple
              autocompleteProps={{
                onInputChange: (_event, newInputValue) => {
                  setSearchTextSpeaker(newInputValue);
                },
                size: "small",
              }}
              textFieldProps={{
                placeholder: " Agregar ponente(s)",
                variant: "standard",
                sx: {
                  padding: "10px 0px",
                },
              }}
              name="speakers"
              options={
                people?.content?.map((x) => ({
                  id: x.id,
                  label: `${x.firstName ?? ""} ${x.lastName ?? ""}`,
                })) || []
              }
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextFieldElement
              fullWidth
              name="description"
              multiline
              minRows={1}
              slotProps={{
                input: {
                  placeholder: "Agregar descripción",
                },
              }}
              variant="standard"
            />
          </Grid>
          {showRegistration &&
            editable &&
            !repeats &&
            (!container || watch("registrationMode") === "OWN") && (
              <Grid size={{ xs: 12 }}>
                <RegistrationFields
                  value={registration}
                  onChange={(value) =>
                    formContext.setValue("registration", value, {
                      shouldDirty: true,
                    })
                  }
                  errors={
                    formContext.formState.isSubmitted
                      ? registrationErrors(registration)
                      : []
                  }
                />
              </Grid>
            )}
          <Grid size={{ xs: 6 }}>
            {editable && (
              <SaveButton
                name="Guardar"
                loading={formContext.formState.isSubmitting}
              />
            )}
          </Grid>
        </Grid>
      </Box>
    </FormContainer>
  );
};
