"use client";

import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import useSWR from "swr";
import { getOrganizationsByIdGrowthRange } from "@/app/(api)/generated";
import type { OrganizationResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

type ChildrenRankingProps = Readonly<{
  childNodes: readonly OrganizationResponse[];
  startDate: string;
  endDate: string;
}>;

// One growth-range call per direct child (not the whole subtree), run in
// parallel, to rank them by how many people they have right now.
export const ChildrenRanking = ({
  childNodes,
  startDate,
  endDate,
}: ChildrenRankingProps) => {
  const childIds = childNodes
    .map((child) => child.id)
    .filter((id): id is string => Boolean(id));

  const { data } = useSWR(
    childIds.length > 0
      ? (["children-growth-range", childIds, startDate, endDate] as const)
      : null,
    ([, ids, start, end]) =>
      Promise.all(
        ids.map((id) =>
          getOrganizationsByIdGrowthRange(id, {
            startDate: start,
            endDate: end,
          }),
        ),
      ),
  );

  if (childIds.length === 0 || !data) return null;

  const rows = childNodes
    .filter((child) => child.id)
    .map((child, index) => ({
      name: child.name ?? "",
      total: data[index]?.current?.total ?? 0,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom>
        Por grupo
      </Typography>
      <BarChart
        layout="horizontal"
        height={Math.max(120, rows.length * 48)}
        yAxis={[{ data: rows.map((row) => row.name), scaleType: "band" }]}
        series={[{ data: rows.map((row) => row.total), label: "Personas" }]}
        margin={{ left: 120 }}
      />
    </Box>
  );
};
