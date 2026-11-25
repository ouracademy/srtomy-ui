import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import React from "react";
import {
  AutocompleteElement,
  FormContainer,
  SubmitHandler,
  TextFieldElement,
  useForm,
  CheckboxElement,
} from "react-hook-form-mui";
import { DatePickerElement } from "react-hook-form-mui/date-pickers";
import { useDebounce } from "use-debounce";
import { useGetOrganizationsById } from "@/app/(api)/generated";
import { useGetPeople } from "@/app/(api)/generated";
import { DEBOUNCE_WAIT_MS } from "./helpers/debouncing";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { RecurrenceFields } from "./RecurrenceFields";
import { recurrenceSchema } from "./recurrence";
import {
  EventTypeSelector,
  kindHint,
  kindLabel,
  kindTitle,
} from "./EventTypeSelector";
import {
  filledPickerField,
  filledPickerSx,
  filledTextFieldSx,
} from "./filledField";
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
  // A sub-event with its own sign-up asks for a place in its event first.
  requiresContainerRegistration: z.boolean().optional(),
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

// Side padding of the form and of its sticky footer.
const FORM_PADDING_X = { xs: 2.5, sm: 4 };

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

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
  const address = watch("address");
  const speakers = watch("speakers");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const registration = watch("registration");
  const repeats = watch("recurrence").frequency !== "NONE";
  const severalDays = lastsSeveralDays({
    date: watch("date"),
    endDate: watch("endDate"),
  });

  const [changingEntry, setChangingEntry] = React.useState(false);

  const registrationFields = (
    <RegistrationFields
      value={registration}
      onChange={(value) =>
        formContext.setValue("registration", value, { shouldDirty: true })
      }
      errors={
        formContext.formState.isSubmitted
          ? registrationErrors(registration)
          : []
      }
    />
  );

  const caption = (text: string, id?: string) => (
    <Typography
      id={id}
      component="p"
      variant="caption"
      sx={{
        color: "text.secondary",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </Typography>
  );

  const fieldLabel = (text: string, htmlFor: string) => (
    <Typography
      component="label"
      htmlFor={htmlFor}
      variant="caption"
      sx={{ color: "text.secondary", fontWeight: 600 }}
    >
      {text}
    </Typography>
  );

  // How a sub-event is entered is rarely changed: it is the one of the event
  // unless the organizers say otherwise.
  const entryMode = watch("registrationMode");
  let registrationBody: React.ReactNode = registrationFields;
  if (container && entryMode === "INHERIT" && !changingEntry) {
    registrationBody = (
      <Stack
        direction="row"
        useFlexGap
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          <strong>Inscripción:</strong> la del evento. Quien se inscribe al
          evento puede entrar a esta sesión.
        </Typography>
        {editable && (
          <Button
            size="small"
            aria-label="Cambiar la inscripción"
            onClick={() => setChangingEntry(true)}
          >
            Cambiar
          </Button>
        )}
      </Stack>
    );
  } else if (container) {
    registrationBody = (
      <Stack spacing={2}>
        <RegistrationModeField />
        {entryMode === "OWN" && (
          <CheckboxElement
            name="requiresContainerRegistration"
            label={`Solo para quienes ya se inscribieron a «${container.title}»`}
          />
        )}
        {showRegistration &&
          editable &&
          entryMode === "OWN" &&
          registrationFields}
      </Stack>
    );
  }

  const ownRegistration =
    !container && showRegistration && editable && !repeats;
  const savedAddress = location?.address;

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      {/* A form that is only shown cannot be typed into. */}
      <Box
        component="fieldset"
        disabled={!editable}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
      >
        <Stack spacing={3} sx={{ px: FORM_PADDING_X, pt: 3 }}>
          {!lockType && caption(kindTitle(type))}
          <Box>
            {container && (
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                }}
              >
                Parte de «{container.title}»
              </Typography>
            )}
            <TextFieldElement
              fullWidth
              name="name"
              placeholder="Agregar título"
              variant="standard"
              required
              autoFocus
              slotProps={{
                input: { sx: { fontSize: 24, fontWeight: 600 } },
                htmlInput: { "aria-label": "Título" },
              }}
            />
          </Box>
          <Stack spacing={1}>
            {caption("Tipo", "event-type-caption")}
            {lockType ? (
              <Chip
                label={kindLabel(type)}
                variant="outlined"
                color="primary"
                sx={{ alignSelf: "flex-start" }}
              />
            ) : (
              <>
                <EventTypeSelector />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {kindHint(type)}
                </Typography>
              </>
            )}
          </Stack>
          <Stack spacing={1}>
            {caption("Cuándo")}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 5 }}>
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" component="p">
                        Empieza
                      </Typography>
                      <DatePickerElement
                        sx={filledPickerSx}
                        label="Fecha"
                        name="date"
                        minDate={container?.start}
                        maxDate={container?.end}
                        required
                        inputProps={filledPickerField}
                      />
                      <TimePicker
                        ampm
                        label="Hora de inicio"
                        sx={filledPickerSx}
                        value={startTime}
                        onChange={(value) => {
                          if (value !== null) {
                            formContext.setValue("startTime", value);
                          }
                        }}
                        slotProps={{ textField: filledPickerField }}
                        viewRenderers={{
                          hours: renderTimeViewClock,
                          minutes: renderTimeViewClock,
                          seconds: renderTimeViewClock,
                        }}
                      />
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" component="p">
                        Termina
                      </Typography>
                      <EndDateField maxDate={container?.end} />
                      <TimePicker
                        ampm
                        label="Hora de fin"
                        minTime={severalDays ? undefined : startTime}
                        sx={filledPickerSx}
                        value={endTime}
                        onChange={(value) => {
                          if (value !== null) {
                            formContext.setValue("endTime", value);
                          }
                        }}
                        slotProps={{
                          textField: {
                            ...filledPickerField,
                            error: Boolean(
                              formContext.formState.errors.endTime,
                            ),
                            helperText:
                              formContext.formState.errors.endTime?.message,
                          },
                        }}
                        viewRenderers={{
                          hours: renderTimeViewClock,
                          minutes: renderTimeViewClock,
                          seconds: renderTimeViewClock,
                        }}
                      />
                    </Stack>
                  </Grid>
                </Grid>
                {!severalDays && !container && (
                  <RecurrenceFields readOnly={!editable} />
                )}
              </Stack>
            </Paper>
          </Stack>
          <Stack spacing={1}>
            {caption("Dónde y quién")}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 5 }}>
              <Stack spacing={1.5}>
                {fieldLabel("Lugar", "event-address")}
                <AutocompleteElement
                  autocompleteProps={{
                    id: "event-address",
                    freeSolo: true,
                    onInputChange: (_event, newInputValue) => {
                      formContext.setValue("address", newInputValue);
                    },
                  }}
                  textFieldProps={{
                    slotProps: {
                      input: { startAdornment: <PlaceOutlinedIcon /> },
                    },
                    placeholder: " Agregar lugar",
                    variant: "filled",
                    hiddenLabel: true,
                    sx: filledTextFieldSx,
                  }}
                  name="address"
                  options={[location?.address]}
                />
                {editable && savedAddress && address !== savedAddress && (
                  <Chip
                    label={`Usar la dirección de la sede: ${savedAddress}`}
                    variant="outlined"
                    onClick={() =>
                      formContext.setValue("address", savedAddress, {
                        shouldDirty: true,
                      })
                    }
                    sx={{
                      alignSelf: "flex-start",
                      borderStyle: "dashed",
                      maxWidth: "100%",
                    }}
                  />
                )}
                {fieldLabel("Ponentes", "event-speakers")}
                <AutocompleteElement
                  multiple
                  autocompleteProps={{
                    id: "event-speakers",
                    onInputChange: (_event, newInputValue) => {
                      setSearchTextSpeaker(newInputValue);
                    },
                    size: "small",
                    // A speaker that is not in the people listed now (a long
                    // list, or another search) still shows from the form.
                    renderValue: (value, getItemProps) =>
                      value.map((speaker, index) => {
                        const { key, ...itemProps } = getItemProps({ index });
                        const label =
                          speaker?.label ?? speakers[index]?.label ?? "";
                        return (
                          <Chip
                            key={key}
                            {...itemProps}
                            label={label}
                            avatar={<Avatar>{initials(label)}</Avatar>}
                          />
                        );
                      }),
                  }}
                  textFieldProps={{
                    placeholder: " Agregar ponente(s)",
                    variant: "filled",
                    hiddenLabel: true,
                    sx: filledTextFieldSx,
                  }}
                  name="speakers"
                  options={
                    people?.content?.map((x) => ({
                      id: x.id,
                      label: `${x.firstName ?? ""} ${x.lastName ?? ""}`,
                    })) || []
                  }
                />
              </Stack>
            </Paper>
          </Stack>
          <Stack spacing={1}>
            {caption("Descripción")}
            <TextFieldElement
              fullWidth
              name="description"
              multiline
              minRows={3}
              placeholder="Agregar descripción"
              variant="filled"
              hiddenLabel
              sx={filledTextFieldSx}
              slotProps={{ htmlInput: { "aria-label": "Descripción" } }}
            />
          </Stack>
          {(container || ownRegistration) && (
            <Stack spacing={1}>
              {caption("Inscripción")}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 5 }}>
                {registrationBody}
              </Paper>
            </Stack>
          )}
        </Stack>
        {editable && (
          // Outside the Stack, which would reset the margins of its children.
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              mt: 3,
              px: FORM_PADDING_X,
              py: 2,
              bgcolor: "background.paper",
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <SaveButton
              name="Guardar"
              loading={formContext.formState.isSubmitting}
            />
          </Box>
        )}
      </Box>
    </FormContainer>
  );
};
