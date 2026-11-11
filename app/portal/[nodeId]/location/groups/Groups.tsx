"use client";

import {
  Box,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import SearchIcon from "@mui/icons-material/Search";
import React from "react";
import { withOutSorting } from "@/app/(components)/helpers/withOutSorting";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DEBOUNCE_WAIT_MS } from "@/app/(components)/helpers/debouncing";
import { searchQueryFor } from "../../person/searchQuery";
import {
  deleteOrganizationsById,
  useGetOrganizationsByIdChilds,
} from "@/app/(api)/generated";
import type { OrganizationResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { nodeTypeLabels } from "@/app/portal/organizationTree";
import DeleteIcon from "@mui/icons-material/Delete";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { pink } from "@mui/material/colors";
import { RButton } from "@/app/(components)/RButton";
import { childrenLabels } from "./childrenLabels";
import { filterByName } from "./filterByName";

type GroupsProps = {
  nodeId: string;
  // A church lists its locations; any other node its groups and ministries.
  isChurch?: boolean;
  // Inside a group or ministry they are simply "grupos".
  insideGroup?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
};

// Children of a node. Opening a child makes it the current node, so groups
// and ministries can nest as deep as the church needs.
export function Groups({
  nodeId,
  isChurch = false,
  insideGroup = false,
  canCreate = false,
  canDelete = false,
}: GroupsProps) {
  const [groupToDeleteId, setGroupToDeleteId] = React.useState<string | null>(
    null,
  );
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
    isLoading,
    mutate,
  } = useGetOrganizationsByIdChilds(nodeId);
  const alert = React.useContext(SnackbarContext);

  const deleteGroup = async (id: string | null) => {
    if (!id) return;
    await deleteOrganizationsById(id);
    setGroupToDeleteId(null);
    alert.showMessage("Eliminado exitosamente");
    mutate();
  };

  const columns = React.useMemo(
    () =>
      (
        [
          { field: "name", headerName: "Nombre", flex: 2, minWidth: 130 },
          {
            field: "type",
            headerName: "Tipo",
            flex: 1,
            minWidth: 110,
            valueGetter: (value) => nodeTypeLabels[value ?? ""] ?? "",
          },
          {
            field: "actions",
            type: "actions",
            width: 80,
            getActions: (params) => {
              const actions = [
                <Tooltip title="Abrir" key="see">
                  <GridActionsCellItem
                    label="Abrir"
                    icon={
                      <SearchIcon sx={{ "&:hover": { color: "#1976D2" } }} />
                    }
                    onClick={() =>
                      router.push(`/portal/${params.row.id}/location`)
                    }
                  />
                </Tooltip>,
              ];
              if (!canDelete || isChurch) return actions;
              return [
                ...actions,
                <Tooltip title="Eliminar" key="delete">
                  <GridActionsCellItem
                    label="Eliminar"
                    icon={
                      <DeleteIcon sx={{ "&:hover": { color: pink[500] } }} />
                    }
                    onClick={() => setGroupToDeleteId(params.row.id ?? null)}
                  />
                </Tooltip>,
              ];
            },
          },
        ] as GridColDef<OrganizationResponse>[]
      ).map(withOutSorting),
    [router, canDelete, isChurch],
  );

  return (
    <Stack direction="column" spacing={2}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6">
          {childrenLabels(isChurch, insideGroup).title}
        </Typography>
        <Box sx={{ display: "flex", width: { xs: "100%", sm: "auto" } }}>
          {canCreate && (
            <RButton
              name={childrenLabels(isChurch, insideGroup).create}
              href={`/portal/${nodeId}/location/${isChurch ? "new" : "groups/create"}`}
            />
          )}
          <TextField
            sx={{ minWidth: 0 }}
            placeholder="Buscar"
            variant="outlined"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
              htmlInput: {
                "aria-label": "Buscar por nombre",
                style: { padding: "12px 10px 12px 10px" },
              },
            }}
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Box>
      </Box>
      <div style={{ width: "100%", height: "70vh" }}>
        <DataGrid
          sx={{
            "& .MuiDataGrid-columnHeaders": {
              borderBottom: "1px solid #dbdbdb !important",
              borderRadius: 0,
            },
            "& .MuiDataGrid-row": {
              borderBottom: "1px solid #efefef",

              "&:hover": {
                background: "#fafafa",
              },
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: "700",
              color: "#8e8e8e",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              letterSpacing: "0.5px",
            },

            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
            },
          }}
          loading={isLoading}
          columns={columns}
          rows={filterByName(groups ?? [], searchDebounced)}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
      </div>
      <DialogDeleteConfirmation
        open={groupToDeleteId !== null}
        close={() => setGroupToDeleteId(null)}
        onDelete={() => deleteGroup(groupToDeleteId)}
      />
    </Stack>
  );
}
