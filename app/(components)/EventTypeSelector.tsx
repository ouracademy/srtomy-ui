import { ToggleButtonGroupElement } from "react-hook-form-mui";
import { typeButtonsSx } from "./typeButtonsSx";

// 0 is an event and 1 a course, as the form stores it.
export const EVENT_KINDS = [
  { id: 0, label: "Evento", title: "Nuevo evento" },
  {
    id: 1,
    label: "Curso",
    title: "Nuevo curso",
  },
] as const;

const hints: Record<number, string> = {
  0: "una reunión o actividad con fecha y hora.",
  1: "enseñanza con varias sesiones y asistencia.",
};

export const kindLabel = (type: number) =>
  EVENT_KINDS.find((kind) => kind.id === type)?.label ?? "Evento";

export const kindTitle = (type: number) =>
  EVENT_KINDS.find((kind) => kind.id === type)?.title ?? "Nuevo evento";

// What the chosen kind is, in one line under its buttons.
export const kindHint = (type: number) =>
  `${kindLabel(type)}: ${hints[type] ?? hints[0]}`;

// Evento or Curso, as two separate buttons. Must be rendered inside the
// EventForm's FormContainer.
export const EventTypeSelector = () => (
  <ToggleButtonGroupElement
    name="type"
    aria-label="Tipo"
    exclusive
    enforceAtLeastOneSelected
    sx={typeButtonsSx(48)}
    options={EVENT_KINDS.map(({ id, label }) => ({ id, label }))}
  />
);
