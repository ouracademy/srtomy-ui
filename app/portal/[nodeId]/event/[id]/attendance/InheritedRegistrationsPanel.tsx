"use client";

import {
  putEventsByIdRegistrationsByRegistrationIdCheckIn,
  useGetEventsByIdRegistrations,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import Loading from "@/app/(components)/Loading";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import {
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useContext } from "react";

type InheritedRegistrationsPanelProps = Readonly<{
  eventId: string;
  // Whoever takes attendance can mark who came in.
  canCheckIn: boolean;
}>;

const timeOf = (value?: Date) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Who is expected in a sub-event that is entered with the sign-up of its mega
// event, and who already came in. The sign-up is set up in the mega event, so
// there is nothing to configure here.
export const InheritedRegistrationsPanel = ({
  eventId,
  canCheckIn,
}: InheritedRegistrationsPanelProps) => {
  const alert = useContext(SnackbarContext);
  const { data, isLoading, mutate } = useGetEventsByIdRegistrations(eventId);
  if (isLoading) return <Loading />;
  const expected = data ?? [];
  const came = expected.filter((item) => item.checkedInAt).length;

  const check = async (registrationId: string, checkedIn: boolean) => {
    try {
      await putEventsByIdRegistrationsByRegistrationIdCheckIn(
        eventId,
        registrationId,
        { checkedIn },
      );
    } catch (error) {
      alert.showMessage(
        apiErrorMessage(error, "No se pudo cambiar el ingreso"),
      );
      return;
    }
    await mutate();
    alert.showMessage(checkedIn ? "Ingreso marcado" : "Ingreso quitado");
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2 }}
      component="section"
      aria-label="Esperados"
    >
      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Esperados
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`Esperados: ${expected.length}`} />
          <Chip size="small" label={`Ingresaron: ${came}`} />
        </Stack>
        {expected.length === 0 ? (
          <Typography color="text.secondary">
            Aún no hay inscritos en el evento.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Inscritos del evento">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Ticket</TableCell>
                  <TableCell>Ingreso</TableCell>
                  {canCheckIn && <TableCell>Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {expected.map((item) => {
                  const name = `${item.firstName} ${item.lastName}`;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{name}</TableCell>
                      <TableCell>{item.ticketName}</TableCell>
                      <TableCell>
                        {item.checkedInAt
                          ? `Ingresó a las ${timeOf(item.checkedInAt)}`
                          : "Aún no"}
                      </TableCell>
                      {canCheckIn && (
                        <TableCell>
                          <Button
                            size="small"
                            aria-label={
                              item.checkedInAt
                                ? `Quitar el ingreso de ${name}`
                                : `Marcar el ingreso de ${name}`
                            }
                            onClick={() =>
                              void check(item.id ?? "", !item.checkedInAt)
                            }
                          >
                            {item.checkedInAt
                              ? "Quitar ingreso"
                              : "Marcar ingreso"}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Paper>
  );
};
