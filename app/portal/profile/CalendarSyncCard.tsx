"use client";

import { useContext, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  useGetMeCalendarFeed,
  usePostMeCalendarFeedRenew,
} from "@/app/(api)/generated";
import { apiUrl } from "@/app/(api)/client";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { calendarLinks } from "./calendarFeed";

// Lets the user see their events in Google Calendar, Apple Calendar or any
// app that subscribes to an .ics address. It is read only: the address is
// private (the token in it is the credential) and a new one revokes the old.
export const CalendarSyncCard = () => {
  const alert = useContext(SnackbarContext);
  const { data, error, isLoading, mutate } = useGetMeCalendarFeed();
  const { trigger: renew, isMutating } = usePostMeCalendarFeedRenew();
  const [confirmRenew, setConfirmRenew] = useState(false);

  if (isLoading) return <Loading />;
  if (!data?.path) return <ResourceError error={error} />;

  const links = calendarLinks(apiUrl, data.path);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.url);
      alert.showMessage("Enlace copiado");
    } catch {
      alert.showMessage("No se pudo copiar. Selecciónalo y cópialo a mano.");
    }
  };

  const renewLink = async () => {
    try {
      await mutate(await renew(), { revalidate: false });
      alert.showMessage("Listo: el enlace anterior ya no funciona");
    } catch {
      alert.showMessage("No se pudo generar el enlace. Intenta de nuevo.");
    } finally {
      setConfirmRenew(false);
    }
  };

  return (
    <Card sx={{ margin: 4, maxWidth: 720 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5">Sincroniza con tu calendario</Typography>
          <Typography>
            Mira los eventos y cursos de tus iglesias en Google Calendar, Apple
            Calendar u otra app de calendario. Solo puedes verlos: lo que
            cambies allí no cambia aquí. Las apps se actualizan solas; Google
            puede tardar hasta un día en mostrar un cambio.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              href={links.google}
              target="_blank"
              rel="noopener noreferrer"
            >
              Agregar a Google Calendar
            </Button>
            <Button variant="outlined" href={links.webcal}>
              Agregar a Apple Calendar
            </Button>
          </Stack>
          <Typography variant="subtitle2">
            O pega este enlace en tu app de calendario («Agregar calendario por
            URL»):
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Enlace del calendario"
              value={links.url}
              slotProps={{ input: { readOnly: true } }}
            />
            <Button variant="outlined" onClick={copy}>
              Copiar enlace
            </Button>
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            Este enlace es privado: quien lo tenga ve tus eventos. Si lo
            compartiste sin querer, genera uno nuevo y el anterior dejará de
            funcionar.
          </Typography>
          <div>
            <Button color="error" onClick={() => setConfirmRenew(true)}>
              Generar un enlace nuevo
            </Button>
          </div>
        </Stack>
      </CardContent>
      <Dialog open={confirmRenew} onClose={() => setConfirmRenew(false)}>
        <DialogTitle>¿Generar un enlace nuevo?</DialogTitle>
        <DialogContent>
          El enlace anterior dejará de funcionar y tendrás que agregar el
          calendario de nuevo en tus apps.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRenew(false)} disabled={isMutating}>
            Cancelar
          </Button>
          <LoadingButton color="error" loading={isMutating} onClick={renewLink}>
            Generar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
