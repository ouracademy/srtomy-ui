"use client";

import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ChurchOutlinedIcon from "@mui/icons-material/ChurchOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import NextLink from "next/link";
import * as React from "react";
import MenuDrawer from "../MenuDrawer";
import { useGetOrganizationsById } from "@/app/(api)/generated";
import { usePermissions, type Permission } from "@/app/(hooks)/usePermissions";
import { saveLastNode } from "../lastNode";
import { nodeTypeLabels } from "../organizationTree";

// `needs` hides an item the user could not use on this node; the API still
// rejects the requests if they navigate there anyway.
const menuItems = (type: string | undefined) => [
  { label: "Dashboard", path: "", Icon: DashboardOutlinedIcon },
  {
    label: nodeTypeLabels[type ?? ""] ?? "Datos",
    path: "/location",
    Icon: ChurchOutlinedIcon,
  },
  {
    label: "Personas",
    path: "/person",
    Icon: PersonOutlinedIcon,
    needs: "members.read" as Permission,
  },
  {
    label: "Eventos y cursos",
    path: "/event",
    Icon: EventOutlinedIcon,
    needs: "events.read" as Permission,
  },
  { label: "Cargos y accesos", path: "/positions", Icon: BadgeOutlinedIcon },
  { label: "Directorio", path: "/directory", Icon: ContactsOutlinedIcon },
];

export default function NodeLayout(props: {
  children: React.ReactNode;
  params: Promise<{ nodeId: string }>;
}) {
  const children = props.children;
  const params = React.use(props.params);
  const nodeId = params.nodeId;

  const { data: node } = useGetOrganizationsById(nodeId);
  const { can } = usePermissions(nodeId);

  React.useEffect(() => saveLastNode(nodeId), [nodeId]);

  const items = menuItems(node?.type).filter(
    (item) => !item.needs || can(item.needs),
  );

  return (
    <MenuDrawer
      nodeId={nodeId}
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
          {items.map(({ label, path, Icon }) => (
            <ListItem key={label} disablePadding>
              <ListItemButton
                component={NextLink}
                href={`/portal/${nodeId}${path}`}
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
