"use client";

import { Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useState } from "react";
import { AddVisitorDialog, type VisitorForm } from "./AddVisitorDialog";

type VisitorsCardProps = Readonly<{
  // Visitors who gave no name, only counted.
  guestCount: number;
  onAddVisitor: (visitor: VisitorForm) => Promise<void>;
  onSaveGuests: (guestCount: number) => Promise<void>;
}>;

// The visitors: those who give a name become a person with their attendance
// marked; those who prefer not to, or whom nobody wrote down, are only counted
// with the + and - buttons.
export const VisitorsCard = ({
  guestCount,
  onAddVisitor,
  onSaveGuests,
}: VisitorsCardProps) => {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const change = async (next: number) => {
    setSaving(true);
    try {
      await onSaveGuests(next);
    } catch {
      // Already explained to the user.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label="Visitantes"
      sx={{ p: 2.5, borderRadius: 5 }}
    >
      <Stack spacing={1.75}>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Visitantes
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setAdding(true)}
        >
          Agregar visitante con nombre
        </Button>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography id="guests-label">Sin nombre</Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
            }}
          >
            <IconButton
              aria-label="Quitar uno"
              disabled={saving || guestCount <= 0}
              onClick={() => void change(guestCount - 1)}
              sx={{ border: "1px solid #CBD5E1", borderRadius: 2 }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography
              component="strong"
              aria-labelledby="guests-label"
              sx={{ minWidth: 20, textAlign: "center", fontWeight: 700 }}
            >
              {guestCount}
            </Typography>
            <IconButton
              aria-label="Sumar uno"
              disabled={saving}
              onClick={() => void change(guestCount + 1)}
              sx={{ border: "1px solid #CBD5E1", borderRadius: 2 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
          }}
        >
          Quienes no quisieron dar su nombre o no se anotaron. Solo se cuentan.
        </Typography>
      </Stack>
      {adding && (
        <AddVisitorDialog onAdd={onAddVisitor} close={() => setAdding(false)} />
      )}
    </Paper>
  );
};
