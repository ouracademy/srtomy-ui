"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  emptyTicket,
  type RegistrationFormData,
  type RegistrationMode,
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

const modes: { value: RegistrationMode; label: string; help: string }[] = [
  {
    value: "NONE",
    label: "Sin inscripción",
    help: "Cualquiera puede venir. Por ejemplo, un culto.",
  },
  {
    value: "FREE",
    label: "Gratis",
    help: "La gente se inscribe sin pagar; puede poner un cupo total.",
  },
  {
    value: "TICKETS",
    label: "Con tipos de ticket",
    help: "Defina cada ticket con su precio, cantidad y fechas de venta.",
  },
];

// The registration of an event or course: free, or with kinds of ticket, seats
// and a waitlist. It is a setup apart from sharing the link. The price is only
// informative: nothing is charged yet.
export const RegistrationFields = ({
  value,
  onChange,
  errors = [],
  heldTicketIds = [],
}: RegistrationFieldsProps) => {
  const set = (change: Partial<RegistrationFormData>) =>
    onChange({ ...value, ...change });
  const setTicket = (index: number, change: Partial<TicketForm>) =>
    set({
      tickets: value.tickets.map((ticket, at) =>
        at === index ? { ...ticket, ...change } : ticket,
      ),
    });

  const chooseMode = (mode: RegistrationMode) => {
    if (mode === "TICKETS" && value.tickets.length === 0) {
      set({ mode, tickets: [{ ...emptyTicket(), name: "General" }] });
      return;
    }
    set({ mode });
  };

  return (
    <Stack spacing={2}>
      <FormControl>
        <FormLabel id="registration-mode">Inscripción</FormLabel>
        <RadioGroup
          aria-labelledby="registration-mode"
          value={value.mode}
          onChange={(event) =>
            chooseMode(event.target.value as RegistrationMode)
          }
        >
          {modes.map((mode) => (
            <FormControlLabel
              key={mode.value}
              value={mode.value}
              control={<Radio />}
              label={
                <>
                  <Typography component="span">{mode.label}</Typography>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    display="block"
                  >
                    {mode.help}
                  </Typography>
                </>
              }
            />
          ))}
        </RadioGroup>
      </FormControl>
      {value.mode !== "NONE" && (
        <>
          <TextField
            label="Cupo total"
            helperText="Déjelo vacío si no hay límite"
            size="small"
            value={value.capacity}
            onChange={(event) => set({ capacity: event.target.value })}
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
            sx={{ maxWidth: 240 }}
          />
          {value.mode === "TICKETS" && (
            <Stack spacing={1} role="group" aria-label="Tipos de ticket">
              {value.tickets.map((ticket, index) => (
                <Paper
                  key={ticket.id ?? `new-${index}`}
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ flex: 1 }}>
                        Ticket {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        aria-label={`Quitar el ticket ${index + 1}`}
                        disabled={
                          value.tickets.length === 1 ||
                          (ticket.id !== undefined &&
                            heldTicketIds.includes(ticket.id))
                        }
                        onClick={() =>
                          set({
                            tickets: value.tickets.filter(
                              (_item, at) => at !== index,
                            ),
                          })
                        }
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <TextField
                      label={`Nombre del ticket ${index + 1}`}
                      size="small"
                      value={ticket.name}
                      onChange={(event) =>
                        setTicket(index, { name: event.target.value })
                      }
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label={`Precio (S/) del ticket ${index + 1}`}
                        helperText="Vacío es gratis. Solo informativo: no se cobra."
                        size="small"
                        value={ticket.price}
                        onChange={(event) =>
                          setTicket(index, { price: event.target.value })
                        }
                        slotProps={{ htmlInput: { inputMode: "decimal" } }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label={`Cantidad del ticket ${index + 1}`}
                        helperText="Vacío es sin límite"
                        size="small"
                        value={ticket.quantity}
                        onChange={(event) =>
                          setTicket(index, { quantity: event.target.value })
                        }
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
                        onChange={(event) =>
                          setTicket(index, { salesStart: event.target.value })
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label={`Venta hasta (ticket ${index + 1})`}
                        type="datetime-local"
                        size="small"
                        value={ticket.salesEnd}
                        onChange={(event) =>
                          setTicket(index, { salesEnd: event.target.value })
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: 1 }}
                      />
                    </Stack>
                  </Stack>
                </Paper>
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
          )}
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={value.open}
                  onChange={(event) => set({ open: event.target.checked })}
                />
              }
              label="Inscripción abierta"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={value.requiresAccount}
                  onChange={(event) =>
                    set({ requiresAccount: event.target.checked })
                  }
                />
              }
              label="Pedir iniciar sesión para inscribirse"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={value.waitlistEnabled}
                  onChange={(event) =>
                    set({ waitlistEnabled: event.target.checked })
                  }
                />
              }
              label="Lista de espera cuando se agoten los lugares"
            />
          </FormGroup>
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
