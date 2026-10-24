"use client";

import {
  Box,
  Container,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import type {
  OrgChartNode,
  PublicPageResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { socialLinkFields } from "@/app/(components)/SocialLinks";
import { publicPagePath } from "@/app/(components)/visibility";
import { nodeTypeLabels } from "@/app/portal/organizationTree";

// The public page of a node: what it is, when it meets, who leads it and, for
// a church or location, its ministerial positions and org chart. The API only
// names adults, so everything here can be shown as it comes.
export const PublicPage = ({ page }: { page: PublicPageResponse }) => {
  const leaders = page.leaders ?? [];
  const links = socialLinkFields.flatMap(({ name, label }) => {
    const url = page.socialLinks?.[name as keyof typeof page.socialLinks];
    return url ? [{ label, url }] : [];
  });

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 2, sm: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {nodeTypeLabels[page.type ?? ""] ?? page.type}
          </Typography>
          <Typography variant="h4" component="h1">
            {page.name}
          </Typography>
          {page.description && <Typography>{page.description}</Typography>}
        </Box>
        {(page.schedule || page.address || page.phoneNumber) && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            {page.schedule && <Typography>Horario: {page.schedule}</Typography>}
            {page.address && <Typography>Dirección: {page.address}</Typography>}
            {page.phoneNumber && (
              <Typography>Teléfono: {page.phoneNumber}</Typography>
            )}
          </Paper>
        )}
        {links.length > 0 && (
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {links.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </Link>
            ))}
          </Stack>
        )}
        {leaders.length > 0 && (
          <Section title={leaders.length === 1 ? "Líder" : "Líderes"}>
            <Names names={leaders} label="Líderes" />
          </Section>
        )}
        {(page.positions ?? []).length > 0 && (
          <Section title="Cargos">
            <List dense disablePadding aria-label="Cargos">
              {(page.positions ?? []).map((position) => (
                <ListItem key={position.position} disableGutters>
                  <ListItemText
                    primary={position.position}
                    secondary={(position.people ?? []).join(", ")}
                  />
                </ListItem>
              ))}
            </List>
          </Section>
        )}
        {page.members && page.members.length > 0 && (
          <Section title="Miembros">
            <Names names={page.members} label="Miembros" />
          </Section>
        )}
        {page.orgChart && (
          <Section title="Organigrama">
            <OrgChart node={page.orgChart} />
          </Section>
        )}
      </Stack>
    </Container>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box component="section">
    <Typography variant="h6" component="h2" gutterBottom>
      {title}
    </Typography>
    {children}
  </Box>
);

const Names = ({ names, label }: { names: string[]; label: string }) => (
  <List dense disablePadding aria-label={label}>
    {names.map((name, index) => (
      <ListItem key={`${name}-${index}`} disableGutters>
        <ListItemText primary={name} />
      </ListItem>
    ))}
  </List>
);

// The nodes below, nested; a node with a public page of its own links to it.
const OrgChart = ({
  node,
  root = true,
}: {
  node: OrgChartNode;
  root?: boolean;
}) => (
  <Box
    component="ul"
    aria-label={root ? "Organigrama" : undefined}
    sx={{ listStyle: "none", m: 0, pl: root ? 0 : 3 }}
  >
    <li>
      {node.slug && !root ? (
        <Link component={NextLink} href={publicPagePath(node.slug)}>
          {node.name}
        </Link>
      ) : (
        <strong>{node.name}</strong>
      )}
      {(node.leaders ?? []).length > 0 && (
        <Typography component="span" variant="body2" color="text.secondary">
          {" "}
          — {(node.leaders ?? []).join(", ")}
        </Typography>
      )}
      {(node.children ?? []).map((child, index) => (
        <OrgChart key={`${child.name}-${index}`} node={child} root={false} />
      ))}
    </li>
  </Box>
);
