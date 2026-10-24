"use client";

import ShareIcon from "@mui/icons-material/Share";
import { Tooltip } from "@mui/material";
import React from "react";
import {
  deleteEventsByIdRegistrationsByRegistrationId,
  deleteEventsByIdSharesByShareId,
  postEventsByIdShares,
  postEventsByIdSharingLinkRenew,
  putEventsByIdSharing,
  useGetEventsByIdRegistrations,
  useGetEventsByIdSharing,
} from "@/app/(api)/generated";
import { RegisterButton } from "@/app/(components)/RegisterButton";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { copyLink } from "@/app/(components)/copyLink";
import { ShareEventDialog } from "./ShareEventDialog";

// "Compartir" of an event or course: opens the dialog and wires it to the API.
// `eventId` is the saved event to share (the series, for a recurring event).
export const ShareEventButton = ({
  eventId,
  title,
  isACourse,
}: Readonly<{ eventId: string; title: string; isACourse: boolean }>) => {
  const alert = React.useContext(SnackbarContext);
  const [open, setOpen] = React.useState(false);
  const { data: sharing, mutate: mutateSharing } = useGetEventsByIdSharing(
    eventId,
    { swr: { enabled: open } },
  );
  const { data: registrations, mutate: mutateRegistrations } =
    useGetEventsByIdRegistrations(eventId, {
      swr: { enabled: open && isACourse },
    });

  // Runs a change, tells the user how it went and refreshes what the dialog
  // shows. A refusal (for example 400) is explained and rethrown.
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
    await Promise.all([mutateSharing(), mutateRegistrations()]);
    alert.showMessage(done);
  };

  return (
    <>
      <Tooltip title="Compartir">
        <RegisterButton
          icon={<ShareIcon />}
          ariaLabel="share"
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      {open && sharing && (
        <ShareEventDialog
          open
          close={() => setOpen(false)}
          title={title}
          sharing={sharing}
          registrations={registrations ?? []}
          onShare={(email, role) =>
            run(
              async () => {
                const result = await postEventsByIdShares(eventId, {
                  email,
                  role,
                });
                if (result.emailSent === false) {
                  alert.showMessage(
                    "Se compartió, pero no se pudo enviar el correo. Copie el enlace y envíelo usted.",
                  );
                }
              },
              "Compartido",
              "No se pudo compartir. Intente nuevamente",
            )
          }
          onUnshare={(shareId) =>
            run(
              () => deleteEventsByIdSharesByShareId(eventId, shareId),
              "Ya no se comparte con esa persona",
              "No se pudo quitar el acceso",
            )
          }
          onChangeAccess={(generalAccess, linkRole) =>
            run(
              () => putEventsByIdSharing(eventId, { generalAccess, linkRole }),
              "Acceso actualizado",
              "No se pudo cambiar el acceso",
            )
          }
          onRenewLink={() =>
            run(
              () => postEventsByIdSharingLinkRenew(eventId),
              "Enlace nuevo creado. El anterior ya no funciona",
              "No se pudo crear el enlace",
            )
          }
          onRemoveRegistration={(registrationId) =>
            run(
              () =>
                deleteEventsByIdRegistrationsByRegistrationId(
                  eventId,
                  registrationId,
                ),
              "Inscripción quitada",
              "No se pudo quitar la inscripción",
            )
          }
          onCopy={(url) => copyLink(url, alert.showMessage)}
        />
      )}
    </>
  );
};
