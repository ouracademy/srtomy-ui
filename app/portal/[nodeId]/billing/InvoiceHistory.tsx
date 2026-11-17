"use client";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { InvoiceResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  formatDay,
  formatMoney,
  invoiceStatusLabels,
  plural,
} from "@/app/(components)/billingFormat";

// The payments of the church, the newest first, with the period each paid for.
export const InvoiceHistory = ({
  invoices,
}: Readonly<{ invoices: InvoiceResponse[] }>) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography component="h2" variant="h6" gutterBottom>
      Historial de pagos
    </Typography>
    {invoices.length === 0 ? (
      <Typography variant="body2">Todavía no hay pagos.</Typography>
    ) : (
      <TableContainer>
        <Table size="small" aria-label="Historial de pagos">
          <TableHead>
            <TableRow>
              <TableCell>Pago</TableCell>
              <TableCell>Periodo</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  {plural(invoice.months ?? 0, "mes", "meses")} ·{" "}
                  {plural(invoice.people ?? 0, "persona", "personas")}
                </TableCell>
                <TableCell>
                  {invoice.periodStart && invoice.periodEnd
                    ? `${formatDay(invoice.periodStart)} al ${formatDay(invoice.periodEnd)}`
                    : "—"}
                </TableCell>
                <TableCell align="right">
                  {formatMoney(invoice.amount ?? 0, invoice.currency ?? "PEN")}
                </TableCell>
                <TableCell>
                  {invoice.status ? invoiceStatusLabels[invoice.status] : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);
