"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
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
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import NextLink from "next/link";
import React from "react";
import {
  useGetOrganizationsById,
  useGetOrganizationsByIdAttendanceStats,
  useGetOrganizationsByIdChilds,
  useGetOrganizationsByIdGrowthRange,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { ChildrenRanking } from "./ChildrenRanking";
import { DateRangeSelector } from "./DateRangeSelector";
import {
  selectionForPreset,
  toApiDate,
  type DateRangeSelection,
} from "./dateRange";
import {
  bucketLongLabel,
  compositionSegments,
  percentDelta,
  sumBuckets,
} from "./growth";

type PeriodCardProps = Readonly<{
  label: string;
  value: number;
  delta: number | null;
}>;

const PeriodCard = ({ label, value, delta }: PeriodCardProps) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="h4" component="p">
        {value}
      </Typography>
      <Typography color="text.secondary">{label}</Typography>
      {delta !== null && delta !== 0 && (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ color: delta > 0 ? "success.main" : "error.main", mt: 0.5 }}
        >
          {delta > 0 ? (
            <ArrowUpwardIcon fontSize="inherit" />
          ) : (
            <ArrowDownwardIcon fontSize="inherit" />
          )}
          <Typography variant="body2" component="span">
            {Math.abs(Math.round(delta))}% vs. período anterior
          </Typography>
        </Stack>
      )}
      {delta === null && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Nuevo en este período
        </Typography>
      )}
    </CardContent>
  </Card>
);

const SnapshotCard = ({ label, value }: { label: string; value: number }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="h4" component="p">
        {value}
      </Typography>
      <Typography color="text.secondary">{label}</Typography>
    </CardContent>
  </Card>
);

