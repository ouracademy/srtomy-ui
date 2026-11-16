"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { approvalFields, isDeletion } from "./approval";

export type ApprovalPart = Readonly<{
  toolName: string;
  input: unknown;
  approval: Readonly<{
    id: string;
    approved?: boolean;
    requestReason?: string;
  }>;
}>;

type ApprovalCardProps = Readonly<{
  part: ApprovalPart;
  // Answers the request; the agent then runs the action or drops it.
  onRespond: (approvalId: string, approved: boolean) => void;
}>;

// Shows what the assistant is about to change and waits for «Confirmar» or
// «Cancelar». Once answered, the buttons stay (locked, with a spinner on the
// chosen one) until the agent reports back.
export const ApprovalCard = ({ part, onRespond }: ApprovalCardProps) => {
  const { approval } = part;
  const deletion = isDeletion(part.toolName);
  const fields = approvalFields(part.input);
  const answered = approval.approved !== undefined;

  return (
    <Alert
      severity={deletion ? "error" : "info"}
      icon={false}
      role="group"
      aria-label={deletion ? "Confirmar eliminación" : "Confirmar acción"}
      sx={{ alignItems: "flex-start", width: "100%" }}
    >
      <Stack spacing={1.5}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {approval.requestReason ?? "El asistente quiere hacer un cambio."}
        </Typography>
        {deletion && (
          <Typography variant="body2">No se puede deshacer.</Typography>
        )}
        {fields.length > 0 && (
          <Box component="dl" sx={{ m: 0, display: "grid", gap: 0.5 }}>
            {fields.map(({ label, value }) => (
              <Box key={label} sx={{ display: "flex", gap: 1 }}>
                <Typography
                  component="dt"
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                >
                  {label}:
                </Typography>
                <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            color={deletion ? "error" : "primary"}
            loading={answered && approval.approved === true}
            disabled={answered}
            onClick={() => onRespond(approval.id, true)}
          >
            Confirmar
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            loading={answered && approval.approved === false}
            disabled={answered}
            onClick={() => onRespond(approval.id, false)}
          >
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
};
