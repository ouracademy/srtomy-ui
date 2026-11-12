"use client";

import { useAuth0 } from "@auth0/auth0-react";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  Button,
  ListItemIcon,
  Menu,
  MenuItem,
} from "@mui/material";
import { useRouter } from "next/navigation";
import * as React from "react";
import { initialsOf } from "./[nodeId]/person/PersonHeader";

type UserMenuProps = Readonly<{
  nodeId?: string;
}>;

// Name of the signed-in user with a menu to open the profile or log out.
export const UserMenu = ({ nodeId }: UserMenuProps) => {
  const { user, logout } = useAuth0();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const close = () => setAnchorEl(null);
  // const initial = user?.name?.trim().charAt(0).toUpperCase();

  const initials = initialsOf(
    user?.given_name ?? user?.name ?? "",
    user?.family_name ?? "",
  );

  return (
    <>
      <Button
        id="user-menu-button"
        sx={{
          fontSize: { xs: "10px", sm: "12px" },
          gap: 1,
          textTransform: "none",
        }}
        variant="text"
        color="inherit"
        // startIcon={<AccountCircle />}
        aria-label={user?.name}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        aria-controls={anchorEl ? "user-menu" : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {/* On phones only the initial fits next to the icon. */}
        <Avatar
          aria-hidden="true"
          sx={{
            width: 32,
            height: 32,
            fontSize: 14,
            fontWeight: 700,
            bgcolor: "primary.light",
            color: "primary.contrastText",
          }}
        >
          {initials || undefined}
        </Avatar>
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          {user?.name}
        </Box>
        {/* <Box
          component="span"
          aria-hidden="true"
          sx={{ display: { xs: "inline", sm: "none" } }}
        >
          {initial}
        </Box> */}
      </Button>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        slotProps={{ list: { "aria-labelledby": "user-menu-button" } }}
      >
        <MenuItem
          onClick={() =>
            router.push(
              nodeId ? `/portal/${nodeId}/profile` : "/portal/profile",
            )
          }
        >
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          Perfil
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            logout({ logoutParams: { returnTo: window.location.origin } });
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </>
  );
};