export const GrowthDashboard = ({ nodeId }: { nodeId: string }) => {
  const [selection, setSelection] = React.useState<DateRangeSelection>(() =>
    selectionForPreset("last-week", new Date()),
  );
  const [showTable, setShowTable] = React.useState(false);

  const { can } = usePermissions(nodeId);
  const { data: node } = useGetOrganizationsById(nodeId);

  const range = {
    startDate: toApiDate(selection.start),
    endDate: toApiDate(selection.end),
  };
  const previousRange = {
    startDate: toApiDate(selection.previousStart),
    endDate: toApiDate(selection.previousEnd),
  };

  const { data, error, isLoading } = useGetOrganizationsByIdGrowthRange(
    nodeId,
    range,
  );
  const { data: previousData } = useGetOrganizationsByIdGrowthRange(
    nodeId,
    previousRange,
  );

  const canReadEvents = can("events.read");
  const { data: attendance } = useGetOrganizationsByIdAttendanceStats(
    nodeId,
    range,
    { swr: { enabled: canReadEvents } },
  );
  const { data: previousAttendance } = useGetOrganizationsByIdAttendanceStats(
    nodeId,
    previousRange,
    { swr: { enabled: canReadEvents } },
  );

  const { data: childNodes } = useGetOrganizationsByIdChilds(nodeId);

  if (isLoading) return <Loading />;
  if (!data) return <ResourceError error={error} />;

  const current = data.current ?? {};
  const buckets = data.buckets ?? [];
  const previousBuckets = previousData?.buckets ?? [];
  const attendanceBuckets = attendance?.buckets ?? [];
  const previousAttendanceBuckets = previousAttendance?.buckets ?? [];

  const joined = sumBuckets(buckets, (bucket) => bucket.joined);
  const previousJoined = sumBuckets(previousBuckets, (bucket) => bucket.joined);
  const eventsCount = sumBuckets(
    attendanceBuckets,
    (bucket) => bucket.eventsCount,
  );
  const previousEventsCount = sumBuckets(
    previousAttendanceBuckets,
    (bucket) => bucket.eventsCount,
  );
  const attendanceMarks = sumBuckets(
    attendanceBuckets,
    (bucket) => bucket.attendanceMarks,
  );
  const previousAttendanceMarks = sumBuckets(
    previousAttendanceBuckets,
    (bucket) => bucket.attendanceMarks,
  );
  const averagePerEvent = eventsCount > 0 ? attendanceMarks / eventsCount : 0;
  const previousAveragePerEvent =
    previousEventsCount > 0 ? previousAttendanceMarks / previousEventsCount : 0;

  const snapshotCards = [
    { label: "Total de personas", value: current.total ?? 0 },
    { label: "Visitantes", value: current.visitors ?? 0 },
    { label: "Asistentes", value: current.attendees ?? 0 },
    { label: "Miembros", value: current.members ?? 0 },
  ];

  const periodCards: PeriodCardProps[] = [
    {
      label: "Nuevas personas",
      value: joined,
      delta: percentDelta(joined, previousJoined),
    },
    ...(canReadEvents
      ? [
          {
            label: "Eventos realizados",
            value: eventsCount,
            delta: percentDelta(eventsCount, previousEventsCount),
          },
          {
            label: "Asistencia total",
            value: attendanceMarks,
            delta: percentDelta(attendanceMarks, previousAttendanceMarks),
          },
          {
            label: "Asistencia promedio por evento",
            value: Math.round(averagePerEvent * 10) / 10,
            delta: percentDelta(averagePerEvent, previousAveragePerEvent),
          },
        ]
      : []),
  ];

  const labels = buckets.map((bucket) => bucketLongLabel(bucket.label));
  const composition = compositionSegments(current);
  const directChildren = childNodes ?? [];

  const isEmpty = !current.total && buckets.every((bucket) => !bucket.joined);

  return (
    <Stack spacing={3} sx={{ m: { xs: 2, sm: 4 }, maxWidth: 1100 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h5" component="h1">
          Resumen{node?.name ? ` de ${node.name}` : ""}
        </Typography>
        <DateRangeSelector value={selection} onChange={setSelection} />
      </Stack>

      {isEmpty ? (
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
          <Stack spacing={1}>
            <Typography variant="h6" component="h2">
              Ahora
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              }}
            >
              {snapshotCards.map((card) => (
                <SnapshotCard key={card.label} {...card} />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Cada persona cuenta una sola vez, con el estado más alto que tenga
              en este lugar o en cualquier grupo que dependa de él.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="h6" component="h2">
              En {selection.label.toLowerCase()}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  md: `repeat(${periodCards.length}, 1fr)`,
                },
              }}
            >
              {periodCards.map((card) => (
                <PeriodCard key={card.label} {...card} />
              ))}
            </Box>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            <Box>
              <Typography variant="h6" component="h2" gutterBottom>
                Crecimiento
              </Typography>
              <LineChart
                height={280}
                xAxis={[{ data: labels, scaleType: "band" }]}
                series={[
                  {
                    data: buckets.map((b) => b.peopleAtEnd ?? 0),
                    label: "Personas",
                  },
                  {
                    data: buckets.map((b) => b.membersAtEnd ?? 0),
                    label: "Miembros",
                  },
                ]}
              />
            </Box>
            <Box>
              <Typography variant="h6" component="h2" gutterBottom>
                Altas y bajas
              </Typography>
              <BarChart
                height={280}
                xAxis={[{ data: labels, scaleType: "band" }]}
                series={[
                  { data: buckets.map((b) => b.joined ?? 0), label: "Nuevos" },
                  { data: buckets.map((b) => b.left ?? 0), label: "Salieron" },
                ]}
              />
            </Box>
            <Box>
              <Typography variant="h6" component="h2" gutterBottom>
                Composición actual
              </Typography>
              <PieChart
                height={280}
                series={[
                  {
                    data: [
                      {
                        id: 0,
                        value: composition.visitorsOnly,
                        label: "Visitantes",
                      },
                      {
                        id: 1,
                        value: composition.inProgress,
                        label: "En proceso",
                      },
                      { id: 2, value: composition.members, label: "Miembros" },
                    ],
                  },
                ]}
              />
            </Box>
            {canReadEvents && (
              <Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  Eventos y asistencia
                </Typography>
                <BarChart
                  height={280}
                  xAxis={[{ data: labels, scaleType: "band" }]}
                  series={[
                    {
                      data: attendanceBuckets.map((b) => b.eventsCount ?? 0),
                      label: "Eventos",
                    },
                    {
                      data: attendanceBuckets.map(
                        (b) => b.attendanceMarks ?? 0,
                      ),
                      label: "Asistencia",
                    },
                  ]}
                />
              </Box>
            )}
            {directChildren.length > 0 && (
              <ChildrenRanking
                childNodes={directChildren}
                startDate={range.startDate}
                endDate={range.endDate}
              />
            )}
          </Box>

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
                <Table size="small" aria-label="Detalle por período">
                  <TableHead>
                    <TableRow>
                      <TableCell>Período</TableCell>
                      <TableCell align="right">Nuevos</TableCell>
                      <TableCell align="right">Pasaron a asistente</TableCell>
                      <TableCell align="right">Pasaron a miembro</TableCell>
                      <TableCell align="right">Salieron</TableCell>
                      <TableCell align="right">Personas</TableCell>
                      <TableCell align="right">Miembros</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {buckets.map((bucket) => (
                      <TableRow key={bucket.periodStart}>
                        <TableCell component="th" scope="row">
                          {bucketLongLabel(bucket.label)}
                        </TableCell>
                        <TableCell align="right">{bucket.joined}</TableCell>
                        <TableCell align="right">
                          {bucket.becameAttendee}
                        </TableCell>
                        <TableCell align="right">
                          {bucket.becameMember}
                        </TableCell>
                        <TableCell align="right">{bucket.left}</TableCell>
                        <TableCell align="right">
                          {bucket.peopleAtEnd}
                        </TableCell>
                        <TableCell align="right">
                          {bucket.membersAtEnd}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </Box>
        </>
      )}
    </Stack>
  );
};
