"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import {
  emptyTicket,
  type RegistrationFormData,
  type TicketForm,
} from "./registration";

type RegistrationFieldsProps = Readonly<{
  value: RegistrationFormData;
  onChange: (value: RegistrationFormData) => void;
  // Why it cannot be saved, shown below the fields.
  errors?: string[];
  // Tickets that already have sign-ups cannot be removed: they can be closed.
  heldTicketIds?: readonly string[];
}>;

// The registration of an event or course. The usual case is one switch, how
// many seats and, if wanted, a price; everything else is under "Más opciones".
// It is a setup apart from sharing the link. The price is only informative:
// nothing is charged yet.
export const RegistrationFields = ({
  value,
  onChange,
  errors = [],
  heldTicketIds = [],
}: RegistrationFieldsProps) => {
  const [expanded, setExpanded] = React.useState(
    value.manyTickets || value.requiresAccount,
  );
  const set = (change: Partial<RegistrationFormData>) =>
    onChange({ ...value, ...change });
  const setTicket = (index: number, change: Partial<TicketForm>) =>
    set({
      tickets: value.tickets.map((ticket, at) =>
        at === index ? { ...ticket, ...change } : ticket,
      ),
    });
  const first = value.tickets[0] ?? emptyTicket();

  return (
    <Stack spacing={2}>
      <div>
        <FormControlLabel
          control={
            <Switch
              checked={value.enabled}
              onChange={(event) => set({ enabled: event.target.checked })}
            />
          }
          label="Pedir inscripción"
        />
        <FormHelperText sx={{ ml: 0 }}>
          {value.enabled
            ? "La gente se anota para tener un lugar."
            : "Apagado: cualquiera puede venir sin anotarse. Por ejemplo, un culto."}
        </FormHelperText>
      </div>
      {value.enabled && (
        <>
          {!value.manyTickets && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Cupos"
                helperText="Déjelo vacío si no hay límite"
                size="small"
                value={first.quantity}
                onChange={(event) =>
                  setTicket(0, { quantity: event.target.value })
                }
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Precio (S/)"
                helperText="Opcional. Solo informativo: no se cobra"
                size="small"
                value={first.price}
                onChange={(event) =>
                  setTicket(0, { price: event.target.value })
                }
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
                sx={{ flex: 1 }}
              />
            </Stack>
          )}
          <Accordion
            disableGutters
            variant="outlined"
            expanded={expanded}
            onChange={(_event, open) => setExpanded(open)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Más opciones</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <div>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value.requiresAccount}
                        onChange={(event) =>
                          set({ requiresAccount: event.target.checked })
                        }
                      />
                    }
                    label="Solo con cuenta"
                  />
                  <FormHelperText sx={{ ml: 0 }}>
                    Quien no tenga cuenta deberá crearla para inscribirse.
                  </FormHelperText>
                </div>
                {value.manyTickets ? (
                  <Stack spacing={1} role="group" aria-label="Tipos de ticket">
                    {value.tickets.map((ticket, index) => (
                      <TicketFields
                        key={ticket.id ?? `new-${index}`}
                        ticket={ticket}
                        index={index}
                        canRemove={
                          value.tickets.length > 1 &&
                          !(
                            ticket.id !== undefined &&
                            heldTicketIds.includes(ticket.id)
                          )
                        }
                        onChange={(change) => setTicket(index, change)}
                        onRemove={() =>
                          set({
                            tickets: value.tickets.filter(
                              (_item, at) => at !== index,
                            ),
                          })
                        }
                      />
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() =>
                        set({ tickets: [...value.tickets, emptyTicket()] })
                      }
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Agregar tipo de ticket
                    </Button>
                  </Stack>
                ) : (
                  <div>
                    <Button
                      variant="outlined"
                      onClick={() => set({ manyTickets: true })}
                    >
                      Usar varios tipos de ticket
                    </Button>
                    <FormHelperText sx={{ ml: 0 }}>
                      Por ejemplo, Adulto y Niño, cada uno con sus cupos, precio
                      y fechas de venta.
                    </FormHelperText>
                  </div>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </>
      )}
      {errors.length > 0 && (
        <Stack role="alert" spacing={0.5}>
          {errors.map((error) => (
            <Typography key={error} variant="body2" color="error">
              {error}
            </Typography>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

const TicketFields = ({
  ticket,
  index,
  canRemove,
  onChange,
  onRemove,
}: Readonly<{
  ticket: TicketForm;
  index: number;
  canRemove: boolean;
  onChange: (change: Partial<TicketForm>) => void;
  onRemove: () => void;
}>) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Ticket {index + 1}
        </Typography>
        <IconButton
          size="small"
          aria-label={`Quitar el ticket ${index + 1}`}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
      <TextField
        label={`Nombre del ticket ${index + 1}`}
        size="small"
        value={ticket.name}
        onChange={(event) => onChange({ name: event.target.value })}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label={`Precio (S/) del ticket ${index + 1}`}
          helperText="Vacío es gratis. Solo informativo: no se cobra."
          size="small"
          value={ticket.price}
          onChange={(event) => onChange({ price: event.target.value })}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
          sx={{ flex: 1 }}
        />
        <TextField
          label={`Cupos del ticket ${index + 1}`}
          helperText="Vacío es sin límite"
          size="small"
          value={ticket.quantity}
          onChange={(event) => onChange({ quantity: event.target.value })}
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
          sx={{ flex: 1 }}
        />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label={`Venta desde (ticket ${index + 1})`}
          type="datetime-local"
          size="small"
          value={ticket.salesStart}
          onChange={(event) => onChange({ salesStart: event.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: 1 }}
        />
        <TextField
          label={`Venta hasta (ticket ${index + 1})`}
          type="datetime-local"
          size="small"
          value={ticket.salesEnd}
          onChange={(event) => onChange({ salesEnd: event.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: 1 }}
        />
      </Stack>
    </Stack>
  </Paper>
);
