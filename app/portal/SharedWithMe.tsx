"use client";

import { List, ListItem, ListItemText, Paper, Typography } from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import NextLink from "next/link";
import type { SharedWithMeResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  sharedEventPath,
  shareRoleLabels,
} from "@/app/(components)/eventSharing";

// Events and courses other people shared with the signed-in user; each opens
// at its shared page.
export const SharedWithMe = ({
  events,
  showEmpty = false,
  description,
}: Readonly<{
  events: SharedWithMeResponse[];
  // What the section is, in plain words, under its title.
  description?: string;
  // "Mi espacio" always shows the section; the portal home only when needed.
  showEmpty?: boolean;
}>) => {
  if (events.length === 0 && !showEmpty) return null;
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" component="h2">
        Compartidos contigo
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          {description}
        </Typography>
      )}
      {events.length === 0 && (
        <Typography
          sx={{
            color: "text.secondary",
          }}
        >
          Nadie ha compartido eventos ni cursos contigo todavía.
        </Typography>
      )}
      <List aria-label="Compartidos contigo">
        {events.map((event) => (
          <ListItem key={event.slug} disableGutters>
            <ListItemText
              primary={
                <NextLink href={sharedEventPath(event.slug ?? "")}>
                  {event.title}
                </NextLink>
              }
              secondary={[
                event.isACourse ? "Curso" : "Evento",
                event.organizationName,
                event.start
                  ? format(event.start, "d 'de' MMMM yyyy", { locale: es })
                  : undefined,
                shareRoleLabels[event.role ?? "VIEWER"],
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
