"use client";

import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  Badge,
  Chip,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import NextLink from "next/link";
import * as React from "react";
import { useGetMeEvents } from "@/app/(api)/generated";
import { sharedEventPath } from "@/app/(components)/eventSharing";
import {
  eventKey,
  readSeenEvents,
  registeredEvents,
  saveSeenEvents,
} from "./seenEvents";

// Bell of the top bar: the badge counts the events and courses the user signed
// up for and has not seen yet. Opening it lists all of them and marks them as
// seen, so the badge goes away until a new sign-up arrives.
export const EventsBell = () => {
  const { data } = useGetMeEvents();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [seen, setSeen] = React.useState(readSeenEvents);
  // What was unseen when the menu opened, to point it out inside the list.
  const [fresh, setFresh] = React.useState<Set<string>>(new Set());

  const events = registeredEvents(data);
  const unseen = events.filter((event) => !seen.has(eventKey(event)));

  const open = (button: HTMLElement) => {
    setFresh(new Set(unseen.map(eventKey)));
    const all = new Set([...seen, ...events.map(eventKey)]);
    saveSeenEvents(all);
    setSeen(all);
    setAnchorEl(button);
  };

  return (
    <>
      <IconButton
        id="events-bell-button"
        color="inherit"
        aria-label={
          unseen.length
            ? `Eventos y cursos: ${unseen.length} nuevos`
            : "Eventos y cursos"
        }
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        aria-controls={anchorEl ? "events-bell-menu" : undefined}
        onClick={(event) => open(event.currentTarget)}
      >
        <Badge badgeContent={unseen.length} color="error" max={9}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="events-bell-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ list: { "aria-labelledby": "events-bell-button" } }}
      >
        {events.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2">
              Aún no estás inscrito a ningún evento o curso.
            </Typography>
          </MenuItem>
        )}
        {events.map((event) => (
          <MenuItem
            key={eventKey(event)}
            component={NextLink}
            href={sharedEventPath(event.slug ?? "")}
            onClick={() => setAnchorEl(null)}
          >
            <ListItemText
              primary={event.title}
              secondary={[
                event.isACourse ? "Curso" : "Evento",
                event.start
                  ? format(event.start, "d 'de' MMMM yyyy", { locale: es })
                  : undefined,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            {fresh.has(eventKey(event)) && (
              <Chip size="small" color="error" label="Nuevo" sx={{ ml: 2 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
