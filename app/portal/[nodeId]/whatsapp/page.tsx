"use client";

import { Alert, Stack, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import React from "react";
import {
  deleteOrganizationsByIdWhatsapp,
  deleteOrganizationsByIdWhatsappLink,
  postOrganizationsByIdWhatsappLinkCode,
  postOrganizationsByIdWhatsappSetupLink,
  postOrganizationsByIdWhatsappTemplates,
  useGetOrganizationsByIdWhatsapp,
  useGetOrganizationsByIdWhatsappLink,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { ChurchWhatsAppCard } from "./ChurchWhatsAppCard";
import { MyWhatsAppCard } from "./MyWhatsAppCard";

// WhatsApp of the church, in two parts: connecting the church's number (whoever
// can edit the church) and linking one's own WhatsApp to one's account (any
// signed-in person with a person in the church).
// How long to wait for the provider's notice after the pastor comes back from
// the registration: it is not instant.
const waitForConfirmation = 60_000;
const checkEvery = 3000;

export default function WhatsAppPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const alert = React.useContext(SnackbarContext);
  const { can } = usePermissions(nodeId);
  const canConnect = can("org.update");
  // The registration page sends the pastor back here with ?conexion=completada
  // or ?conexion=fallida.
  const returned = useSearchParams().get("conexion");
  const [gaveUp, setGaveUp] = React.useState(false);
  React.useEffect(() => {
    if (returned !== "completada") return;
    const timer = setTimeout(() => setGaveUp(true), waitForConfirmation);
    return () => clearTimeout(timer);
  }, [returned]);

  const {
    data: connection,
    error: connectionError,
    isLoading: loadingConnection,
    mutate: refreshConnection,
  } = useGetOrganizationsByIdWhatsapp(nodeId, {
    swr: {
      enabled: canConnect,
      // Until the notice arrives the connection still says "pending".
      refreshInterval: (latest) =>
        returned === "completada" && latest?.status !== "CONNECTED" && !gaveUp
          ? checkEvery
          : 0,
    },
  });
  const {
    data: link,
    error: linkError,
    isLoading: loadingLink,
    mutate: refreshLink,
  } = useGetOrganizationsByIdWhatsappLink(nodeId);

  if (loadingLink || (canConnect && loadingConnection)) return <Loading />;
  if (!link) return <ResourceError error={linkError} />;
  if (canConnect && !connection)
    return <ResourceError error={connectionError} />;

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography component="h1" variant="h5">
        WhatsApp
      </Typography>

      {canConnect && returned === "fallida" && (
        <Alert severity="error">
          No se pudo completar la conexión con WhatsApp. Puedes intentarlo de
          nuevo.
        </Alert>
      )}
      {canConnect && returned === "completada" && (
        <ReturnedNotice
          connected={connection?.status === "CONNECTED"}
          gaveUp={gaveUp}
        />
      )}

      {canConnect && connection && (
        <ChurchWhatsAppCard
          connection={connection}
          onConnect={async (mode) => {
            try {
              const created = await postOrganizationsByIdWhatsappSetupLink(
                nodeId,
                { mode },
              );
              if (created.url) globalThis.location.assign(created.url);
            } catch (error) {
              alert.showMessage(
                apiErrorMessage(error, "No se pudo crear el enlace"),
              );
            }
          }}
          onSubmitTemplates={async () => {
            try {
              return await postOrganizationsByIdWhatsappTemplates(nodeId);
            } catch (error) {
              alert.showMessage(
                apiErrorMessage(error, "No se pudieron enviar las plantillas"),
              );
              return undefined;
            }
          }}
          onDisconnect={async () => {
            try {
              await deleteOrganizationsByIdWhatsapp(nodeId);
              await refreshConnection();
              alert.showMessage("WhatsApp desconectado");
            } catch (error) {
              alert.showMessage(
                apiErrorMessage(error, "No se pudo desconectar"),
              );
            }
          }}
        />
      )}

      <MyWhatsAppCard
        link={link}
        onRequestCode={async () => {
          try {
            return await postOrganizationsByIdWhatsappLinkCode(nodeId);
          } catch (error) {
            alert.showMessage(
              apiErrorMessage(error, "No se pudo obtener el código"),
            );
            return undefined;
          }
        }}
        onUnlink={async () => {
          try {
            await deleteOrganizationsByIdWhatsappLink(nodeId);
            await refreshLink();
            alert.showMessage("WhatsApp desvinculado");
          } catch (error) {
            alert.showMessage(apiErrorMessage(error, "No se pudo desvincular"));
          }
        }}
      />
    </Stack>
  );
}

// What the pastor sees after finishing the registration, while we wait for the
// provider to tell us the number is connected.
const ReturnedNotice = ({
  connected,
  gaveUp,
}: Readonly<{ connected: boolean; gaveUp: boolean }>) => {
  if (connected) {
    return <Alert severity="success">WhatsApp quedó conectado.</Alert>;
  }
  if (gaveUp) {
    return (
      <Alert severity="warning">
        Todavía no recibimos la confirmación de WhatsApp. Recarga la página en
        unos minutos; si sigue pendiente, vuelve a conectar.
      </Alert>
    );
  }
  return (
    <Alert severity="info" role="status">
      Estamos confirmando la conexión con WhatsApp. Puede tardar unos segundos.
    </Alert>
  );
};
