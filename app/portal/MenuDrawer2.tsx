"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { AccountCircle } from "@mui/icons-material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Toolbar from "@mui/material/Toolbar";
import { styled } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import type { LocationListItem } from "../(api)/types";
import { useLocations, useOrganization } from "../(api)/services/organizations";
import Loading from "../(components)/Loading";
import { withOutSorting } from "../(components)/helpers/withOutSorting";

const drawerWidth = 240;

export default function MenuDrawer2({
  children,
  listDrawer,
  location,
  locId,
}: React.PropsWithChildren<{
  listDrawer?: React.ReactNode;
  location?: { name: string };
  locId?: number;
}>) {
  const { user, isLoading } = useAuth0();
  const { logout } = useAuth0();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [openDialog, setOpenDialog] = React.useState(false);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const orgId = user?.["https://sr-tommy.com/orgId"];

  const { data: organization } = useOrganization(orgId);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // const handleProfile = () => {
  //   router.push("/profile");
  //   setAnchorEl(null);
  // };

  const onClose = () => {
    setOpenDialog(false);
  };

  const handleLogOut = () => {
    setAnchorEl(null);
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: "center",
  }));

  const router = useRouter();

  if (isLoading) return <Loading />;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: "#fff",
          color: "#000",
          // boxShadow: "none",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                sx={{
                  fontSize: {
                    xs: "10px",
                    sm: "12px",
                  },
                }}
                variant="outlined"
                color="inherit"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={() => setOpenDialog(true)}
              >
                {location?.name || "Seleccione sede"}
              </Button>
            </Stack>
            <Button
              sx={{
                fontSize: {
                  xs: "10px",
                  sm: "12px",
                },
              }}
              variant="text"
              color="inherit"
              startIcon={<AccountCircle />}
              onClick={handleClick}
            >
              {user?.name}
            </Button>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              slotProps={{
                list: {
                  "aria-labelledby": "basic-button",
                },
              }}
              // MenuListProps={{
              //   "aria-labelledby": "basic-button",
              // }}
            >
              <MenuItem
                onClick={() =>
                  locId
                    ? router.push(`/portal/${locId}/profile`)
                    : router.push(`/portal/profile`)
                }
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                Perfil
              </MenuItem>
              <MenuItem onClick={handleLogOut}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
            <LocationsDialog open={openDialog} onClose={onClose} />
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {listDrawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {/*Need to make dynamic */}
          <DrawerHeader sx={{ background: "#2a2b36", color: "#fff" }}>
            {organization?.name}
          </DrawerHeader>
          <Divider />
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: "#2a2b36",
            }}
          >
            <div>{listDrawer}</div>
            <div>
              <p
                style={{ fontSize: "10px", paddingLeft: "30px", color: "#fff" }}
              >
                &copy;Sr Tommy all right reserved
              </p>
            </div>
          </Box>
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

type DialogLocationProps = {
  open: boolean;
  onClose: () => void;
};

const LocationsDialog = ({ open, onClose }: DialogLocationProps) => {
  const { user } = useAuth0();

  const orgId = user?.["https://sr-tommy.com/orgId"];

  const { data: accounts, isLoading } = useLocations(user ? orgId : undefined);

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
        ] as GridColDef<LocationListItem>[]
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
        <Link component={NextLink} href="/portal/location/create">
          <Button
            onClick={onClose}
            sx={{ fontSize: { xs: "12px", sm: "14px" } }}
          >
            Registrar otra sede
          </Button>
        </Link>
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
