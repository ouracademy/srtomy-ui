"use client";

import type { EventDeleteRequest } from "@/app/(api)/generated/aPIOvejafiel.schemas";

type DeleteEventOption = NonNullable<EventDeleteRequest["option"]>;
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { FormContainer, RadioButtonGroup, useForm } from "react-hook-form-mui";

export type DeleteEventRecurrentForm = {
  option: DeleteEventOption;
};

type DeleteRecurrentEventDialogProps = Readonly<{
  close: () => void;
  open: boolean;
  initialValues: DeleteEventRecurrentForm;
  onDelete: (values: DeleteEventRecurrentForm) => void;
}>;

// Asks which occurrences of a recurrent event to delete.
export const DeleteRecurrentEventDialog = ({
  close,
  open,
  onDelete,
  initialValues,
}: DeleteRecurrentEventDialogProps) => {
  const formContext = useForm<DeleteEventRecurrentForm>({
    defaultValues: initialValues,
  });

  return (
    <Dialog open={open} onClose={close}>
      <FormContainer formContext={formContext} onSuccess={onDelete}>
        <DialogTitle>Borrar el evento recurrente</DialogTitle>
        <DialogContent>
          <Typography>
            Para eliminar seleccione una de las siguientes opciones:
          </Typography>
          <RadioButtonGroup
            label=""
            name="option"
            options={[
              {
                id: "THIS_EVENT",
                label: "Este evento",
              },
              {
                id: "THIS_AND_THE_FOLLOWING_EVENTS",
                label: "Este y los eventos siguientes",
              },
              {
                id: "ALL_EVENTS",
                label: "Todos los eventos",
              },
            ]}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancelar</Button>
          <Button type="submit">Eliminar</Button>
        </DialogActions>
      </FormContainer>
    </Dialog>
  );
};
