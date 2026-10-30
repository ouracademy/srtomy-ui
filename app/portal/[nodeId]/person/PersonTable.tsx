"use client";
import React from "react";
import { Box, Chip, Stack, Tooltip } from "@mui/material";
import {
  DataGrid,
  DataGridProps,
  GridActionsCellItem,
  GridColDef,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import SearchIcon from "@mui/icons-material/Search";
import { withOutSorting } from "@/app/(components)/helpers/withOutSorting";
import { usePagination } from "@/app/(components)/hook-customization/usePagination";
import { useGetOrganizationsById, useGetPeople } from "@/app/(api)/generated";
import type { PersonResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { useRouter, useSearchParams } from "next/navigation";
import {
  memberStateFromParam,
  memberStateLabels,
} from "@/app/(components)/memberState";
import { STATE_PARAM } from "./PeopleLayout";
import DeleteIcon from "@mui/icons-material/Delete";
import { pink } from "@mui/material/colors";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { DeletePersonDialog, type PersonToDelete } from "./DeletePersonDialog";

// Visitors and attendees are outlined: they are on the way to being members.
const stateColors = {
  VISITOR: "default",
  MEMBERSHIP_IN_PROGRESS: "info",
  MEMBER: "success",
} as const;

export type MyDataGridProps = Omit<DataGridProps, "columns" | "rows">;

export type PersonTableProps = {
  dataGridProps?: MyDataGridProps;
  nodeId: string;
};

export const PersonTable = ({
  dataGridProps = {},
  nodeId,
}: PersonTableProps) => {
  const { paginationModel, setPaginationModel } = usePagination();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get("search") || "";
  const stateFilter = memberStateFromParam(searchParams.get(STATE_PARAM));

  // A new filter or search starts again from the first page.
  React.useEffect(() => {
    setPaginationModel((model) => ({ ...model, page: 0 }));
  }, [stateFilter, searchParamQuery, setPaginationModel]);

  const [personToDelete, setPersonToDelete] =
    React.useState<PersonToDelete | null>(null);
  const { can } = usePermissions(nodeId);
  const canDelete = can("members.delete");
  const { data: node } = useGetOrganizationsById(nodeId);
  const {
    data: people,
    isLoading,
    mutate,
  } = useGetPeople({
    organizationId: nodeId,
    page: paginationModel.page,
    size: paginationModel.pageSize,
    searchText: searchParamQuery,
    memberState: stateFilter,
  });

  const columns = React.useMemo(
    () =>
      (
        [
          { field: "fullName", headerName: "Nombre", flex: 1 },
          {
            field: "memberState",
            headerName: "Estado",
            width: 200,
            renderCell: ({ row }) =>
              row.memberState ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", height: "100%" }}
                >
                  <Chip
                    size="small"
                    label={memberStateLabels[row.memberState]}
                    color={stateColors[row.memberState]}
                    variant={
                      row.memberState === "MEMBER" ? "filled" : "outlined"
                    }
                  />
                </Stack>
              ) : null,
          },
          {
            field: "actions",
            type: "actions",
            width: 80,
            getActions: (params) => {
              const actions = [
                <Tooltip title="Ver" key="see">
                  <GridActionsCellItem
                    icon={
                      <SearchIcon sx={{ "&:hover": { color: "#1976D2" } }} />
                    }
                    label="Ver"
                    onClick={() =>
                      router.push(`/portal/${nodeId}/person/${params.id}`)
                    }
                  />
                </Tooltip>,
              ];
              if (canDelete) {
                actions.push(
                  <Tooltip title="Eliminar" key="delete">
                    <GridActionsCellItem
                      icon={
                        <DeleteIcon sx={{ "&:hover": { color: pink[500] } }} />
                      }
                      label="Eliminar"
                      onClick={() =>
                        setPersonToDelete({
                          id: String(params.id),
                          name: params.row.fullName ?? "Esta persona",
                        })
                      }
                    />
                  </Tooltip>,
                );
              }
              return actions;
            },
          },
        ] as GridColDef<PersonResponse>[]
      ).map(withOutSorting),
    [router, nodeId, canDelete],
  );

  return (
    <>
      <Box
        sx={{
          height: "70vh",
          width: "100%",
        }}
      >
        <DataGrid
          loading={isLoading}
          columns={columns}
          sx={{
            "& .MuiDataGrid-columnHeaders": {
              borderBottom: "1px solid #dbdbdb !important",
              borderRadius: 0,
            },

            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: "700", // Texto en negrita
              color: "#8e8e8e", // Color gris suave de IG
              textTransform: "uppercase",
              fontSize: "0.8rem",
              letterSpacing: "0.5px",
            },
            //2. Estilo de filas y celdas
            "& .MuiDataGrid-row": {
              borderBottom: "1px solid #efefef",
              "&: hover": {
                backgroundColor: "#fafafa",
              },
            },
            //3. Quitar elementos
            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },

            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            //FOOTER
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
            },
          }}
          paginationModel={paginationModel}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          disableColumnFilter
          rows={people?.content || []}
          rowCount={people?.totalElements || 0}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          {...dataGridProps}
        />
      </Box>
      <DeletePersonDialog
        key={personToDelete?.id}
        person={personToDelete}
        nodeId={nodeId}
        nodeType={node?.type}
        close={() => setPersonToDelete(null)}
        onDeleted={() => mutate()}
      />
    </>
  );
};

export const fullName = (person: PersonResponse) => {
  return person.firstName + " " + person.lastName;
};
