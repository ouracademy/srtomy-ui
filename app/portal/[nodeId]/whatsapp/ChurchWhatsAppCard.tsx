"use client";

import {
  Alert,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import type {
  ProvisionTemplatesResponse,
  SetupLinkRequestMode,
  WhatsAppConnectionResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SaveButton } from "@/app/(components)/SaveButton";
import { connectionLabels, disconnectNotice } from "./whatsappLink";

type ChurchWhatsAppCardProps = Readonly<{
  connection: WhatsAppConnectionResponse;
  // Asks for the link and sends the pastor to Kapso to finish connecting.
  onConnect: (mode: SetupLinkRequestMode) => Promise<void>;
  onDisconnect: () => Promise<void>;
  // Sends the message templates to Meta for review. Undefined when it could
  // not be done: the screen has already said why.
  onSubmitTemplates: () => Promise<ProvisionTemplatesResponse | undefined>;
}>;

const modes: { value: SetupLinkRequestMode; title: string; help: string }[] = [
  {
    value: "COEXISTENCE",
    title: "Seguir usando la app de WhatsApp Business",
    help: "El celular de la iglesia sigue funcionando y el asistente responde al mismo tiempo.",
  },
  {
    value: "DEDICATED",
    title: "Solo para el asistente",
    help: "El número se usa solo por la API: ya no se abre en la app del celular.",
  },
];

// The WhatsApp of the church: whether it is connected, and the way to connect
// or cut it. Whoever holds org.update on the church sees it; the API checks.
export const ChurchWhatsAppCard = ({
  connection,
  onConnect,
  onDisconnect,
  onSubmitTemplates,
}: ChurchWhatsAppCardProps) => {
  const [mode, setMode] = React.useState<SetupLinkRequestMode>("COEXISTENCE");
  const [connecting, setConnecting] = React.useState(false);
  const [confirmingCut, setConfirmingCut] = React.useState(false);
  const [submittingTemplates, setSubmittingTemplates] = React.useState(false);
  const [templates, setTemplates] =
    React.useState<ProvisionTemplatesResponse | null>(null);

  const status = connection.status ?? "NOT_CONNECTED";
  const state = connectionLabels[status];
  const connected = status === "CONNECTED";
  const lostNotice =
    status === "DISCONNECTED"
      ? disconnectNotice(connection.disconnectReason)
      : undefined;

  const connect = async () => {
    setConnecting(true);
    try {
      await onConnect(mode);
    } finally {
      setConnecting(false);
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
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography component="h2" variant="h6">
            WhatsApp de la iglesia
          </Typography>
          <Chip size="small" color={state.color} label={state.label} />
        </Stack>

        {lostNotice && <Alert severity="warning">{lostNotice}</Alert>}

        {connected ? (
          <Typography>
            Número conectado:{" "}
            <strong>
              {connection.displayNumber ?? "(sin número visible)"}
            </strong>
            {connection.inherited
              ? ". Es el de la iglesia: esta sede lo usa."
              : ""}
          </Typography>
        ) : (
          <Typography color="text.secondary">
            Conecta el WhatsApp de la iglesia para que el asistente responda a
            los miembros y para enviarles avisos. Se abre una página de Meta
            donde inicias sesión con Facebook y verificas el número; toma unos
            cinco minutos.
          </Typography>
        )}

        {!connected && !connection.inherited && (
          <>
            <FormControl>
              <FormLabel id="whatsapp-mode">Cómo quieres conectarlo</FormLabel>
              <RadioGroup
                aria-labelledby="whatsapp-mode"
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as SetupLinkRequestMode)
                }
              >
                {modes.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={
                      <>
                        <Typography>{option.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.help}
                        </Typography>
                      </>
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Alert severity="info">
              Los mensajes que envíe el asistente los paga Sr. Tommy a Meta; se
              cobran al plan de la iglesia.
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
        message="El asistente dejará de responder y los avisos pendientes no saldrán. Podrás conectarlo de nuevo cuando quieras."
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
