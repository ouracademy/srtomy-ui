"use client";

import { useGetEvents } from "@/app/(api)/generated";
import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { Alert, Button, Stack } from "@mui/material";
import { programCandidates } from "./programCandidates";

type ProgramPromptProps = Readonly<{
  nodeId: string;
  picked: { start: Date; end: Date };
  // The user wants the new session in the program of this event.
  onChoose: (event: EventResponse) => void;
}>;

// Shown over the form of a new event when the hours picked on the calendar fall
// inside a congress or an event with a program: offers to add the session to it
// instead of creating a loose event.
export const ProgramPrompt = ({
  nodeId,
  picked,
  onChoose,
}: ProgramPromptProps) => {
  const { data } = useGetEvents({
    organizationId: nodeId,
    start: picked.start,
    end: picked.end,
  });
  const candidates = programCandidates(data ?? [], picked);
  if (candidates.length === 0) return null;

  return (
    <Alert severity="info" sx={{ mx: 4, mt: 4 }}>
      <Stack spacing={1}>
        <span>Esta hora cae dentro de un evento con programa.</span>
        {candidates.map((candidate) => (
          <Button
            key={candidate.id}
            size="small"
            variant="outlined"
            onClick={() => onChoose(candidate)}
          >
            Agregar al programa de «{candidate.title}»
          </Button>
        ))}
      </Stack>
    </Alert>
  );
};
