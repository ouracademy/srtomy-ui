import type { EventNoticeResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { Alert, AlertTitle, Stack, Typography } from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type EventNoticesProps = Readonly<{ notices: EventNoticeResponse[] }>;

// What the organizers and the system say about the event (a change of hour or
// place, an announcement). It is on the page so that anyone who opens the link
// sees it, with or without an account and whether or not they read email.
export const EventNotices = ({ notices }: EventNoticesProps) => {
  if (notices.length === 0) return null;
  return (
    <Stack component="section" aria-label="Avisos del evento" spacing={1}>
      <Typography variant="h6" component="h2">
        Avisos
      </Typography>
      {notices.map((notice) => (
        <Alert
          key={`${notice.createdAt?.toString()}-${notice.message}`}
          severity={notice.kind === "ANNOUNCEMENT" ? "info" : "warning"}
        >
          {notice.createdAt && (
            <AlertTitle>
              {format(notice.createdAt, "d 'de' MMMM, HH:mm", { locale: es })}
            </AlertTitle>
          )}
          {notice.message}
        </Alert>
      ))}
    </Stack>
  );
};
