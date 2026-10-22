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
import type { OrganizationResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { GroupTypeLabels } from "./Group";
import DeleteIcon from "@mui/icons-material/Delete";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { pink } from "@mui/material/colors";
import { RButton } from "@/app/(components)/RButton";

type GroupsProps = {
  locId: string;
};

export function Groups({ locId }: GroupsProps) {
  const [groupToDeleteId, setGroupToDeleteId] = React.useState<string | null>(
    null,
  );
  const router = useRouter();

  const {
    data: groups,
    isLoading,
    mutate,
  } = useGetOrganizationsByIdChilds(locId);
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
            valueGetter: (value) =>
              value === "GROUP"
                ? GroupTypeLabels.GROUP
                : GroupTypeLabels.MINISTRY,
          },
          {
            field: "actions",
            type: "actions",
            width: 80,
            getActions: (params) => {
              return [
                <Tooltip title="Ver / editar" key="see">
                  <GridActionsCellItem
                    label="Ver"
                    icon={
                      <SearchIcon sx={{ "&:hover": { color: "#1976D2" } }} />
                    }
                    onClick={() =>
                      router.push(`location/groups/${params.row.id}`)
                    }
                  />
                </Tooltip>,
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
    [router],
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
          <Typography variant="h6">Grupos y Ministerios</Typography>
          <RButton
            name="Registrar"
            href={`location/groups/create`}
            padding="10px 40px"
          />
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
