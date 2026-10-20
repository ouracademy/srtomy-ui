"use client";
import React from "react";
import { Box, Tooltip } from "@mui/material";
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
import { usePeople } from "@/app/(api)/services/people";
// import { useDebounce } from "use-debounce";
// import { DEBOUNCE_WAIT_MS } from "@/app/(components)/helpers/debouncing";
// import { useRouter } from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import type { PersonListItem } from "@/app/(api)/types";
// import { PersonDetailWithId } from "./Person";
import type { PersonResponse } from "@/app/(api)/person";
import DeleteIcon from "@mui/icons-material/Delete";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { pink } from "@mui/material/colors";

export type MyDataGridProps = Omit<DataGridProps, "columns" | "rows">;

export type PersonTableProps = {
  dataGridProps?: MyDataGridProps;
  locId: number;
};

export const PersonTable = ({
  dataGridProps = {},
  locId,
}: PersonTableProps) => {
  const { paginationModel, setPaginationModel } = usePagination();
  const router = useRouter();
  // const [searchText, setSearchText] = useState("");
  // const [searchTextDebounced] = useDebounce(searchText, DEBOUNCE_WAIT_MS);
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get("search") || "";

  const [openDialog, setOpenDialog] = React.useState(false);
  const { data: people, isLoading } = usePeople<PersonListItem>({
    organizationId: locId,
    page: paginationModel.page,
    size: paginationModel.pageSize,
    searchText: searchParamQuery,
  });

  const columns = React.useMemo(
    () =>
      (
        [
          { field: "fullName", headerName: "Nombre", flex: 1 },
          {
            field: "actions",
            type: "actions",
            width: 80,
            getActions: (params) => {
              return [
                <Tooltip title="Ver" key="see">
                  <GridActionsCellItem
                    icon={
                      <SearchIcon sx={{ "&:hover": { color: "#1976D2" } }} />
                    }
                    label="Ver"
                    onClick={() =>
                      router.push(`/portal/${locId}/person/${params.id}`)
                    }
                  />
                </Tooltip>,
                <Tooltip title="Eliminar" key="delete">
                  <GridActionsCellItem
                    icon={
                      <DeleteIcon sx={{ "&:hover": { color: pink[500] } }} />
                    }
                    label="Eliminar"
                    onClick={() => setOpenDialog(true)}
                  />
                </Tooltip>,
              ];
            },
          },
        ] as GridColDef<PersonListItem>[]
      ).map(withOutSorting),
    [router, locId],
  );

  return (
    <>
      {/* <TextField
        placeholder="Buscar"
        variant="outlined"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }
        }}
        fullWidth
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      /> */}

      <Box
        sx={{
          // height: "70vw",
          height: "70vh",
          width: "100%",
          // width: {
          //   //xs: "50vh",
          //   xs: "99%",
          //   sm: "100%",
          //   // sm: "100%",
          // },
        }}
      >
        <DataGrid
          loading={isLoading}
          columns={columns}
          // rowHeight={65}
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
      <DialogDeleteConfirmation
        open={openDialog}
        close={() => setOpenDialog(false)}
        // Deleting people is not implemented yet: the API client has no endpoint for it.
        onDelete={() => undefined}
      />
    </>
  );
};

export const fullName = (person: PersonResponse) => {
  return person.firstName + " " + person.lastName;
};
