"use client";

import {
  Alert,
  Paper,
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
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { SaveButton } from "@/app/(components)/SaveButton";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import {
  countryLabels,
  formatMoney,
  plural,
  priceOf,
} from "@/app/(components)/billingFormat";

// Sends the browser to the checkout of the payment provider. A prop, so the
// tests do not navigate.
const goTo = (url: string) => window.location.assign(url);

// Pay the paid plan for one month or one year, in soles or pesos. The price is
// the API's (it depends on the people the church has today); nothing changes
// until the payment is confirmed.
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
  const countries = (billing.prices ?? []).flatMap((price) =>
    price.country ? [price.country] : [],
  );
  const [chosen, setChosen] = React.useState<string | undefined>();
  const country = chosen ?? billing.country ?? countries[0];
  const price = country ? priceOf(billing, country) : undefined;
  const [paying, setPaying] = React.useState<number | null>(null);

  if (!price || !country) return null;

  const pay = async (months: 1 | 12) => {
    // One checkout at a time: a second click must not make a second payment.
    if (paying !== null) return;
    setPaying(months);
    try {
      const checkout = await postOrganizationsByIdBillingCheckout(nodeId, {
        country: country as CheckoutRequestCountry,
        months,
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

  const currency = price.currency ?? "";
  const renewing = billing.plan === "CHURCH";

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6">
          {renewing ? "Renovar el plan Iglesia" : "Pasar al plan Iglesia"}
        </Typography>
        <Typography variant="body2">
          Con las {plural(billing.people ?? 0, "persona", "personas")} de tu
          iglesia hoy. Incluye {billing.includedPeople} personas; cada{" "}
          {billing.blockSize} más suman{" "}
          {formatMoney(price.extraBlock ?? 0, currency)} al mes. Un año cuesta
          10 meses.
        </Typography>

        {countries.length > 1 && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={country}
            aria-label="País desde el que pagas"
            onChange={(_event, value: string | null) => {
              if (value) setChosen(value);
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
              <strong>{formatMoney(price.monthly ?? 0, currency)}</strong> por 1
              mes
            </Typography>
            <SaveButton
              name="Pagar 1 mes"
              loading={paying === 1}
              onClick={() => void pay(1)}
            />
          </Stack>
          <Stack spacing={1}>
            <Typography>
              <strong>{formatMoney(price.yearly ?? 0, currency)}</strong> por 1
              año
            </Typography>
            <SaveButton
              name="Pagar 1 año"
              loading={paying === 12}
              onClick={() => void pay(12)}
            />
          </Stack>
        </Stack>

        <Alert severity="info">
          Pagas con tarjeta, Yape o PSE en la página segura de dLocal Go. El
          pago no se renueva solo: te avisaremos por correo antes de que venza.
        </Alert>
      </Stack>
    </Paper>
  );
};
