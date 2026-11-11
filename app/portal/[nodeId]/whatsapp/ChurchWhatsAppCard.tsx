"use client";

import {
  Alert,
  AlertTitle,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import type {
  ProvisionTemplatesResponse,
  WhatsAppConnectionResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SaveButton } from "@/app/(components)/SaveButton";
import {
  connectionLabels,
  disconnectNotice,
  unlinkGuideUrl,
  unlinkSteps,
} from "./whatsappLink";

type ChurchWhatsAppCardProps = Readonly<{
  connection: WhatsAppConnectionResponse;
  // Asks for the link and sends the pastor to Kapso to finish connecting.
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  // Pauses or resumes the assistant; the number stays connected.
  onSetAgentPaused: (paused: boolean) => Promise<void>;
  // Sends the message templates to Meta for review. Undefined when it could
  // not be done: the screen has already said why.
  onSubmitTemplates: () => Promise<ProvisionTemplatesResponse | undefined>;
}>;

// The WhatsApp of the church: whether it is connected, and the way to connect
// or cut it. Whoever holds org.update on the church sees it; the API checks.
export const ChurchWhatsAppCard = ({
  connection,
  onConnect,
  onDisconnect,
  onSetAgentPaused,
  onSubmitTemplates,
}: ChurchWhatsAppCardProps) => {
  const [changingPause, setChangingPause] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [confirmingCut, setConfirmingCut] = React.useState(false);
  const [submittingTemplates, setSubmittingTemplates] = React.useState(false);
  const [templates, setTemplates] =
    React.useState<ProvisionTemplatesResponse | null>(null);

  const status = connection.status ?? "NOT_CONNECTED";
  const state = connectionLabels[status];
  const connected = status === "CONNECTED";
  const paused = connected && connection.agentPaused === true;
  const lostNotice =
    status === "DISCONNECTED"
      ? disconnectNotice(connection.disconnectReason)
      : undefined;

  const connect = async () => {
    setConnecting(true);
    try {
      await onConnect();
    } finally {
      setConnecting(false);
    }
  };

  const setPaused = async (paused: boolean) => {
    setChangingPause(true);
    try {
      await onSetAgentPaused(paused);
    } finally {
      setChangingPause(false);
    }
  };

  const submitTemplates = async () => {
    setSubmittingTemplates(true);
    try {
      const submitted = await onSubmitTemplates();
      if (submitted) setTemplates(submitted);
    } finally {
      setSubmittingTemplates(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography component="h2" variant="h6">
            WhatsApp de la iglesia
          </Typography>
          <Chip size="small" color={state.color} label={state.label} />
          {paused && (
            <Chip size="small" color="warning" label="Asistente en pausa" />
          )}
        </Stack>

        {lostNotice && <Alert severity="warning">{lostNotice}</Alert>}

        {status === "DISCONNECTED" &&
          connection.disconnectReason === "PASTOR" && (
            <Alert severity="info">
              <AlertTitle>WhatsApp quedó desconectado de Sr. Tommy</AlertTitle>
              El asistente ya no responde ni envía avisos. Para desconectarlo
              por completo, hazlo también en el celular de la iglesia (Meta no
              deja que Sr. Tommy lo quite por ti):
              <ol>
                {unlinkSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              No es necesario para dejar de usar el asistente, pero sí si más
              adelante quieres usar otro proveedor o falla al volver a conectar.{" "}
              <Link href={unlinkGuideUrl} target="_blank" rel="noreferrer">
                Guía de Kapso para desconectarlo
              </Link>
            </Alert>
          )}

        {connected ? (
          <Typography>
            Número conectado:{" "}
            <strong>
              {connection.displayNumber ?? "(sin número visible)"}
            </strong>
            {connection.inherited
              ? ". Es el de la iglesia: esta sede lo usa. Para desconectarlo o enviar las plantillas, entra a la iglesia."
              : ""}
          </Typography>
        ) : (
          <Typography color="text.secondary">
            Conecta el WhatsApp de la iglesia para que el asistente responda a
            los miembros y para enviarles avisos. El celular de la iglesia sigue
            funcionando con la app WhatsApp Business (no sirve el WhatsApp
            personal). Hazlo desde una computadora y con el celular a la mano:
            Meta muestra un código QR que se escanea desde la app. Toma unos
            cinco minutos.
          </Typography>
        )}

        {!connected && !connection.inherited && (
          <>
            <Alert severity="info">
              Meta cobra los mensajes de WhatsApp directamente a la iglesia, con
              su propia tarjeta y en la moneda de su cuenta. Los primeros 1.000
              mensajes de respuesta de cada mes son gratis. Para los avisos con
              plantilla (como el recordatorio de un evento), Meta pide tener un
              método de pago en la cuenta de WhatsApp Business de la iglesia
              (Meta Billing Hub).
            </Alert>
            <div>
              <SaveButton
                name="Conectar WhatsApp"
                loading={connecting}
                onClick={connect}
              />
            </div>
          </>
        )}

        {connected && !connection.inherited && (
          <Stack spacing={1}>
            <Typography component="h3" variant="subtitle1">
              Asistente
            </Typography>
            {paused ? (
              <Alert severity="warning">
                El asistente está en pausa: no responde a nadie. El número sigue
                conectado, así que la iglesia puede contestar a mano desde la
                app WhatsApp Business. Los recordatorios de eventos siguen
                saliendo y quien escribe STOP sigue dejando de recibirlos.
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Si quieres contestar tú a los miembros por un tiempo, pausa el
                asistente. El número sigue conectado y puedes reanudarlo cuando
                quieras.
              </Typography>
            )}
            <div>
              <SaveButton
                name={paused ? "Reanudar asistente" : "Pausar asistente"}
                loading={changingPause}
                onClick={() => setPaused(!paused)}
              />
            </div>
          </Stack>
        )}

        {connected && !connection.inherited && (
          <Stack spacing={1}>
            <Typography component="h3" variant="subtitle1">
              Plantillas de mensajes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              WhatsApp solo deja que la iglesia escriba primero con mensajes
              aprobados por Meta, como el recordatorio de un evento. Envíalos
              una vez para que los revise (suele tomar hasta un día). Repetirlo
              no hace daño.
            </Typography>
            <div>
              <SaveButton
                name="Enviar plantillas a Meta"
                loading={submittingTemplates}
                onClick={submitTemplates}
              />
            </div>
            {templates?.templates?.map((template) => (
              <Alert
                key={template.name}
                severity={template.submitted ? "success" : "warning"}
              >
                {template.submitted
                  ? `«${template.name}» enviada a Meta para su revisión.`
                  : `«${template.name}» no se envió: ${template.detail ?? "Meta la rechazó"}`}
              </Alert>
            ))}
          </Stack>
        )}

        {connected && !connection.inherited && (
          <div>
            <Button
              color="error"
              variant="outlined"
              onClick={() => setConfirmingCut(true)}
            >
              Desconectar
            </Button>
          </div>
        )}
      </Stack>

      <DialogDeleteConfirmation
        open={confirmingCut}
        title="¿Desconectar el WhatsApp de la iglesia?"
        message="El asistente dejará de responder y los avisos pendientes no saldrán. El número se retira de Sr. Tommy y de Kapso. Si solo quieres contestar tú por un tiempo, usa «Pausar asistente»: es más simple y se deshace. Podrás conectarlo de nuevo cuando quieras."
        confirmLabel="Desconectar"
        close={() => setConfirmingCut(false)}
        onDelete={async () => {
          await onDisconnect();
          setConfirmingCut(false);
        }}
      />
    </Paper>
  );
};
