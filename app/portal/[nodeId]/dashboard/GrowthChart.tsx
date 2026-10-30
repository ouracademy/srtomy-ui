"use client";

import { Box, useTheme } from "@mui/material";
import type { MonthResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { chartBars, monthLabel, monthLongLabel } from "./growth";

const HEIGHT = 160;
const BAR = 28;
const GAP = 8;
const LABEL = 22;

// People at the end of each month; the darker part are the members. The same
// numbers are in the table next to it, so the chart is a picture, not the only
// way to read them.
export const GrowthChart = ({ months }: { months: MonthResponse[] }) => {
  const theme = useTheme();
  const bars = chartBars(months, HEIGHT);
  const width = bars.length * (BAR + GAP) + GAP;
  return (
    <Box sx={{ overflowX: "auto" }}>
      <svg
        role="img"
        aria-label={`Personas al terminar cada mes, de ${monthLongLabel(months[0]?.month)} a ${monthLongLabel(months.at(-1)?.month)}. Las cifras están en la tabla.`}
        width={width}
        height={HEIGHT + LABEL}
      >
        {bars.map((bar, index) => {
          const x = GAP + index * (BAR + GAP);
          return (
            <g key={bar.month}>
              <rect
                x={x}
                y={HEIGHT - bar.total}
                width={BAR}
                height={bar.total}
                fill={theme.palette.primary.light}
              />
              <rect
                x={x}
                y={HEIGHT - bar.members}
                width={BAR}
                height={bar.members}
                fill={theme.palette.primary.dark}
              />
              <text
                x={x + BAR / 2}
                y={HEIGHT + 15}
                textAnchor="middle"
                fontSize="10"
                fill={theme.palette.text.primary}
              >
                {monthLabel(bar.month)}
              </text>
            </g>
          );
        })}
      </svg>
      <Box sx={{ display: "flex", gap: 2, fontSize: "0.8rem", mt: 1 }}>
        <Legend color={theme.palette.primary.dark} label="Miembros" />
        <Legend color={theme.palette.primary.light} label="Otras personas" />
      </Box>
    </Box>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
    <Box sx={{ width: 12, height: 12, bgcolor: color }} />
    {label}
  </Box>
);
