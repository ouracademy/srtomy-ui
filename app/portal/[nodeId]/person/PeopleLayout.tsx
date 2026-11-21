"use client";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import PersonAddAltOutlined from "@mui/icons-material/PersonAddAltOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DEBOUNCE_WAIT_MS } from "@/app/(components)/helpers/debouncing";
import {
  memberStateFromParam,
  memberStates,
} from "@/app/(components)/memberState";
import { queryWith, searchQueryFor } from "../../../(components)/searchQuery";

// The URL parameter that holds the state filter.
export const STATE_PARAM = "estado";

const statePlurals = {
  VISITOR: "Visitantes",
  MEMBERSHIP_IN_PROGRESS: "Asistentes",
  MEMBER: "Miembros",
} as const;

export function PeopleLayout({
  children,
  nodeId,
}: {
  children: React.ReactNode;
  nodeId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchText, setSearchText] = useState(
    searchParams.get("search") || "",
  );
  const [searchTextDebounced] = useDebounce(searchText, DEBOUNCE_WAIT_MS);

  useEffect(() => {
    const query = searchQueryFor(searchParams.toString(), searchTextDebounced);
    if (query !== null) {
      router.replace(`${pathname}?${query}`);
    }
  }, [searchTextDebounced, pathname, router, searchParams]);

  const state = memberStateFromParam(searchParams.get(STATE_PARAM));
  const chooseState = (value: string) => {
    const query = queryWith(searchParams.toString(), STATE_PARAM, value);
    if (query !== null) router.replace(`${pathname}?${query}`);
  };

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 760 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Personas
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Quienes visitan, asisten y son miembros.
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={Link}
          href={`/portal/${nodeId}/person/create`}
          startIcon={<PersonAddAltOutlined />}
          sx={{
            borderRadius: 999,
            px: 2.5,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Agregar persona
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 5, overflow: "hidden" }}>
        <Stack spacing={1.75} sx={{ p: 2.25, pb: 1.75 }}>
          <TextField
            hiddenLabel
            variant="filled"
            placeholder="Buscar por nombre"
            fullWidth
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: { borderRadius: 3 },
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
              htmlInput: { "aria-label": "Buscar personas" },
            }}
          />
          <Stack
            direction="row"
            role="group"
            aria-label="Filtrar por estado"
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {[
              { value: "", label: "Todos" },
              ...memberStates.map((value) => ({
                value,
                label: statePlurals[value],
              })),
            ].map(({ value, label }) => {
              const selected = (state ?? "") === value;
              return (
                <Chip
                  key={value}
                  label={label}
                  clickable
                  aria-pressed={selected}
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  onClick={() => chooseState(value)}
                />
              );
            })}
          </Stack>
        </Stack>
        {children}
      </Paper>
    </Stack>
  );
}
