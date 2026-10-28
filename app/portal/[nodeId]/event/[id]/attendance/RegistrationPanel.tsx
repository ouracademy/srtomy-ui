"use client";

import React from "react";
import {
  deleteEventsByIdRegistration,
  deleteEventsByIdRegistrationsByRegistrationId,
  putEventsByIdRegistration,
  putEventsByIdRegistrationsByRegistrationIdCheckIn,
  useGetEventsByIdRegistration,
  useGetEventsByIdRegistrations,
} from "@/app/(api)/generated";
import type { EventRegistrationSetupRequest } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { RegistrationPanelView } from "./RegistrationPanelView";
import { RegistrationSetupDialog } from "./RegistrationSetupDialog";

// The registration of an event, wired to the API: set it up, see who signed up
// and mark who came. Only for those who manage the event.
export const RegistrationPanel = ({
  eventId,
  title,
  canCheckIn,
}: Readonly<{ eventId: string; title: string; canCheckIn: boolean }>) => {
  const alert = React.useContext(SnackbarContext);
  const [configuring, setConfiguring] = React.useState(false);
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

  if (!setup && setupError) {
    return (
      <ResourceError error={setupError} onRetry={() => void mutateSetup()} />
    );
  }
  if (!setup) return <Loading />;

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

  const save = (request: EventRegistrationSetupRequest | null) =>
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
        );

  return (
    <>
      <RegistrationPanelView
        setup={setup}
        registrations={registrations ?? []}
        canCheckIn={canCheckIn}
        onConfigure={() => setConfiguring(true)}
        onCheckIn={(registrationId, checkedIn) =>
          run(
            () =>
              putEventsByIdRegistrationsByRegistrationIdCheckIn(
                eventId,
                registrationId,
                { checkedIn },
              ),
            checkedIn ? "Ingreso marcado" : "Ingreso quitado",
            "No se pudo cambiar el ingreso",
          ).catch(() => undefined)
        }
        onRemove={(registrationId) =>
          run(
            () =>
              deleteEventsByIdRegistrationsByRegistrationId(
                eventId,
                registrationId,
              ),
            "Inscripción quitada",
            "No se pudo quitar la inscripción",
          ).catch(() => undefined)
        }
      />
      {configuring && (
        <RegistrationSetupDialog
          open
          close={() => setConfiguring(false)}
          title={title}
          setup={setup}
          onSave={save}
        />
      )}
    </>
  );
};
