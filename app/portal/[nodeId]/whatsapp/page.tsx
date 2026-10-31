"use client";

import { Stack, Typography } from "@mui/material";
import React from "react";
import {
  deleteOrganizationsByIdWhatsapp,
  deleteOrganizationsByIdWhatsappLink,
  postOrganizationsByIdWhatsappLinkCode,
  postOrganizationsByIdWhatsappSetupLink,
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
export default function WhatsAppPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const alert = React.useContext(SnackbarContext);
  const { can } = usePermissions(nodeId);
  const canConnect = can("org.update");

  const {
    data: connection,
    error: connectionError,
    isLoading: loadingConnection,
    mutate: refreshConnection,
  } = useGetOrganizationsByIdWhatsapp(nodeId, {
    swr: { enabled: canConnect },
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
