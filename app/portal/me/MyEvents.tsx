"use client";

import {
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import NextLink from "next/link";
import type { MyEventResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { sharedEventPath } from "@/app/(components)/eventSharing";

// Events and courses the user signed up for or attended; each opens at its
// shared page.
export const MyEvents = ({
  events,
}: Readonly<{ events: MyEventResponse[] }>) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography variant="h6" component="h2">
      Mis eventos y cursos
    </Typography>
    {events.length === 0 && (
      <Typography color="text.secondary">
        Aún no te has inscrito ni has asistido a un evento o curso.
      </Typography>
    )}
    <List aria-label="Mis eventos y cursos">
      {events.map((event) => (
        <ListItem key={event.slug} disableGutters>
          <ListItemText
            primary={
              <NextLink href={sharedEventPath(event.slug ?? "")}>
                {event.title}
              </NextLink>
            }
            secondaryTypographyProps={{ component: "div" }}
            secondary={
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap>
                <span>
                  {[
                    event.isACourse ? "Curso" : "Evento",
                    event.organizationName,
                    event.start
                      ? format(event.start, "d 'de' MMMM yyyy", { locale: es })
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {event.registered && <Chip size="small" label="Inscrito" />}
                {event.attended && <Chip size="small" label="Asististe" />}
              </Stack>
            }
          />
        </ListItem>
      ))}
    </List>
  </Paper>
);
