import { z } from "zod";
import { eventRange } from "./eventRange";
import { recurrenceSchema } from "./recurrence";
import { registrationErrors, type RegistrationFormData } from "./registration";

// The values of EventForm and their validation. Kept apart from the form so the
// field components it renders (RecurrenceFields, EndDateField,
// RegistrationModeField) can type their props without importing the form back.
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

export const eventFormSchema = fields.superRefine((values, context) => {
  const { start, end } = eventRange(values);
  if (end <= start) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "El evento debe terminar después de empezar",
    });
  }
});

export type EventDetailFormData = z.infer<typeof eventFormSchema>;
