"use client";

import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ChurchOutlinedIcon from "@mui/icons-material/ChurchOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import * as React from "react";
import MenuDrawer from "../MenuDrawer";
import { PortalMenu } from "../PortalMenu";
import { useGetOrganizationsById } from "@/app/(api)/generated";
import { usePermissions, type Permission } from "@/app/(hooks)/usePermissions";
import { saveLastNode } from "../lastNode";
import { nodeTypeLabels } from "../organizationTree";

// `needs` hides an item unless the user holds one of those permissions on this
// node (so a plain member sees no administration); the API still rejects the
// requests if they navigate there anyway.
const menuItems = (type: string | undefined) => [
  {
    label: "Resumen",
    path: "",
    Icon: DashboardOutlinedIcon,
    needs: ["members.read"] as Permission[],
  },
  {
    label: nodeTypeLabels[type ?? ""] ?? "Datos",
    path: "/location",
    Icon: ChurchOutlinedIcon,
  },
  {
    label: "Personas",
    path: "/person",
    Icon: PersonOutlinedIcon,
    needs: ["members.read"] as Permission[],
  },
  {
    label: "Eventos y cursos",
    path: "/event",
    Icon: EventOutlinedIcon,
    needs: ["events.read"] as Permission[],
  },
  {
    label: "Cargos y accesos",
    path: "/positions",
    Icon: BadgeOutlinedIcon,
    needs: [
      "members.read",
      "positions.manage",
      "iam.read",
      "iam.manage",
      "invitations.send",
    ] as Permission[],
  },
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

  const items = [
    { label: "Mi espacio", href: "/portal/me", Icon: HomeOutlinedIcon },
    ...menuItems(node?.type)
      .filter((item) => !item.needs || item.needs.some(can))
      .map(({ label, path, Icon }) => ({
        label,
        href: `/portal/${nodeId}${path}`,
        Icon,
      })),
  ];

  return (
    <MenuDrawer nodeId={nodeId} listDrawer={<PortalMenu items={items} />}>
      {children}
    </MenuDrawer>
  );
}
