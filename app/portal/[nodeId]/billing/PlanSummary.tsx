"use client";

import {
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import type { BillingResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  formatDay,
  isNearLimit,
  nextPlan,
  plural,
  planName,
  statusLabels,
  usageRatio,
} from "@/app/(components)/billingFormat";

type UsageBarProps = Readonly<{
  label: string;
  used: number;
  // Undefined when the plan has no maximum.
  max: number | undefined;
  unit: [one: string, many: string];
}>;

const UsageBar = ({ label, used, max, unit }: UsageBarProps) => {
  const ratio = usageRatio(used, max);
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" id={`usage-${label}`}>
        {label}:{" "}
        {max === undefined
          ? `${plural(used, ...unit)} (sin máximo)`
          : `${used} de ${plural(max, ...unit)}`}
      </Typography>
      {ratio !== null && (
        <LinearProgress
          variant="determinate"
          value={ratio * 100}
          color={isNearLimit(used, max) ? "warning" : "primary"}
          aria-labelledby={`usage-${label}`}
        />
      )}
    </Stack>
  );
};

// What the church has: its plan, how much of it it uses, and what the plan
// includes. The API decides all of it; this only shows it.
export const PlanSummary = ({
  billing,
}: Readonly<{ billing: BillingResponse }>) => {
  const ai = billing.ai;
  const reminders = billing.reminders;
  const next = nextPlan(billing);
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography component="h2" variant="h6">
            {`Plan ${planName(billing.plan)}`}
          </Typography>
          {billing.status && (
            <Chip
              size="small"
              label={statusLabels[billing.status]}
              color={billing.status === "ACTIVE" ? "success" : "default"}
            />
          )}
        </Stack>

        {billing.paidUntil && (
          <Typography variant="body2">
            Pagado hasta el {formatDay(billing.paidUntil)}.
          </Typography>
        )}
        {billing.status === "GRACE" && (
          <Alert severity="warning">
            El plan venció. Conservas todo unos días más: renuévalo para no
            volver a los límites del plan Gratis.
          </Alert>
        )}
        {billing.status === "EXPIRED" && (
          <Alert severity="warning">
            El plan venció. No se borró nada, pero ya no puedes agregar más
            personas ni sedes que las del plan Gratis. Renueva para seguir.
          </Alert>
        )}

        <Stack spacing={1.5}>
          <UsageBar
            label="Personas"
            used={billing.people ?? 0}
            max={billing.maxPeople}
            unit={["persona", "personas"]}
          />
          <UsageBar
            label="Sedes"
            used={billing.locations ?? 0}
            max={billing.maxLocations}
            unit={["sede", "sedes"]}
          />
          {ai && (
            <UsageBar
              label="Mensajes del asistente este mes"
              used={ai.used ?? 0}
              max={ai.limit}
              unit={["mensaje", "mensajes"]}
            />
          )}
          {reminders && (
            <UsageBar
              label="Recordatorios por WhatsApp este mes"
              used={reminders.used ?? 0}
              max={reminders.limit}
              unit={["recordatorio", "recordatorios"]}
            />
          )}
        </Stack>

        <Typography variant="body2">
          {billing.ownNumber
            ? "Tu iglesia usa su propio número de WhatsApp."
            : "WhatsApp sale por el número de Sr. Tommy. Un número propio es parte del plan Red o un extra de los planes Básico e Iglesia."}
        </Typography>

        {next && (
          <Typography variant="body2">
            El siguiente plan es el {planName(next.plan)}.
          </Typography>
        )}

        <List dense aria-label="Funciones del plan" disablePadding>
          {billing.features?.map((feature) => (
            <ListItem key={feature.feature} disableGutters>
              {feature.enabled ? (
                <CheckCircleOutlineIcon
                  color="success"
                  fontSize="small"
                  titleAccess="Incluido"
                  sx={{ mr: 1 }}
                />
              ) : (
                <LockOutlinedIcon
                  fontSize="small"
                  titleAccess="Solo en un plan superior"
                  sx={{ mr: 1 }}
                />
              )}
              <ListItemText
                primary={feature.label}
                secondary={feature.enabled ? undefined : "En un plan superior"}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
};
