"use client";

import { useAuth0 } from "@auth0/auth0-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import NextLink from "next/link";
import * as React from "react";
import { useGetOrganizationsByIdChilds } from "@/app/(api)/generated";
import type { OrganizationResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { withOutSorting } from "../(components)/helpers/withOutSorting";

type LocationsDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

// Lists the locations (sedes) of the user's church so they can switch.
export const LocationsDialog = ({ open, onClose }: LocationsDialogProps) => {
  const { user } = useAuth0();

  const orgId = user?.["https://sr-tommy.com/orgId"];

  const { data: accounts, isLoading } = useGetOrganizationsByIdChilds(
    orgId ?? "",
    { swr: { enabled: !!user && !!orgId } },
  );

  const columns = React.useMemo(
    () =>
      (
        [
          {
            field: "name",
            headerName: "Nombre",
            renderCell: ({ row }) => (
              <Link
                component={NextLink}
                href={`/portal/${row.id}`}
                sx={{ textDecoration: "none" }}
              >
                {row.name}
              </Link>
            ),
            flex: 1,
          },
        ] as GridColDef<OrganizationResponse>[]
      ).map(withOutSorting),
    [],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "30px",
        },
      }}
    >
      <DialogTitle
        display="flex"
        justifyContent="space-between"
        sx={{ fontSize: { xs: "16px", sm: "20px" } }}
      >
        Seleccione sede
        <Button
          component={NextLink}
          href="/portal/location/create"
          onClick={onClose}
          sx={{ fontSize: { xs: "12px", sm: "14px" } }}
        >
          Registrar otra sede
        </Button>
      </DialogTitle>
      <DialogContent>
        <div style={{ width: "100%", height: "70vh" }}>
          <DataGrid
            loading={isLoading}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                borderBottom: "1px solid  #dbdbdb !important",
                borderRadius: 0,
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: "700",
                color: "#8e8e8e",
                textTransform: "uppercase",
              },
              "& .MuiDataGrid-row": {
                borderBottom: "1px solid #efefef",
                "&: hover": {
                  backgroundColor: "#fafafa",
                },
              },
              ".MuiDataGrid-cell:focus": { outline: "none" },
            }}
            columns={columns}
            hideFooter={true}
            rows={accounts || []}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
