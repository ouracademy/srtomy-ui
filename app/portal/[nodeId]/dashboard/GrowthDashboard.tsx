"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import React from "react";
import {
  useGetOrganizationsById,
  useGetOrganizationsByIdGrowth,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { GrowthChart } from "./GrowthChart";
import { monthLongLabel, summarizeGrowth } from "./growth";

const RANGES = [6, 12, 24] as const;

export const GrowthDashboard = ({ nodeId }: { nodeId: string }) => {
  const [months, setMonths] = React.useState<number>(12);
  const [showTable, setShowTable] = React.useState(false);
  const { data: node } = useGetOrganizationsById(nodeId);
  const { data, error, isLoading } = useGetOrganizationsByIdGrowth(nodeId, {
    months,
  });

  if (isLoading) return <Loading />;
  if (!data) return <ResourceError error={error} />;

  const current = data.current ?? {};
  const rows = data.months ?? [];
  const cards = [
    { label: "Visitantes", value: current.visitors },
    { label: "Asistentes", value: current.attendees },
    { label: "Miembros", value: current.members },
    { label: "Total de personas", value: current.total },
  ];

  return (
    <Stack spacing={3} sx={{ m: { xs: 2, sm: 4 }, maxWidth: 1000 }}>
      <Typography variant="h5" component="h1">
        Resumen{node?.name ? ` de ${node.name}` : ""}
      </Typography>

      {!current.total && rows.every((month) => !month.joined) ? (
        <Stack spacing={2} alignItems="flex-start">
          <Typography>
            Todavía no hay personas. Cuando agregues a la primera, aquí verás
            cómo crece.
          </Typography>
          <Button
            variant="contained"
            component={NextLink}
            href={`/portal/${nodeId}/person/create`}
          >
            Agregar persona
          </Button>
        </Stack>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            }}
          >
            {cards.map(({ label, value }) => (
              <Card key={label} variant="outlined">
                <CardContent>
                  <Typography variant="h4" component="p">
                    {value ?? 0}
                  </Typography>
                  <Typography color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Cada persona cuenta una sola vez, con el estado más alto que tenga
            en este lugar o en cualquier grupo que dependa de él.
          </Typography>

          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
            >
              <Typography variant="h6" component="h2">
                Crecimiento
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                aria-label="Período"
                value={months}
                onChange={(_event, value: number | null) =>
                  value && setMonths(value)
                }
              >
                {RANGES.map((range) => (
                  <ToggleButton key={range} value={range}>
                    Últimos {range} meses
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
            <Typography>{summarizeGrowth(rows)}</Typography>
            <GrowthChart months={rows} />
            <Box>
              <Button
                size="small"
                aria-expanded={showTable}
                aria-controls="growth-table"
                onClick={() => setShowTable((shown) => !shown)}
              >
                {showTable ? "Ocultar tabla" : "Ver tabla"}
              </Button>
              <Collapse in={showTable} id="growth-table" unmountOnExit>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" aria-label="Movimiento mes a mes">
                    <TableHead>
                      <TableRow>
                        <TableCell>Mes</TableCell>
                        <TableCell align="right">Nuevos</TableCell>
                        <TableCell align="right">Pasaron a asistente</TableCell>
                        <TableCell align="right">Pasaron a miembro</TableCell>
                        <TableCell align="right">Salieron</TableCell>
                        <TableCell align="right">Personas</TableCell>
                        <TableCell align="right">Miembros</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell component="th" scope="row">
                            {monthLongLabel(month.month)}
                          </TableCell>
                          <TableCell align="right">{month.joined}</TableCell>
                          <TableCell align="right">
                            {month.becameAttendee}
                          </TableCell>
                          <TableCell align="right">
                            {month.becameMember}
                          </TableCell>
                          <TableCell align="right">{month.left}</TableCell>
                          <TableCell align="right">
                            {month.peopleAtEnd}
                          </TableCell>
                          <TableCell align="right">
                            {month.membersAtEnd}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Collapse>
            </Box>
          </Stack>
        </>
      )}
    </Stack>
  );
};
