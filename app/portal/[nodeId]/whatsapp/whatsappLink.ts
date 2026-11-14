// Pure helpers of the WhatsApp screen: what the person sends and where.

// The word the agent reads before anything else, then the code.
export const linkKeyword = "VINCULAR";

// What the person sends from their WhatsApp: "VINCULAR ABCD-EFGH".
export const linkMessage = (code: string) => `${linkKeyword} ${code}`;

// wa.me opens WhatsApp with the message already written, so the person only
// has to press send. It needs the number with digits only, and without it
// (the API may not know it yet) there is no link.
export const waMeUrl = (displayNumber: string | undefined, code: string) => {
  const digits = (displayNumber ?? "").replaceAll(/\D/g, "");
  return digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(linkMessage(code))}`
    : undefined;
};

type ConnectionStatus =
  "NOT_CONNECTED" | "PENDING" | "CONNECTED" | "DISCONNECTED";

export const connectionLabels: Record<
  ConnectionStatus,
  { label: string; color: "default" | "warning" | "success" }
> = {
  NOT_CONNECTED: { label: "Sin conectar", color: "default" },
  PENDING: { label: "Conexión pendiente", color: "warning" },
  CONNECTED: { label: "Conectado", color: "success" },
  DISCONNECTED: { label: "Desconectado", color: "default" },
};

type DisconnectReason =
  | "PASTOR"
  | "NUMBER_DELETED"
  | "NUMBER_OFFBOARDED"
  | "ACCESS_REMOVED"
  | "ACCOUNT_DISABLED";

// The steps that cut the link of Kapso in the phone. Only the owner of the
// WhatsApp Business app can do it: Meta does not let a provider (nor Sr. Tommy)
// remove a number tied to the app, so the card shows them after "Desconectar".
export const unlinkSteps = [
  "Abre la app WhatsApp Business en el celular de la iglesia.",
  "Entra a Ajustes → Cuenta → Plataforma comercial.",
  "Toca «Kapso» y luego «Desconectar».",
];

// Kapso's own guide: where it says the connected provider is listed in the app
// and has to be disconnected there.
export const unlinkGuideUrl =
  "https://docs.kapso.ai/docs/how-to/whatsapp/coexistence-troubleshooting";

// What to tell the pastor when the number stopped working without them
// pressing "Desconectar" (Meta or Kapso cut it). Undefined when they did it
// themselves (the card then shows the steps to unlink the phone) or the API
// does not say why.
export const disconnectNotice = (
  reason: DisconnectReason | undefined,
): string | undefined => {
  switch (reason) {
    case "NUMBER_DELETED":
      return "El número se quitó de Sr. Tommy. El asistente no responde ni envía avisos. Conéctalo de nuevo.";
    case "NUMBER_OFFBOARDED":
      return "Meta dio de baja el número de la API de WhatsApp. El asistente no responde ni envía avisos. Conéctalo de nuevo.";
    case "ACCESS_REMOVED":
      return "Se quitó el acceso de Sr. Tommy al número, o se desinstaló la app desde Facebook. El asistente no responde ni envía avisos. Conéctalo de nuevo.";
    case "ACCOUNT_DISABLED":
      return "Meta desactivó la cuenta de WhatsApp Business de la iglesia. El asistente no responde ni envía avisos. Revisa el aviso de Meta en el Administrador de WhatsApp Business: cuando la reactive, el asistente vuelve solo.";
    default:
      return undefined;
  }
};

// Minutes left of a code, never below zero: it lasts ten.
export const minutesLeft = (expiresAt: Date | undefined, now: Date) =>
  expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 60_000))
    : 0;
