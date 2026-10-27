"use client";

import { Stack, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import SearchIcon from "@mui/icons-material/Search";
import React from "react";
import { withOutSorting } from "@/app/(components)/helpers/withOutSorting";
import { useRouter } from "next/navigation";
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
          { field: "name", headerName: "Nombre", flex: 1 },
          {
            field: "type",
            headerName: "Tipo",
            flex: 1,
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
    <Stack direction="column" spacing={2} p={4}>
      <Stack direction="row" spacing={2} alignItems="center">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Typography variant="h6">
            {childrenLabels(isChurch, insideGroup).title}
          </Typography>
          {canCreate && (
            <RButton
              name={childrenLabels(isChurch, insideGroup).create}
              href={`/portal/${nodeId}/location/${isChurch ? "new" : "groups/create"}`}
              padding="10px 40px"
            />
          )}
        </div>
      </Stack>
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
          rows={groups || []}
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
