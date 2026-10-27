"use client";

import QrCode2Icon from "@mui/icons-material/QrCode2";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { Button, Stack } from "@mui/material";
import React from "react";
import { useSWRConfig } from "swr";
import {
  postEventsByIdAttendanceCheckIn,
  postEventsByIdAttendanceVisitors,
  putEventsByIdAttendanceGuests,
} from "@/app/(api)/generated";
import type { CheckInResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { AttendanceQrDialog } from "./AttendanceQrDialog";
import { TicketScanner } from "./TicketScanner";
import { VisitorsPanel, type VisitorForm } from "./VisitorsPanel";

type AttendanceToolsProps = Readonly<{
  eventId: string;
  title: string;
  guestCount: number;
  // Something changed in the attendance that the list on screen should show.
  onChanged: () => void;
  // A new visitor was marked as present: keep them in the list being edited.
  onVisitorAdded: (personId: string) => void;
}>;

// What the people who take attendance use besides the list: the QR that people
// scan to mark themselves, the scanner of tickets, and the visitors.
export const AttendanceTools = ({
  eventId,
  title,
  guestCount,
  onChanged,
  onVisitorAdded,
}: AttendanceToolsProps) => {
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();
  const [showing, setShowing] = React.useState<"qr" | "scanner" | null>(null);

  // The people grid reads from the same list the new visitor now belongs to.
  const refreshPeople = () =>
    mutate(
      (key) =>
        (Array.isArray(key) ? String(key[0]) : String(key)).startsWith(
          "/v1/people",
        ),
      undefined,
      { revalidate: true },
    );

  const addVisitor = async (visitor: VisitorForm) => {
    try {
      const result = await postEventsByIdAttendanceVisitors(eventId, {
        firstName: visitor.firstName.trim(),
        lastName: visitor.lastName.trim() || undefined,
        phoneNumber: visitor.phoneNumber.trim() || undefined,
        email: visitor.email.trim() || undefined,
      });
      onVisitorAdded(result.personId ?? "");
      await refreshPeople();
      alert.showMessage("Visitante agregado y marcado como presente");
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo agregar al visitante"),
      );
      throw failure;
    }
  };

  const saveGuests = async (guestCountToSave: number) => {
    try {
      await putEventsByIdAttendanceGuests(eventId, {
        guestCount: guestCountToSave,
      });
      onChanged();
      alert.showMessage("Cantidad guardada");
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo guardar la cantidad"),
      );
      throw failure;
    }
  };

  const checkIn = async (
    ticketCode: string,
  ): Promise<CheckInResponse | string> => {
    try {
      const result = await postEventsByIdAttendanceCheckIn(eventId, {
        ticketCode,
      });
      onChanged();
      return result;
    } catch (failure) {
      return apiErrorMessage(
        failure,
        "Ese código no es un ticket de este evento",
      );
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          variant="outlined"
          startIcon={<QrCode2Icon />}
          onClick={() => setShowing("qr")}
        >
          Mostrar QR de asistencia
        </Button>
        <Button
          variant="outlined"
          startIcon={<QrCodeScannerIcon />}
          onClick={() => setShowing("scanner")}
        >
          Escanear tickets
        </Button>
      </Stack>
      <VisitorsPanel
        guestCount={guestCount}
        onAddVisitor={addVisitor}
        onSaveGuests={saveGuests}
      />
      {showing === "qr" && (
        <AttendanceQrDialog
          eventId={eventId}
          title={title}
          close={() => setShowing(null)}
        />
      )}
      {showing === "scanner" && (
        <TicketScanner
          title={title}
          close={() => setShowing(null)}
          onCheckIn={checkIn}
        />
      )}
    </Stack>
  );
};
