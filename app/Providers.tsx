"use client";
import { Auth0Provider } from "@auth0/auth0-react";
import React from "react";
import { SnackbarProvider } from "./(components)/SnackbarContext";
import { AuthTokenBridge } from "./(api)/AuthTokenBridge";
import { env } from "./env";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Auth0Provider
      domain={env.NEXT_PUBLIC_AUTH0_DOMAIN}
      clientId={env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: globalThis.location?.origin + "/portal",
        audience: env.NEXT_PUBLIC_AUTH0_AUDIENCE,
      }}
    >
      <AuthTokenBridge />
      <SnackbarProvider>{children}</SnackbarProvider>
    </Auth0Provider>
  );
};
