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
  locId,
}: {
  children: React.ReactNode;
  locId: number;
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
    <Stack direction="column" spacing={2} p={4}>
      <Box display="flex" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4">Personas</Typography>

          {/* <Tooltip title="Registrar">
            <Link href={`/portal/${locId}/person/create`}>
              <RegisterButton icon={<AddIcon />} ariaLabel="create" />
            </Link>
          </Tooltip> */}
        </Stack>
        <div style={{ display: "flex" }}>
          <RButton name="Registrar" href={`/portal/${locId}/person/create`} />
          {/* <Button
            variant="outlined"
            component={Link}
            href={`/portal/${locId}/person/create`}
            color="inherit"
            sx={{
              fontSize: "12px",
              marginRight: "20px",
              padding: "0px 40px",
              background: "#3B82F6",
              color: "#fff",
            }}
          >
            Registrar
          </Button> */}
          <TextField
            placeholder="Buscar"
            variant="outlined"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),

                // sx: {
                //   "MuiOutlinedInput-input": {
                //     padding: "16.5px 10px 16.5px 10px"
                //   }
                // }
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
        </div>

        {/* <ToggleButtonGroup value={value} exclusive aria-label="text alignment">
          <Tooltip title="Lista de personas">
            <ToggleButton
              value="table"
              aria-label="table"
              LinkComponent={Link}
              href={`/portal/${locId}/person`}
            >
              <TableRows />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Board de personas">
            <ToggleButton
              value="board"
              aria-label="kanban board"
              LinkComponent={Link}
              href={`/portal/${locId}/person/board`}
            >
              <TableChart />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup> */}
      </Box>

      {children}
    </Stack>
  );
}
