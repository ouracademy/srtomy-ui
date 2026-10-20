"use client";

import ChurchOutlinedIcon from "@mui/icons-material/ChurchOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import NextLink from "next/link";
import * as React from "react";
import MenuDrawer from "../MenuDrawer";
import { useOrganization } from "@/app/(api)/services/organizations";

const menuItems = [
  { label: "Dashboard", path: "", Icon: DashboardOutlinedIcon },
  { label: "Sede", path: "/location", Icon: ChurchOutlinedIcon },
  { label: "Personas", path: "/person", Icon: PersonOutlinedIcon },
  { label: "Eventos y cursos", path: "/event", Icon: EventOutlinedIcon },
];

export default function LocLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locId: string }>;
}) {
  const children = props.children;
  const params = React.use(props.params);
  const locId = Number(params.locId);

  const { data: location } = useOrganization(locId);

  return (
    <MenuDrawer
      location={location}
      locId={locId}
      listDrawer={
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
          {menuItems.map(({ label, path, Icon }) => (
            <ListItem key={label} disablePadding>
              <ListItemButton
                component={NextLink}
                href={`/portal/${locId}${path}`}
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
      }
    >
      {children}
    </MenuDrawer>
  );
}
