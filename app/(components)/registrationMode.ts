import type { EventRequest } from "@/app/(api)/generated/aPIOvejafiel.schemas";

// How a sub-event is entered: with the registration of its mega event, with a
// registration of its own, or without one.
export type RegistrationMode = NonNullable<EventRequest["registrationMode"]>;

export const REGISTRATION_MODES: readonly {
  id: RegistrationMode;
  label: string;
  help: string;
}[] = [
  {
    id: "INHERIT",
    label: "La del evento",
    help: "Quien se inscribe al evento puede entrar a este sub-evento.",
  },
  {
    id: "OWN",
    label: "Propia",
    help: "Tiene su propia inscripción, con sus cupos y tickets.",
  },
  {
    id: "OPEN",
    label: "Sin inscripción",
    help: "Cualquiera que pueda abrirlo asiste, sin inscribirse.",
  },
];

export const describeRegistrationMode = (mode: RegistrationMode | undefined) =>
  REGISTRATION_MODES.find((option) => option.id === (mode ?? "INHERIT"));
