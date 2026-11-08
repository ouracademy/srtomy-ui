"use client";

import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import type { CheckInResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import { TicketScanner } from "./TicketScanner";

type ScanCardProps = Readonly<{
  title: string;
  // Checks a ticket in; resolves with who came, or with the reason it failed.
  onCheckIn: (ticketCode: string) => Promise<CheckInResponse | string>;
}>;

const timeOf = (value?: Date) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Opens the scanner of tickets and keeps, right on the screen, the last one
// that came in, so the usher sees it worked without opening anything.
export const ScanCard = ({ title, onCheckIn }: ScanCardProps) => {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<CheckInResponse | null>(null);

  const checkIn = async (code: string) => {
    const result = await onCheckIn(code);
    if (typeof result !== "string") setLast(result);
    return result;
  };

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label="Escanear ticket"
      sx={{ p: 2.5, borderRadius: 5 }}
    >
      <Stack spacing={1.75}>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Escanear ticket
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          El ticket del congreso vale en cada sesión que lo incluye, tenga
          cuenta o no quien entra.
        </Typography>
        <Button
          variant="contained"
          sx={primaryButtonSx}
          startIcon={<QrCodeScannerIcon />}
          onClick={() => setOpen(true)}
        >
          Abrir la cámara
        </Button>
        {last && (
          <Alert severity="success" role="status" sx={{ borderRadius: 3 }}>
            <strong>
              {last.alreadyCheckedIn
                ? `Ya había ingresado a las ${timeOf(last.checkedInAt)}`
                : `Ingresó a las ${timeOf(last.checkedInAt)}`}
            </strong>
            <br />
            {last.name} · {last.ticketName}
          </Alert>
        )}
      </Stack>
      {open && (
        <TicketScanner
          title={title}
          close={() => setOpen(false)}
          onCheckIn={checkIn}
        />
      )}
    </Paper>
  );
};
