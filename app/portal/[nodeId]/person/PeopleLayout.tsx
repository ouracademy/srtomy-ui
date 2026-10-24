"use client";
import {
  Box,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DEBOUNCE_WAIT_MS } from "@/app/(components)/helpers/debouncing";
import { RButton } from "@/app/(components)/RButton";

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
    const params = new URLSearchParams(searchParams.toString());
    if (searchTextDebounced) {
      params.set("search", searchTextDebounced);
    } else {
      params.delete("search");
    }
    params.set("page", "0");

    router.push(`${pathname}?${params.toString()}`);
  }, [searchTextDebounced, pathname, router, searchParams]);

  return (
    <Stack direction="column" spacing={2} p={{ xs: 2, sm: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4">Personas</Typography>
        </Stack>
        <Box sx={{ display: "flex", width: { xs: "100%", sm: "auto" } }}>
          <RButton name="Registrar" href={`/portal/${nodeId}/person/create`} />
          <TextField
            sx={{ minWidth: 0 }}
            placeholder="Buscar"
            variant="outlined"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
              htmlInput: {
                style: {
                  padding: "12px 10px 12px 10px",
                },
              },
            }}
            fullWidth
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </Box>
      </Box>

      {children}
    </Stack>
  );
}
