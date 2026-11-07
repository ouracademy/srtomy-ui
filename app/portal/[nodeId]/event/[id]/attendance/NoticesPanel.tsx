"use client";

import {
  postEventsByIdNotices,
  useGetEventsByIdNotices,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { SaveButton } from "@/app/(components)/SaveButton";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useContext, useState } from "react";

type NoticesPanelProps = Readonly<{
  eventId: string;
  // Whoever may edit the event can write an announcement.
  canPost: boolean;
}>;

// The notices of the event, which also show on its public page: what changed
// (written by the system) and the announcements the organizers write here.
export const NoticesPanel = ({ eventId, canPost }: NoticesPanelProps) => {
  const alert = useContext(SnackbarContext);
  const { data, mutate } = useGetEventsByIdNotices(eventId);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const notices = data ?? [];

  if (notices.length === 0 && !canPost) return null;

  const post = async (submit: React.SubmitEvent<HTMLFormElement>) => {
    submit.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    try {
      await postEventsByIdNotices(eventId, { message: message.trim() });
      setMessage("");
      await mutate();
      alert.showMessage("Aviso publicado en la página del evento");
    } catch (error) {
      alert.showMessage(
        apiErrorMessage(error, "No se pudo publicar el aviso."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2 }}
      component="section"
      aria-label="Avisos"
    >
      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Avisos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Se muestran en la página del evento para quien abra el enlace, tenga
          cuenta o no. Los cambios de fecha, hora, lugar o ponentes se publican
          solos.
        </Typography>
        {canPost && (
          <form onSubmit={post}>
            <Stack spacing={1}>
              <TextField
                label="Nuevo aviso"
                multiline
                minRows={2}
                value={message}
                onChange={(change) => setMessage(change.target.value)}
                slotProps={{ htmlInput: { maxLength: 1000 } }}
              />
              <div>
                <SaveButton name="Publicar aviso" loading={saving} />
              </div>
            </Stack>
          </form>
        )}
        {notices.length > 0 && (
          <List dense disablePadding aria-label="Avisos publicados">
            {notices.map((notice) => (
              <ListItem
                key={`${notice.createdAt?.toString()}-${notice.message}`}
                disableGutters
              >
                <ListItemText
                  primary={notice.message}
                  secondary={
                    notice.createdAt
                      ? format(notice.createdAt, "d 'de' MMMM, HH:mm", {
                          locale: es,
                        })
                      : undefined
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Stack>
    </Paper>
  );
};
