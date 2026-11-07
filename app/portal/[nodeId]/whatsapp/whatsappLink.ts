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

// Minutes left of a code, never below zero: it lasts ten.
export const minutesLeft = (expiresAt: Date | undefined, now: Date) =>
  expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 60_000))
    : 0;
