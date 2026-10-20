"use client";

import { useAuth0 } from "@auth0/auth0-react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuIcon from "@mui/icons-material/Menu";
import { Button, Stack } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import { styled } from "@mui/material/styles";
import * as React from "react";
import { useOrganization } from "../(api)/services/organizations";
import Loading from "../(components)/Loading";
import { LocationsDialog } from "./LocationsDialog";
import { UserMenu } from "./UserMenu";

const drawerWidth = 240;

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "center",
}));

// Layout of the portal: top bar (location switcher, user menu), side menu
// (`listDrawer`) and the page content (`children`).
export default function MenuDrawer({
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
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openLocations, setOpenLocations] = React.useState(false);

  const orgId = user?.["https://sr-tommy.com/orgId"];
  const { data: organization } = useOrganization(orgId);

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
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Abrir menú"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
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
                sx={{ fontSize: { xs: "10px", sm: "12px" } }}
                variant="outlined"
                color="inherit"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={() => setOpenLocations(true)}
              >
                {location?.name || "Seleccione sede"}
              </Button>
            </Stack>
            <UserMenu locId={locId} />
            <LocationsDialog
              open={openLocations}
              onClose={() => setOpenLocations(false)}
            />
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="Navegación"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
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
