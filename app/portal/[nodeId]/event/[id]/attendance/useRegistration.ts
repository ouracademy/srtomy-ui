"use client";

import { useContext } from "react";
import {
  deleteEventsByIdRegistration,
  deleteEventsByIdRegistrationsByRegistrationId,
  putEventsByIdRegistration,
  putEventsByIdRegistrationOpen,
  putEventsByIdRegistrationsByRegistrationIdCheckIn,
  useGetEventsByIdRegistration,
  useGetEventsByIdRegistrations,
} from "@/app/(api)/generated";
import type { EventRegistrationSetupRequest } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";

// What the user may do with the registration; each is its own permission.
export type RegistrationActions = Readonly<{
  configure: boolean;
  close: boolean;
  remove: boolean;
  // The ushers who take attendance can mark who came.
  checkIn: boolean;
}>;

// The registration of an event, wired to the API: how it is set up, who signed
// up and what can be done about it. The summary and the list of the people
// signed up both use it; SWR makes them share the same requests.
export const useRegistration = (eventId: string) => {
  const alert = useContext(SnackbarContext);
  // A refusal does not get better by asking again, so it is not retried.
  const {
    data: setup,
    error: setupError,
    mutate: mutateSetup,
  } = useGetEventsByIdRegistration(eventId, {
    swr: { shouldRetryOnError: false },
  });
  const { data: registrations, mutate: mutateRegistrations } =
    useGetEventsByIdRegistrations(eventId);

  const refresh = () => Promise.all([mutateSetup(), mutateRegistrations()]);

  // Runs a change, tells the user how it went and refreshes what is shown.
  // A refusal (for example 400) is explained and rethrown.
  const run = async (
    action: () => Promise<unknown>,
    done: string,
    failed: string,
  ) => {
    try {
      await action();
    } catch (failure) {
      alert.showMessage(apiErrorMessage(failure, failed));
      throw failure;
    }
    await refresh();
    alert.showMessage(done);
  };

  return {
    setup,
    setupError,
    registrations: registrations ?? [],
    retry: () => void mutateSetup(),
    save: (request: EventRegistrationSetupRequest | null) =>
      request
        ? run(
            () => putEventsByIdRegistration(eventId, request),
            "Inscripción guardada",
            "No se pudo guardar la inscripción",
          )
        : run(
            () => deleteEventsByIdRegistration(eventId),
            "El evento ya no pide inscripción",
            "No se pudo quitar la inscripción",
          ),
    setOpen: (open: boolean) =>
      run(
        () => putEventsByIdRegistrationOpen(eventId, { open }),
        open ? "Inscripciones abiertas" : "Inscripciones cerradas",
        open
          ? "No se pudo reabrir la inscripción"
          : "No se pudo cerrar la inscripción",
      ),
    checkIn: (registrationId: string, checkedIn: boolean) =>
      run(
        () =>
          putEventsByIdRegistrationsByRegistrationIdCheckIn(
            eventId,
            registrationId,
            { checkedIn },
          ),
        checkedIn ? "Ingreso marcado" : "Ingreso quitado",
        "No se pudo cambiar el ingreso",
      ).catch(() => undefined),
    remove: (registrationId: string) =>
      run(
        () =>
          deleteEventsByIdRegistrationsByRegistrationId(
            eventId,
            registrationId,
          ),
        "Inscripción quitada",
        "No se pudo quitar la inscripción",
      ).catch(() => undefined),
  };
};
