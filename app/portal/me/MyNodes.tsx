"use client";

import {
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import type { MyNodeResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { nodeTypeLabels } from "../organizationTree";

// The locations, groups and ministries where the user's own person is a member
// or holds a position, with the positions held there.
export const MyNodes = ({ nodes }: Readonly<{ nodes: MyNodeResponse[] }>) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography variant="h6" component="h2">
      Mis grupos y ministerios
    </Typography>
    {nodes.length === 0 && (
      <Typography
        sx={{
          color: "text.secondary",
        }}
      >
        Todavía no figuras en ningún grupo ni ministerio.
      </Typography>
    )}
    <List aria-label="Mis grupos y ministerios">
      {nodes.map((node) => (
        <ListItem key={node.id} disableGutters>
          <ListItemText
            primary={
              <NextLink href={`/portal/${node.id}`}>{node.name}</NextLink>
            }
            slotProps={{ secondary: { component: "div" } }}
            secondary={
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{
                  alignItems: "center",
                }}
              >
                <span>
                  {[nodeTypeLabels[node.type ?? ""], node.churchName]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {(node.positions ?? []).map((position) => (
                  <Chip key={position} size="small" label={position} />
                ))}
              </Stack>
            }
          />
        </ListItem>
      ))}
    </List>
  </Paper>
);
