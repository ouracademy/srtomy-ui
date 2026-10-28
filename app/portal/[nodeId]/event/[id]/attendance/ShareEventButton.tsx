"use client";

import ShareIcon from "@mui/icons-material/Share";
import { Tooltip } from "@mui/material";
import React from "react";
import {
  deleteEventsByIdSharesByShareId,
  postEventsByIdShares,
  postEventsByIdSharingLinkRenew,
  putEventsByIdSharing,
  useGetEventsByIdSharing,
} from "@/app/(api)/generated";
import { RegisterButton } from "@/app/(components)/RegisterButton";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { copyLink } from "@/app/(components)/copyLink";
import type { SharingDraft } from "@/app/(components)/eventSharing";
import { ShareEventDialog } from "./ShareEventDialog";

// "Compartir" of an event or course: opens the dialog and wires it to the API.
// `eventId` is the event to share. Each occurrence of a repeating event is its own event, so sharing applies to that date only.
export const ShareEventButton = ({
  eventId,
  title,
}: Readonly<{ eventId: string; title: string }>) => {
  const alert = React.useContext(SnackbarContext);
  const [open, setOpen] = React.useState(false);
  // Changes after a save that failed halfway, so the dialog starts its draft over.
  const [attempt, setAttempt] = React.useState(0);
  const { data: sharing, mutate: mutateSharing } = useGetEventsByIdSharing(
    eventId,
    { swr: { enabled: open } },
  );

  // Applies the draft one change at a time. If one fails, what was already
  // applied stays, the dialog shows the real state again and the user is told.
  const save = async (draft: SharingDraft) => {
    try {
      if (draft.generalAccess !== sharing?.generalAccess) {
        await putEventsByIdSharing(eventId, {
          generalAccess: draft.generalAccess,
        });
      }
      for (const shareId of draft.removed) {
        await deleteEventsByIdSharesByShareId(eventId, shareId);
      }
      for (const share of draft.added) {
        const result = await postEventsByIdShares(eventId, share);
        if (result.emailStatus === "FAILED") {
          alert.showMessage(
            `Se compartió con ${share.email}, pero el correo no salió. Copie el enlace y envíelo usted.`,
          );
        }
      }
    } catch (failure) {
      await mutateSharing();
      setAttempt((current) => current + 1);
      alert.showMessage(
        apiErrorMessage(
          failure,
          "No se pudo guardar todo. Revise lo que quedó e intente nuevamente",
        ),
      );
      throw failure;
    }
    await mutateSharing();
    alert.showMessage("Cambios guardados");
  };

  const renewLink = async () => {
    try {
      await postEventsByIdSharingLinkRenew(eventId);
    } catch (failure) {
      alert.showMessage(apiErrorMessage(failure, "No se pudo crear el enlace"));
      throw failure;
    }
    await mutateSharing();
    alert.showMessage("Enlace nuevo creado. El anterior ya no funciona");
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
          key={attempt}
          open
          close={() => setOpen(false)}
          title={title}
          sharing={sharing}
          onSave={save}
          onRenewLink={renewLink}
          onCopy={(url) => copyLink(url, alert.showMessage)}
        />
      )}
    </>
  );
};
