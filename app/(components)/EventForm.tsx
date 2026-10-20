import { Box, Typography, Grid } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import React from "react";
import {
  AutocompleteElement,
  CheckboxElement,
  FormContainer,
  SubmitHandler,
  TextFieldElement,
  useForm,
} from "react-hook-form-mui";
import { DatePickerElement } from "react-hook-form-mui/date-pickers";
import { useDebounce } from "use-debounce";
import { useOrganization } from "../(api)/services/organizations";
import { usePeople } from "../(api)/services/people";
import { DEBOUNCE_WAIT_MS } from "./helpers/debouncing";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { WeekChips } from "./WeekChips";
import { ToogleButton } from "./ToogleButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SaveButton } from "./SaveButton";

const schema = z
  .object({
    name: z.string().trim().min(1, { message: "Por favor ingrese el título" }),
    date: z.date(),
    startTime: z.date(),
    endTime: z.date(),
    endRecur: z.date().nullable().optional(),
    address: z.string().optional(),
    isRecurrent: z.boolean().optional(),
    description: z.string().optional(),
    daysOfWeek: z.array(z.number()),
    type: z.number(),
    speakers: z.array(
      z.object({
        id: z.number(),
        label: z.string(),
      }),
    ),
  })
  .refine(
    (data) => {
      return data.isRecurrent
        ? data.daysOfWeek.length >= 1 && data.endRecur
        : true;
    },
    {
      message:
        "Por favor seleccionar el/los día(s) y la fecha que finaliza el evento",
      path: ["isRecurrent"],
    },
  );

export type EventDetailFormData = z.infer<typeof schema>;

type EventFormProps = {
  locId: number;
  initialValues: EventDetailFormData;
  submit: SubmitHandler<EventDetailFormData>;
  editable: boolean;
};

export const EventForm = ({
  locId,
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
  const watchIsRecurrent = watch("isRecurrent");

  const [searchTextDebounced] = useDebounce(
    searchTextSpeaker,
    DEBOUNCE_WAIT_MS,
  );

  const { data: location } = useOrganization(locId);

  const { data: people } = usePeople({
    organizationId: locId,
    searchText: searchTextDebounced,
  });

  const daysOfWeek = watch("daysOfWeek");
  const type = watch("type");
  const startTime = watch("startTime");

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
          <ToogleButton
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
            value={formContext.getValues().startTime}
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
            value={formContext.getValues().endTime}
            // onChange={(value) => formContext.setValue("endTime", value)}
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
              seconds: renderTimeViewClock,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <CheckboxElement
            onChange={(e) => {
              if (e.target.checked) {
                const date = formContext.getValues().date;
                formContext.setValue("daysOfWeek", date ? [date.getDay()] : []);
              } else {
                formContext.setValue("daysOfWeek", []);
              }
            }}
            name="isRecurrent"
            label="Se repite"
          />
          {watchIsRecurrent && (
            <Box>
              <Typography sx={{ padding: "10px 0px" }}>Repetir el</Typography>
              <WeekChips
                chipsValue={daysOfWeek}
                onChange={(daysOfWeek) =>
                  formContext.setValue("daysOfWeek", daysOfWeek)
                }
              />
              <Box
                sx={{
                  padding: "20px 0px",
                  display: { xs: "block", sm: "flex" },
                  alignItems: "center",
                }}
              >
                <Typography sx={{ paddingRight: "10px" }}>
                  Finaliza el:
                </Typography>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DatePickerElement
                    name="endRecur"
                    inputProps={{
                      sx: {
                        width: "100%",
                      },
                    }}
                  />
                </Grid>
              </Box>
            </Box>
          )}
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
          {/* TODO: make creatable */}
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
              people?.content.map((x) => ({
                id: x.id,
                label: x.firstName + " " + x.lastName,
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
            <SaveButton name="Guardar" />
            /* <Button type="submit" variant="contained">
              Guardar
            </Button> */
          )}
        </Grid>
      </Grid>
    </FormContainer>
  );
};
