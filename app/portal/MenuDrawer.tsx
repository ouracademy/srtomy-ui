"use client";

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
import { useGetMeOrganizations } from "@/app/(api)/generated";
import { OrganizationPicker } from "./OrganizationPicker";
import { pathTo, withIds } from "./organizationTree";
import { UserMenu } from "./UserMenu";

const drawerWidth = 240;

// The menu items are white, so both drawers need the dark paper. The
// temporary (mobile) drawer does not inherit the background of the permanent one.
const drawerPaperSx = {
  boxSizing: "border-box",
  width: drawerWidth,
  background: "#2a2b36",
  color: "#fff",
};

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "center",
}));

// Layout of the portal: top bar (breadcrumb of the current node that opens the
// node picker, user menu), side menu (`listDrawer`) and the page content.
export default function MenuDrawer({
  children,
  listDrawer,
  nodeId,
}: React.PropsWithChildren<{
  listDrawer?: React.ReactNode;
  nodeId?: string;
}>) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openPicker, setOpenPicker] = React.useState(false);

  const { data } = useGetMeOrganizations();
  const nodes = withIds(data);
  const path = nodeId ? pathTo(nodes, nodeId) : [];
  const church = path[0];

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
                onClick={() => setOpenPicker(true)}
                aria-label={
                  path.length
                    ? `Cambiar de iglesia, sede o grupo. Actual: ${path.map((node) => node.name).join(" / ")}`
                    : "Seleccione iglesia o sede"
                }
              >
                {path.length
                  ? path
                      .slice(-2)
                      .map((node) => node.name)
                      .join(" › ")
                  : "Seleccione iglesia o sede"}
              </Button>
            </Stack>
            <UserMenu nodeId={nodeId} />
            <OrganizationPicker
              open={openPicker}
              onClose={() => setOpenPicker(false)}
              nodes={nodes}
              currentId={nodeId}
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
            "& .MuiDrawer-paper": drawerPaperSx,
          }}
        >
          {listDrawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": drawerPaperSx,
          }}
          open
        >
          <DrawerHeader sx={{ background: "#2a2b36", color: "#fff" }}>
            {church?.name}
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
          minWidth: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
