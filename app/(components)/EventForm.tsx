import { Grid } from "@mui/material";
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

const schema = z.object({
  name: z.string().trim().min(1, { message: "Por favor ingrese el título" }),
  date: z.date(),
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
});

export type EventDetailFormData = z.infer<typeof schema>;

type EventFormProps = {
  nodeId: string;
  initialValues: EventDetailFormData;
  submit: SubmitHandler<EventDetailFormData>;
  editable: boolean;
};

export const EventForm = ({
  nodeId,
  initialValues,
  submit,
  editable,
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

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Grid container spacing={2} margin={4}>
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
          <ToggleButton
            eventType={type}
            onChange={(type) => formContext.setValue("type", type)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <DatePickerElement
            sx={{ width: "100%" }}
            label="Fecha"
            name="date"
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
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
        <Grid size={{ xs: 12, sm: 4 }}>
          <TimePicker
            ampm
            minTime={startTime}
            sx={{ width: "100%" }}
            value={endTime}
            onChange={(value) => {
              if (value !== null) {
                formContext.setValue("endTime", value);
              }
            }}
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
              seconds: renderTimeViewClock,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <RecurrenceFields readOnly={!editable} />
        </Grid>
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
        <Grid size={{ xs: 6 }}>
          {editable && (
            <SaveButton
              name="Guardar"
              loading={formContext.formState.isSubmitting}
            />
          )}
        </Grid>
      </Grid>
    </FormContainer>
  );
};
