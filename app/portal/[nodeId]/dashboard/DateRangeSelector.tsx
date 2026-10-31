"use client";

import {
  Button,
  FormHelperText,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import * as React from "react";
import {
  customSelection,
  RANGE_PRESETS,
  RANGE_PRESET_LABELS,
  selectionForPreset,
  type DateRangeSelection,
  type RangePreset,
} from "./dateRange";

type DateRangeSelectorProps = Readonly<{
  value: DateRangeSelection;
  onChange: (selection: DateRangeSelection) => void;
}>;

// Google-Analytics-style period picker: a row of fixed-length presets, plus
// "Personalizado", which opens two date pickers in a popover instead of
// changing the range right away (applying needs both dates, in order).
export const DateRangeSelector = ({
  value,
  onChange,
}: DateRangeSelectorProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [draftStart, setDraftStart] = React.useState<Date | null>(value.start);
  const [draftEnd, setDraftEnd] = React.useState<Date | null>(value.end);

  const invalidOrder = Boolean(draftStart && draftEnd && draftStart > draftEnd);

  const openCustom = (event: React.MouseEvent<HTMLElement>) => {
    setDraftStart(value.start);
    setDraftEnd(value.end);
    setAnchorEl(event.currentTarget);
  };

  const applyCustom = () => {
    if (!draftStart || !draftEnd || invalidOrder) return;
    onChange(customSelection(draftStart, draftEnd));
    setAnchorEl(null);
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      <ToggleButtonGroup
        exclusive
        size="small"
        aria-label="Periodo"
        value={value.preset}
        onChange={(_event, preset: RangePreset | null) => {
          if (!preset || preset === "custom") return;
          onChange(selectionForPreset(preset, new Date()));
        }}
      >
        {RANGE_PRESETS.map((preset) => (
          <ToggleButton key={preset} value={preset}>
            {RANGE_PRESET_LABELS[preset]}
          </ToggleButton>
        ))}
        <ToggleButton value="custom" onClick={openCustom}>
          {RANGE_PRESET_LABELS.custom}
        </ToggleButton>
      </ToggleButtonGroup>
      {value.preset === "custom" && (
        <Typography variant="body2" color="text.secondary">
          {value.label}
        </Typography>
      )}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack spacing={2} sx={{ p: 2, minWidth: 280 }}>
          <DatePicker
            label="Desde"
            value={draftStart}
            onChange={(date) => setDraftStart(date)}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="Hasta"
            value={draftEnd}
            onChange={(date) => setDraftEnd(date)}
            slotProps={{ textField: { size: "small" } }}
          />
          {invalidOrder && (
            <FormHelperText error>
              La fecha de inicio debe ser anterior a la fecha de fin.
            </FormHelperText>
          )}
          <Button
            variant="contained"
            size="small"
            disabled={!draftStart || !draftEnd || invalidOrder}
            onClick={applyCustom}
          >
            Aplicar
          </Button>
        </Stack>
      </Popover>
    </Stack>
  );
};
