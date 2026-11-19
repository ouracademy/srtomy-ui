"use client";

import {
  Alert,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React from "react";
import { postOrganizationsByIdBillingCheckout } from "@/app/(api)/generated";
import type {
  BillingResponse,
  CheckoutRequestCountry,
  CheckoutRequestPlan,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import {
  countryLabels,
  formatMoney,
  plural,
  planName,
  planTotal,
  priceOf,
  suggestedPlan,
} from "@/app/(components)/billingFormat";
import { SaveButton } from "@/app/(components)/SaveButton";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";

// Sends the browser to the checkout of the payment provider. A prop, so the
// tests do not navigate.
const goTo = (url: string) => window.location.assign(url);

// Choose a plan, a country and a month or a year, and pay. The prices are the
// API's; a plan the church already outgrew (`fits`) cannot be chosen, and
// nothing changes until the payment is confirmed. The own WhatsApp number is
// an extra of the plans that do not include it.
export const PlanCheckout = ({
  nodeId,
  billing,
  redirect = goTo,
}: Readonly<{
  nodeId: string;
  billing: BillingResponse;
  redirect?: (url: string) => void;
}>) => {
  const alert = React.useContext(SnackbarContext);
  const paidPlans = (billing.plans ?? []).filter(
    (plan) => plan.plan !== "FREE",
  );
  const countries = (paidPlans[0]?.prices ?? []).flatMap((price) =>
    price.country ? [price.country] : [],
  );
  const [chosenPlan, setChosenPlan] = React.useState<string | undefined>();
  const [chosenCountry, setChosenCountry] = React.useState<
    string | undefined
  >();
  const [ownNumber, setOwnNumber] = React.useState(false);
  const [paying, setPaying] = React.useState<number | null>(null);

  const plan =
    paidPlans.find((candidate) => candidate.plan === chosenPlan) ??
    suggestedPlan(billing);
  const country = chosenCountry ?? billing.country ?? countries[0];
  const price = plan && country ? priceOf(plan, country) : undefined;
  if (!plan?.plan || !country || !price) return null;

  // The extra only exists where the plan sells it.
  const withExtra = ownNumber && Boolean(plan.ownNumberExtra);
  const currency = price.currency ?? "";
  const month = planTotal(plan, country, 1, withExtra);
  const year = planTotal(plan, country, 12, withExtra);
  const renewing = billing.plan === plan.plan;

  const pay = async (months: 1 | 12) => {
    // One checkout at a time: a second click must not make a second payment.
    if (paying !== null) return;
    setPaying(months);
    try {
      const checkout = await postOrganizationsByIdBillingCheckout(nodeId, {
        plan: plan.plan as CheckoutRequestPlan,
        country: country as CheckoutRequestCountry,
        months,
        ownNumber: withExtra,
      });
      if (!checkout.checkoutUrl) throw new Error("No checkout url");
      redirect(checkout.checkoutUrl);
    } catch (error) {
      setPaying(null);
      alert.showMessage(
        apiErrorMessage(error, "No pudimos iniciar el pago. Intenta de nuevo."),
      );
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6">
          {renewing ? "Renovar o cambiar de plan" : "Elegir un plan"}
        </Typography>

        <FormControl>
          <FormLabel id="plan-choice">Plan</FormLabel>
          <RadioGroup
            aria-labelledby="plan-choice"
            value={plan.plan}
            onChange={(_event, value) => setChosenPlan(value)}
          >
            {paidPlans.map((candidate) => {
              const monthly = priceOf(candidate, country)?.monthly ?? 0;
              return (
                <FormControlLabel
                  key={candidate.plan}
                  value={candidate.plan}
                  disabled={!candidate.fits}
                  control={<Radio />}
                  label={
                    <Stack>
                      <Typography>
                        {`${planName(candidate.plan)} · ${formatMoney(monthly, currency)} al mes`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.maxPeople
                          ? `Hasta ${plural(candidate.maxPeople, "persona", "personas")}`
                          : "Personas sin límite"}
                        {" · "}
                        {candidate.maxLocations
                          ? plural(candidate.maxLocations, "sede", "sedes")
                          : "sedes sin límite"}
                        {" · "}
                        {plural(
                          candidate.aiMessages ?? 0,
                          "mensaje de IA",
                          "mensajes de IA",
                        )}
                        {candidate.fits
                          ? ""
                          : " · Tu iglesia ya tiene más de lo que incluye"}
                      </Typography>
                    </Stack>
                  }
                />
              );
            })}
          </RadioGroup>
        </FormControl>

        {plan.ownNumberExtra && (
          <FormControlLabel
            control={
              <Checkbox
                checked={ownNumber}
                onChange={(_event, checked) => setOwnNumber(checked)}
              />
            }
            label={`Número de WhatsApp propio (+${formatMoney(price.ownNumberMonthly ?? 0, currency)} al mes)`}
          />
        )}
        {plan.ownNumberIncluded && (
          <Typography variant="body2">
            Este plan incluye el número de WhatsApp propio.
          </Typography>
        )}

        {countries.length > 1 && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={country}
            aria-label="País desde el que pagas"
            onChange={(_event, value: string | null) => {
              if (value) setChosenCountry(value);
            }}
          >
            {countries.map((code) => (
              <ToggleButton key={code} value={code}>
                {countryLabels[code] ?? code}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Stack spacing={1}>
            <Typography>
              <strong>{formatMoney(month ?? 0, currency)}</strong> por 1 mes
            </Typography>
            <SaveButton
              name="Pagar 1 mes"
              loading={paying === 1}
              onClick={() => void pay(1)}
            />
          </Stack>
          <Stack spacing={1}>
            <Typography>
              <strong>{formatMoney(year ?? 0, currency)}</strong> por 1 año
            </Typography>
            <SaveButton
              name="Pagar 1 año"
              loading={paying === 12}
              onClick={() => void pay(12)}
            />
          </Stack>
        </Stack>

        <Alert severity="info">
          Los precios incluyen impuestos; un año cuesta 10 meses. Pagas con
          tarjeta, Yape o PSE en la página segura de dLocal Go. El pago no se
          renueva solo: te avisaremos por correo antes de que venza.
        </Alert>
      </Stack>
    </Paper>
  );
};
