"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useGetPeople } from "@/app/(api)/generated";
import type {
  Mark,
  MarkSource,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import Loading from "@/app/(components)/Loading";

type AttendanceListProps = Readonly<{
  nodeId: string;
  // Who is marked, how and when.
  marks: readonly Mark[];
  // Whoever takes attendance can mark and unmark people.
  canTake: boolean;
  // Saves the whole list of people present.
  onSave: (personIds: string[]) => Promise<void>;
}>;

const howTheyCame: Record<
  MarkSource,
  { label: string; bg: string; fg: string }
> = {
  MANUAL: { label: "En la lista", bg: "#DBEAFE", fg: "#1E3A8A" },
  QR_EVENT: { label: "Con el QR", bg: "#DBEAFE", fg: "#1E3A8A" },
  QR_TICKET: { label: "Con ticket", bg: "#EDE9FE", fg: "#4C1D95" },
};
const notYet = { label: "Aún no", bg: "#F1F5F9", fg: "#334155" };

const timeOf = (value?: Date) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin hora";

const pageSize = 10;

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
} as const;

// Who is in the church and who of them already came: their name, how they came
// in and when, with a button to mark them or take them out. Searching finds
// anyone by name.
export const AttendanceList = ({
  nodeId,
  marks,
  canTake,
  onSave,
}: AttendanceListProps) => {
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);

  // Wait for the user to stop typing before asking the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(typed.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [typed]);

  const { data: people, isLoading } = useGetPeople({
    organizationId: nodeId,
    searchText: search,
    page,
    size: pageSize,
  });
  const marked = new Map(marks.map((mark) => [mark.personId, mark]));

  const toggle = async (personId: string) => {
    const ids = new Set(marks.map((mark) => mark.personId ?? ""));
    if (ids.has(personId)) ids.delete(personId);
    else ids.add(personId);
    setSaving(personId);
    try {
      await onSave([...ids]);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label="Lista de asistencia"
      sx={{ p: 3, borderRadius: 5 }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          useFlexGap
          spacing={1.5}
          sx={{
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 700,
            }}
          >
            Lista de asistencia
          </Typography>
          <TextField
            size="small"
            placeholder="Buscar persona"
            value={typed}
            onChange={(change) => setTyped(change.target.value)}
            slotProps={{
              htmlInput: { "aria-label": "Buscar persona" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: 240 }}
          />
        </Stack>
        {isLoading ? (
          <Loading />
        ) : (
          <TableContainer>
            <Table size="medium" sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Cómo entró</TableCell>
                  <TableCell>Hora</TableCell>
                  <TableCell align="right" sx={{ position: "relative"}}>
                    <Box component="span" sx={visuallyHidden}>
                      Acciones
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(people?.content ?? []).map((person) => {
                  const mark = marked.get(person.id);
                  const how = mark?.source ? howTheyCame[mark.source] : notYet;
                  return (
                    <TableRow key={person.id}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {person.fullName}
                      </TableCell>
                      <TableCell>
                        <Typography
                          component="span"
                          sx={{
                            bgcolor: mark ? how.bg : notYet.bg,
                            color: mark ? how.fg : notYet.fg,
                            borderRadius: 999,
                            px: 1.25,
                            py: 0.375,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {mark ? how.label : notYet.label}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>
                        {mark ? timeOf(mark.markedAt) : "Sin hora"}
                      </TableCell>
                      <TableCell align="right">
                        {canTake && person.id && (
                          <LoadingButton
                            size="small"
                            variant={mark ? "outlined" : "contained"}
                            sx={mark ? undefined : primaryButtonSx}
                            loading={saving === person.id}
                            disabled={saving !== null}
                            aria-label={`${mark ? "Quitar" : "Marcar ingreso de"} ${person.fullName}`}
                            onClick={() => void toggle(person.id ?? "")}
                          >
                            {mark ? "Quitar" : "Marcar ingreso"}
                          </LoadingButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {people?.content?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {search
                        ? "No hay nadie con ese nombre."
                        : "Aún no hay personas."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={people?.totalElements ?? 0}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[pageSize]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
        />
      </Stack>
    </Paper>
  );
};
