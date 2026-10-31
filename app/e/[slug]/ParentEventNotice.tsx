import type { SharedEventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { sharedEventPath } from "@/app/(components)/eventSharing";
import { Alert, Button } from "@mui/material";
import NextLink from "next/link";

type ParentEventNoticeProps = Readonly<{
  container: NonNullable<SharedEventResponse["container"]>;
  // The registration shown is the one of the event it is part of: the visitor
  // signs up there, not here.
  signsUpThere: boolean;
}>;

// The event a sub-event is part of, with a way to get to it.
export const ParentEventNotice = ({
  container,
  signsUpThere,
}: ParentEventNoticeProps) => (
  <Alert
    severity="info"
    action={
      <Button
        color="inherit"
        size="small"
        component={NextLink}
        href={sharedEventPath(container.slug ?? "")}
      >
        Ver «{container.title}»
      </Button>
    }
  >
    Forma parte de «{container.title}».
    {signsUpThere && " Para tener un lugar, inscríbase allá."}
  </Alert>
);
