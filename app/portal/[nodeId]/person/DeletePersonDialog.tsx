"use client";

import React from "react";
import { isAxiosError } from "axios";
import { deletePeopleById } from "@/app/(api)/generated";
import type { OrganizationResponseType } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";

export type PersonToDelete = { id: string; name: string };

type DeletePersonDialogProps = Readonly<{
  // The person to remove; null keeps the dialog closed.
  person: PersonToDelete | null;
  // The node the list belongs to: the person is removed from it. From the
  // church itself they are removed from the church altogether.
  nodeId: string;
  nodeType: OrganizationResponseType | undefined;
  close: () => void;
  // Called once the person is gone, to refresh what lists them.
  onDeleted: () => void;
}>;

const nodeNames: Record<OrganizationResponseType, string> = {
  CHURCH: "la iglesia",
  LOCATION: "esta sede",
  GROUP: "este grupo",
  MINISTRY: "este ministerio",
};

// The API asks for a confirmation before removing someone who has an account.
const hasAccount = (error: unknown) =>
  isAxiosError(error) &&
  error.response?.status === 409 &&
  (error.response.data as { code?: unknown } | undefined)?.code ===
    "PERSON_HAS_ACCOUNT";

// Render it with `key={person?.id}` so each person starts at the first step.
export const DeletePersonDialog = ({
  person,
  nodeId,
  nodeType,
  close,
  onDeleted,
}: DeletePersonDialogProps) => {
  const alert = React.useContext(SnackbarContext);
  const [confirmingAccount, setConfirmingAccount] = React.useState(false);
  const name = person?.name ?? "";
  const wholeChurch = nodeType === "CHURCH";
  const where = nodeType ? nodeNames[nodeType] : "este lugar";

  const remove = async () => {
    if (!person) return;
    try {
      await deletePeopleById(person.id, {
        organizationId: nodeId,
        ...(confirmingAccount ? { confirmUnlinkUser: true } : {}),
      });
    } catch (failure) {
      if (hasAccount(failure)) {
        setConfirmingAccount(true);
        return;
      }
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo eliminar. Intenta de nuevo."),
      );
      close();
      return;
    }
    alert.showMessage("Eliminado exitosamente");
    onDeleted();
    close();
  };

  if (confirmingAccount) {
    return (
      <DialogDeleteConfirmation
        open={person !== null}
        close={close}
        onDelete={remove}
        title={`${name} tiene una cuenta`}
        message="Tiene una cuenta para entrar a la aplicación. Si continúas, perderá el acceso a esta iglesia. Su cuenta no se elimina."
        confirmLabel="Eliminar y quitar acceso"
      />
    );
  }

  return (
    <DialogDeleteConfirmation
      open={person !== null}
      close={close}
      onDelete={remove}
      title={
        wholeChurch
          ? `Eliminar a ${name} de la iglesia`
          : `Quitar a ${name} de ${where}`
      }
      message={
        wholeChurch
          ? `${name} dejará de aparecer en la iglesia y en todos sus grupos y ministerios. Su historial (asistencia y cargos pasados) se conserva, y si vuelve podrás reactivar su registro al volver a registrarla.`
          : `${name} saldrá de ${where} y de lo que contiene. Seguirá en el resto de la iglesia si pertenece a otros grupos.`
      }
      confirmLabel={wholeChurch ? "Eliminar" : "Quitar"}
    />
  );
};
