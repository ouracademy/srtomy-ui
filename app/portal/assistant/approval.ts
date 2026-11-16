// Helpers for the confirmation card: what is being asked, in the user's words.
// The sentence itself comes from the server (approval.requestReason); here is
// only the classification and the data summary.

// The agent names each operation `<method>_<path>`.
export const isWrite = (toolName: string) =>
  !toolName.toLowerCase().startsWith("get_");

export const isDeletion = (toolName: string) =>
  toolName.toLowerCase().startsWith("delete_");

const labels: Record<string, string> = {
  name: "Nombre",
  title: "Título",
  startTime: "Inicio",
  endTime: "Fin",
  start: "Inicio",
  end: "Fin",
  firstName: "Nombres",
  lastName: "Apellidos",
  email: "Correo",
  phone: "Teléfono",
  phoneNumber: "Teléfono",
  address: "Dirección",
  description: "Descripción",
  place: "Lugar",
  type: "Tipo",
};

// Ids and flags that say nothing to the user.
const hidden = (key: string) => /(^id$|Id$|Ids$)/.test(key);

const format = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const items = value.map(format).filter(Boolean);
    return items.length > 0 ? items.join(", ") : undefined;
  }
  return undefined;
};

export type ApprovalField = Readonly<{ label: string; value: string }>;

// The main data of the call: top-level fields and those of `body`, without ids.
export const approvalFields = (input: unknown): ApprovalField[] => {
  if (typeof input !== "object" || input === null) return [];
  const record = input as Record<string, unknown>;
  const body =
    typeof record.body === "object" && record.body !== null
      ? (record.body as Record<string, unknown>)
      : {};
  const { body: _body, ...rest } = record;
  void _body;
  return Object.entries({ ...rest, ...body }).flatMap(([key, raw]) => {
    const value = format(raw);
    return value === undefined || hidden(key)
      ? []
      : [{ label: labels[key] ?? key, value }];
  });
};
