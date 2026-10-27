"use client";

import { useAuth0 } from "@auth0/auth0-react";
import AddIcon from "@mui/icons-material/Add";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import {
  useGetMe,
  useGetMeEvents,
  useGetMeInvitations,
  useGetMeNodes,
  useGetMeOrganizations,
  useGetMeSharedEvents,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import MenuDrawer from "../MenuDrawer";
import { PendingInvitations } from "../PendingInvitations";
import { PortalMenu } from "../PortalMenu";
import { SharedWithMe } from "../SharedWithMe";
import { useAcceptInvitation } from "../useAcceptInvitation";
import { suggestedNames } from "../userNames";
import { MyEvents } from "./MyEvents";
import { MyNodes } from "./MyNodes";

const menu = [
  { label: "Mi espacio", href: "/portal/me", Icon: HomeOutlinedIcon },
];

// "Mi espacio": what concerns the signed-in user whatever their access is, so
// it is open to anyone with a session. Only shows their own data (the API
// answers with that). The church directory lives in the menu of each node.
export default function MySpacePage() {
  const { user } = useAuth0();
  // Registers the user on first sign-in (and refreshes their email).
  const { error: meError } = useGetMe();
  const {
    data: organizations,
    error: organizationsError,
    isLoading,
  } = useGetMeOrganizations();
  const nodes = useGetMeNodes();
  const events = useGetMeEvents();
  const shared = useGetMeSharedEvents();
  const invitations = useGetMeInvitations();
  const acceptInvitation = useAcceptInvitation(() => {
    // The new nodes and events show up here once refreshed.
    void nodes.mutate();
    void events.mutate();
    void invitations.mutate();
  });

  return (
    <MenuDrawer listDrawer={<PortalMenu items={menu} />}>
      <Box sx={{ maxWidth: 900, m: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mi espacio
        </Typography>
        {isLoading ? (
          <Loading />
        ) : !organizations ? (
          <ResourceError error={organizationsError ?? meError} />
        ) : (
          <Stack spacing={3}>
            <Section
              loading={events.isLoading}
              failed={!events.data}
              error={events.error}
            >
              <MyEvents events={events.data ?? []} />
            </Section>
            <Section
              loading={nodes.isLoading}
              failed={!nodes.data}
              error={nodes.error}
            >
              <MyNodes nodes={nodes.data ?? []} />
            </Section>
            <Section
              loading={shared.isLoading}
              failed={!shared.data}
              error={shared.error}
            >
              <SharedWithMe events={shared.data ?? []} showEmpty />
            </Section>
            <Section
              loading={invitations.isLoading}
              failed={!invitations.data}
              error={invitations.error}
            >
              <PendingInvitations
                invitations={invitations.data ?? []}
                suggestedName={suggestedNames(user)}
                accept={acceptInvitation}
                showEmpty
              />
            </Section>
            <Box>
              <Button
                component={NextLink}
                href="/portal?nueva=1"
                startIcon={<AddIcon />}
              >
                Registrar otra iglesia
              </Button>
            </Box>
          </Stack>
        )}
      </Box>
    </MenuDrawer>
  );
}

// Each section loads on its own, so one failing request does not hide the rest.
const Section = ({
  loading,
  failed,
  error,
  children,
}: Readonly<{
  loading: boolean;
  failed: boolean;
  error: unknown;
  children: React.ReactNode;
}>) => {
  if (loading) return <Loading />;
  if (failed) return <ResourceError error={error} />;
  return <>{children}</>;
};
