"use client";

import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { groupByDay } from "@/app/(components)/groupByDay";
import { describeRegistrationMode } from "@/app/(components)/registrationMode";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Chip,
  IconButton,
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
        <Typography
          variant="subtitle2"
          sx={{ textTransform: "capitalize", mb: 0.5 }}
        >
          {format(day, "EEEE d 'de' MMMM", { locale: es })}
        </Typography>
        <Stack component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {items.map((item) => (
            <Stack
              component="li"
              key={item.id}
              direction="row"
              sx={{
                alignItems: "center",
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <ListItemButton
                component={NextLink}
                href={`/portal/${nodeId}/event/${item.id}/attendance`}
                sx={{ flex: 1, minWidth: 0, flexWrap: "wrap", gap: 1 }}
              >
                <ListItemText
                  sx={{ flex: "1 1 220px", minWidth: 0 }}
                  primary={item.title}
                  secondary={hoursLabel(item.start, item.end)}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{
                    flexWrap: "wrap",
                  }}
                >
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
              {canEdit && (
                <Stack direction="row" sx={{ pr: 0.5, flexShrink: 0 }}>
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
              )}
            </Stack>
          ))}
        </Stack>
      </div>
    ))}
  </Stack>
);
