import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { describeRegistrationMode } from "@/app/(components)/registrationMode";
import { Alert, Button } from "@mui/material";
import NextLink from "next/link";

type ContainerNoticeProps = Readonly<{
  nodeId: string;
  // A sub-event: it has the event it is part of.
  event: EventResponse;
}>;

// Which event a sub-event is part of and how it is entered, with a way back.
export const ContainerNotice = ({ nodeId, event }: ContainerNoticeProps) => (
  <Alert
    severity="info"
    action={
      <Button
        color="inherit"
        size="small"
        component={NextLink}
        href={`/portal/${nodeId}/event/${event.parentEventId}/attendance`}
      >
        Ver el evento
      </Button>
    }
  >
    Parte de «{event.parentTitle}».{" "}
    {describeRegistrationMode(event.registrationMode)?.help}
  </Alert>
);
