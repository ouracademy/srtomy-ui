"use client";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  List,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useDebounce } from "use-debounce";
import {
  deleteOrganizationsById,
  useGetOrganizationsByIdChilds,
} from "@/app/(api)/generated";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { DEBOUNCE_WAIT_MS } from "@/app/(components)/helpers/debouncing";
import { searchQueryFor } from "../../person/searchQuery";
import { childrenLabels } from "./childrenLabels";
import { filterByName } from "./filterByName";
import { GroupRow, type GroupToDelete } from "./GroupRow";

type GroupsProps = {
  nodeId: string;
  // A church lists its locations; any other node its groups and ministries.
  isChurch?: boolean;
  // Inside a group or ministry they are simply "grupos".
  insideGroup?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
};

type TypeFilter = "" | "GROUP" | "MINISTRY";

const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "GROUP", label: "Grupos" },
  { value: "MINISTRY", label: "Ministerios" },
];

// Children of a node. Opening a child makes it the current node, so groups
// and ministries can nest as deep as the church needs.
export function Groups({
  nodeId,
  isChurch = false,
  insideGroup = false,
  canCreate = false,
  canDelete = false,
}: GroupsProps) {
  const [groupToDelete, setGroupToDelete] =
    React.useState<GroupToDelete | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The search lives in the URL (`?search=`) so it can be copied and shared;
  // the box keeps the text being typed and the URL follows after a pause.
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [searchDebounced] = useDebounce(search, DEBOUNCE_WAIT_MS);

  React.useEffect(() => {
    const query = searchQueryFor(searchParams.toString(), searchDebounced);
    if (query !== null) {
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  }, [searchDebounced, pathname, router, searchParams]);

  const {
    data: groups,
    error,
    isLoading,
    mutate,
  } = useGetOrganizationsByIdChilds(nodeId);
  const alert = React.useContext(SnackbarContext);
  const labels = childrenLabels(isChurch, insideGroup);
  // Groups and ministries come mixed only in a sede.
  const canFilterByType = !isChurch && !insideGroup;

  const deleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteOrganizationsById(groupToDelete.id);
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo eliminar. Intenta de nuevo."),
      );
      setGroupToDelete(null);
      return;
    }
    setGroupToDelete(null);
    alert.showMessage("Eliminado exitosamente");
    mutate();
  };

  if (isLoading && !groups) return <Loading />;
  if (!groups) return <ResourceError error={error} onRetry={() => mutate()} />;

  const matching = filterByName(groups, searchDebounced);
  const countOf = (type: TypeFilter) =>
    type
      ? matching.filter((group) => group.type === type).length
      : matching.length;
  const rows = typeFilter
    ? matching.filter((group) => group.type === typeFilter)
    : matching;
  const filtered = Boolean(searchDebounced.trim() || typeFilter);

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 760 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            {labels.title}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {labels.subtitle}
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            component={Link}
            href={`/portal/${nodeId}/location/${isChurch ? "new" : "groups/create"}`}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 999,
              px: 2.5,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {labels.create}
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 5, overflow: "hidden" }}>
        <Stack spacing={1.75} sx={{ p: 2.25, pb: 1.75 }}>
          <TextField
            hiddenLabel
            variant="filled"
            placeholder="Buscar por nombre"
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: { borderRadius: 3 },
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
              htmlInput: { "aria-label": "Buscar por nombre" },
            }}
          />
          {canFilterByType && (
            <Stack
              direction="row"
              role="group"
              aria-label="Filtrar por tipo"
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              {typeFilters.map(({ value, label }) => {
                const selected = typeFilter === value;
                return (
                  <Chip
                    key={value}
                    label={`${label} ${countOf(value)}`}
                    clickable
                    aria-pressed={selected}
                    color={selected ? "primary" : "default"}
                    variant={selected ? "filled" : "outlined"}
                    onClick={() => setTypeFilter(value)}
                  />
                );
              })}
            </Stack>
          )}
        </Stack>
        {rows.length === 0 ? (
          <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {filtered ? "No encontramos ninguno" : "Aún no hay nada aquí"}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              {filtered
                ? "Pruebe con otro nombre o quite el filtro de tipo."
                : canCreate
                  ? "Agregue el primero con el botón de arriba."
                  : "Todavía no se ha agregado ninguno."}
            </Typography>
          </Box>
        ) : (
          <>
            <List
              aria-label={labels.title}
              sx={{ px: 1, pb: 1, pt: 0, display: "grid", gap: 0.25 }}
            >
              {rows.map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  canDelete={canDelete && !isChurch}
                  onDelete={setGroupToDelete}
                />
              ))}
            </List>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                px: 2.25,
                py: 1.5,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              Mostrando {rows.length} de {groups.length}
            </Typography>
          </>
        )}
      </Paper>
      <DialogDeleteConfirmation
        open={groupToDelete !== null}
        close={() => setGroupToDelete(null)}
        onDelete={deleteGroup}
        title={`¿Eliminar ${groupToDelete?.name ?? ""}?`}
        message="Esta acción no se puede deshacer."
      />
    </Stack>
  );
}
