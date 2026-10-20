"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { AccountCircle } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { Button, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { useRouter } from "next/navigation";
import * as React from "react";

type UserMenuProps = Readonly<{
  locId?: number;
}>;

// Name of the signed-in user with a menu to open the profile or log out.
export const UserMenu = ({ locId }: UserMenuProps) => {
  const { user, logout } = useAuth0();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const close = () => setAnchorEl(null);

  return (
    <>
      <Button
        id="user-menu-button"
        sx={{ fontSize: { xs: "10px", sm: "12px" } }}
        variant="text"
        color="inherit"
        startIcon={<AccountCircle />}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        aria-controls={anchorEl ? "user-menu" : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {user?.name}
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
            router.push(locId ? `/portal/${locId}/profile` : "/portal/profile")
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
