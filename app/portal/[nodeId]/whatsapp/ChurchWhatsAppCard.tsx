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
  SetupLinkRequestMode,
  WhatsAppConnectionResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SaveButton } from "@/app/(components)/SaveButton";
import { connectionLabels } from "./whatsappLink";

type ChurchWhatsAppCardProps = Readonly<{
  connection: WhatsAppConnectionResponse;
  // Asks for the link and sends the pastor to Kapso to finish connecting.
  onConnect: (mode: SetupLinkRequestMode) => Promise<void>;
  onDisconnect: () => Promise<void>;
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
}: ChurchWhatsAppCardProps) => {
  const [mode, setMode] = React.useState<SetupLinkRequestMode>("COEXISTENCE");
  const [connecting, setConnecting] = React.useState(false);
  const [confirmingCut, setConfirmingCut] = React.useState(false);

  const status = connection.status ?? "NOT_CONNECTED";
  const state = connectionLabels[status];
  const connected = status === "CONNECTED";

  const connect = async () => {
    setConnecting(true);
    try {
      await onConnect(mode);
    } finally {
      setConnecting(false);
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
