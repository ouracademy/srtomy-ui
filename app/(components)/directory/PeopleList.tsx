"use client";

import { List, ListItem, ListItemText, Typography } from "@mui/material";
import type { DirectoryEntryResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

// The people of a node as the directory gives them: names only, and nothing
// at all when the node's visibility hides them from this user.
export const PeopleList = ({ entry }: { entry: DirectoryEntryResponse }) => {
  if (!entry.membersVisible) {
    return (
      <Typography color="text.secondary">
        Quienes lideran este grupo decidieron que su lista de personas no sea
        visible para usted.
      </Typography>
    );
  }
  const members = entry.members ?? [];
  if (members.length === 0) {
    return <Typography color="text.secondary">Aún no hay personas.</Typography>;
  }
  return (
    <List dense aria-label="Personas">
      {members.map((name, index) => (
        <ListItem key={`${name}-${index}`} disableGutters>
          <ListItemText primary={name} />
        </ListItem>
      ))}
    </List>
  );
};
