import { useAuth0 } from "@auth0/auth0-react";
import Box from "@mui/material/Box";
import NextLink from "next/link";
import { BowTieIcon } from "./BowTieIcon";
import { brandName } from "./content";
import { LinkButton } from "./LinkButton";
import { Wrap } from "./Section";

export function LandingHeader() {
  const { isAuthenticated, isLoading } = useAuth0();

  return (
    <Box component="header" sx={{ py: 2.5 }}>
      <Wrap
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box
          component={NextLink}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            minHeight: 44,
            color: "text.primary",
            textDecoration: "none",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          <BowTieIcon sx={{ width: 44, height: 22 }} />
          {brandName}
        </Box>
        <Box
          component="nav"
          aria-label="Acceso"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {!isLoading &&
            (isAuthenticated ? (
              <LinkButton href="/portal" variant="contained">
                Ir al portal
              </LinkButton>
            ) : (
              <>
                <LinkButton href="/portal" color="primary">
                  Iniciar sesión
                </LinkButton>
                <LinkButton href="/portal" variant="contained">
                  Empezar gratis
                </LinkButton>
              </>
            ))}
        </Box>
      </Wrap>
    </Box>
  );
}
