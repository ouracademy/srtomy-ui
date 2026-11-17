"use client";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { formatMoney, monthlyPrice, type PriceCountry } from "./content";

const MAX_PEOPLE = 100_000;

// «¿Cuánto pagaría mi iglesia?»: the price of the Iglesia plan for the people
// a church has, in the currency of its country. An estimate: the plan screen
// of the portal shows the exact price.
export function PriceCalculator() {
  const [people, setPeople] = useState("200");
  const [country, setCountry] = useState<PriceCountry>("PE");
  const count = Number.parseInt(people, 10);
  const valid = Number.isInteger(count) && count >= 1 && count <= MAX_PEOPLE;
  const monthly = valid ? monthlyPrice(country, count) : null;

  return (
    <Box
      component="section"
      aria-labelledby="calculadora"
      sx={{
        mt: 4,
        p: "clamp(20px,3vw,28px)",
        borderRadius: "24px",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        id="calculadora"
        component="h3"
        sx={{ fontSize: 22, fontWeight: 700 }}
      >
        ¿Cuánto pagaría mi iglesia?
      </Typography>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          label="Personas en tu iglesia"
          type="number"
          size="small"
          value={people}
          onChange={(event) => setPeople(event.target.value)}
          error={!valid}
          helperText={
            valid ? undefined : `Escribe un número de 1 a ${MAX_PEOPLE}`
          }
          slotProps={{ htmlInput: { min: 1, max: MAX_PEOPLE } }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={country}
          aria-label="País"
          onChange={(_event, value: PriceCountry | null) => {
            if (value) setCountry(value);
          }}
        >
          <ToggleButton value="PE">Perú</ToggleButton>
          <ToggleButton value="CO">Colombia</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {monthly !== null && (
        <Typography sx={{ mt: 2 }} role="status">
          Pagarías <strong>{formatMoney(country, monthly)}</strong> al mes, o{" "}
          <strong>{formatMoney(country, monthly * 10)}</strong> al año.
        </Typography>
      )}
    </Box>
  );
}
