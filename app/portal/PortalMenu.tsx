"use client";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import type { SvgIconComponent } from "@mui/icons-material";
import NextLink from "next/link";

export type PortalMenuItem = Readonly<{
  label: string;
  href: string;
  Icon: SvgIconComponent;
}>;

// The white-on-dark list of the side menu, shared by every portal screen that
// has a menu (a node, "Mi espacio").
export const PortalMenu = ({
  items,
}: Readonly<{ items: PortalMenuItem[] }>) => (
  <List
    aria-label="Menú principal"
    sx={{
      "& .MuiListItemIcon-root": {
        minWidth: "40px",
        color: "#fff",
        fontSize: "50px",
      },
      color: "#fff",
      fontSize: "50px",

      "& .MuiListItemText-primary": {
        fontSize: "0.9rem",
        fontWeight: "200",
      },
    }}
  >
    {items.map(({ label, href, Icon }) => (
      <ListItem key={label} disablePadding>
        <ListItemButton
          component={NextLink}
          href={href}
          sx={{ color: "inherit", textDecoration: "none" }}
        >
          <ListItemIcon>
            <Icon />
          </ListItemIcon>
          <ListItemText primary={label} />
        </ListItemButton>
      </ListItem>
    ))}
  </List>
);
