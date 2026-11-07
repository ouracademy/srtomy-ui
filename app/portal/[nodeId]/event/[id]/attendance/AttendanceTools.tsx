"use client";

import { Stack } from "@mui/material";
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
import type { VisitorForm } from "./AddVisitorDialog";
import { QrCard } from "./QrCard";
import { ScanCard } from "./ScanCard";
import { VisitorsCard } from "./VisitorsCard";

type AttendanceToolsProps = Readonly<{
  eventId: string;
  title: string;
  guestCount: number;
  // Something changed in the attendance that the list on screen should show.
  onChanged: () => void;
}>;

// What the people who take attendance use besides the list, one card each: the
// QR that people scan to mark themselves, the scanner of tickets, and the
// visitors.
export const AttendanceTools = ({
  eventId,
  title,
  guestCount,
  onChanged,
}: AttendanceToolsProps) => {
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();

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
      await postEventsByIdAttendanceVisitors(eventId, {
        firstName: visitor.firstName.trim(),
        lastName: visitor.lastName.trim() || undefined,
        phoneNumber: visitor.phoneNumber.trim() || undefined,
        email: visitor.email.trim() || undefined,
      });
      onChanged();
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
    <Stack spacing={3} component="aside">
      <QrCard eventId={eventId} title={title} />
      <ScanCard title={title} onCheckIn={checkIn} />
      <VisitorsCard
        guestCount={guestCount}
        onAddVisitor={addVisitor}
        onSaveGuests={saveGuests}
      />
    </Stack>
  );
};
