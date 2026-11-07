"use client";

import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { groupByDay } from "@/app/(components)/groupByDay";
import { describeRegistrationMode } from "@/app/(components)/registrationMode";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import NextLink from "next/link";
import { hoursLabel } from "./eventSummary";

type ProgramListProps = Readonly<{
  nodeId: string;
  sessions: ChildResponse[];
  // Whoever may edit and delete sessions (`events.write`).
  canEdit: boolean;
  onRemove: (session: ChildResponse) => void;
}>;

// The program as a list by day: the same sessions as the calendar, for whoever
// reads better a list than a grid (a phone, a screen reader, the keyboard).
export const ProgramList = ({
  nodeId,
  sessions,
  canEdit,
  onRemove,
}: ProgramListProps) => (
  <Stack spacing={2}>
    {groupByDay(sessions).map(({ day, items }) => (
      <div key={day.toISOString()}>
        <Typography variant="subtitle2" sx={{ textTransform: "capitalize" }}>
          {format(day, "EEEE d 'de' MMMM", { locale: es })}
        </Typography>
        <List dense disablePadding>
          {items.map((item) => (
            <ListItem
              key={item.id}
              disablePadding
              secondaryAction={
                canEdit && (
                  <Stack direction="row">
                    <Tooltip title="Editar">
                      <IconButton
                        component={NextLink}
                        href={`/portal/${nodeId}/event/${item.id}/attendance`}
                        aria-label={`Editar ${item.title}`}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        aria-label={`Eliminar ${item.title}`}
                        onClick={() => onRemove(item)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )
              }
            >
              <ListItemButton
                sx={{ pr: canEdit ? 14 : undefined }}
                component={NextLink}
                href={`/portal/${nodeId}/event/${item.id}/attendance`}
              >
                <ListItemText
                  primary={item.title}
                  secondary={hoursLabel(item.start, item.end)}
                />
                <Stack direction="row" spacing={1}>
                  {item.track && (
                    <Chip size="small" color="primary" label={item.track} />
                  )}
                  <Chip
                    size="small"
                    variant="outlined"
                    label={item.isACourse ? "Curso" : "Evento"}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={
                      describeRegistrationMode(item.registrationMode)?.summary
                    }
                  />
                </Stack>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
    ))}
  </Stack>
);
