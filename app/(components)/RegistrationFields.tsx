"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Collapse,
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
  FREE_TICKET_NAME,
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

// One ticket called General is the usual case: the screen then asks only for
// the price and the seats, and does not even talk about tickets.
const isJustGeneral = (tickets: readonly TicketForm[]) =>
  tickets.length === 1 &&
  tickets[0]?.name.trim().toLowerCase() === FREE_TICKET_NAME.toLowerCase();

// The registration of an event or course: a switch and, when it is on, how
// many seats and what it costs. Another kind of ticket (Adulto, Niño...) is
// added from there, and when only General is left the screen goes back to the
// short form. It is a setup apart from sharing the link.
export const RegistrationFields = ({
  value,
  onChange,
  errors = [],
  heldTicketIds = [],
}: RegistrationFieldsProps) => {
  // Only what the user does moves between the two forms (typing a name must not).
  const [list, setList] = React.useState(!isJustGeneral(value.tickets));
  const [moreOptions, setMoreOptions] = React.useState(
    value.requiresAccount ||
      Boolean(value.tickets[0]?.salesStart || value.tickets[0]?.salesEnd),
  );
  const set = (change: Partial<RegistrationFormData>) =>
    onChange({ ...value, ...change });
  const setTicket = (index: number, change: Partial<TicketForm>) =>
    set({
      tickets: value.tickets.map((ticket, at) =>
        at === index ? { ...ticket, ...change } : ticket,
      ),
    });
  const addTicket = () => {
    setList(true);
    set({ tickets: [...value.tickets, emptyTicket()] });
  };
  const removeTicket = (index: number) => {
    const tickets = value.tickets.filter((_item, at) => at !== index);
    if (isJustGeneral(tickets)) setList(false);
    set({ tickets });
  };
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
          {list ? (
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
                  onRemove={() => removeTicket(index)}
                />
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addTicket}
                sx={{ alignSelf: "flex-start" }}
              >
                Agregar tipo de ticket
              </Button>
            </Stack>
          ) : (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Cupos"
                  helperText="Vacío es sin límite."
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
                  helperText="Vacío es gratis."
                  size="small"
                  value={first.price}
                  onChange={(event) =>
                    setTicket(0, { price: event.target.value })
                  }
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Button
                startIcon={<AddIcon />}
                onClick={addTicket}
                sx={{ alignSelf: "flex-start" }}
              >
                Agregar otro tipo de ticket
              </Button>
            </>
          )}
          <Accordion
            disableGutters
            variant="outlined"
            expanded={moreOptions}
            onChange={(_event, open) => setMoreOptions(open)}
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
                {!list && (
                  <SalesDates
                    ticket={first}
                    onChange={(change) => setTicket(0, change)}
                  />
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

// When a ticket is on sale: from and until, both optional.
const SalesDates = ({
  ticket,
  onChange,
}: Readonly<{
  ticket: TicketForm;
  onChange: (change: Partial<TicketForm>) => void;
}>) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
    <TextField
      label="Venta desde"
      type="datetime-local"
      size="small"
      value={ticket.salesStart}
      onChange={(event) => onChange({ salesStart: event.target.value })}
      slotProps={{ inputLabel: { shrink: true } }}
      sx={{ flex: 1 }}
    />
    <TextField
      label="Venta hasta"
      type="datetime-local"
      size="small"
      value={ticket.salesEnd}
      onChange={(event) => onChange({ salesEnd: event.target.value })}
      slotProps={{ inputLabel: { shrink: true } }}
      sx={{ flex: 1 }}
    />
  </Stack>
);

// One ticket of the list. Each is a group named by its position, so a screen
// reader tells the fields of one apart from the others without the screen
// repeating "ticket 2" in every label.
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
}>) => {
  // The dates a ticket is on sale are rare: they stay folded unless it has some.
  const [showDates, setShowDates] = React.useState(
    Boolean(ticket.salesStart || ticket.salesEnd),
  );
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2 }}
      role="group"
      aria-label={`Ticket ${index + 1}`}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Nombre"
            size="small"
            value={ticket.name}
            onChange={(event) => onChange({ name: event.target.value })}
            sx={{ flex: 1 }}
          />
          <IconButton
            aria-label={`Quitar el ticket ${index + 1}`}
            disabled={!canRemove}
            onClick={onRemove}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Precio (S/)"
            helperText="Vacío es gratis."
            size="small"
            value={ticket.price}
            onChange={(event) => onChange({ price: event.target.value })}
            slotProps={{ htmlInput: { inputMode: "decimal" } }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Cupos"
            helperText="Vacío es sin límite."
            size="small"
            value={ticket.quantity}
            onChange={(event) => onChange({ quantity: event.target.value })}
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
            sx={{ flex: 1 }}
          />
        </Stack>
        <div>
          <Button
            size="small"
            aria-expanded={showDates}
            onClick={() => setShowDates((current) => !current)}
          >
            {showDates ? "Ocultar fechas de venta" : "Fechas de venta"}
          </Button>
          <Collapse in={showDates} unmountOnExit>
            <div style={{ marginTop: 8 }}>
              <SalesDates ticket={ticket} onChange={onChange} />
            </div>
          </Collapse>
        </div>
      </Stack>
    </Paper>
  );
};
