"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { setAccessTokenProvider } from "./client";

// Gives the API client a way to get the Auth0 access token. Renders nothing.
export const AuthTokenBridge = () => {
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    setAccessTokenProvider(() => getAccessTokenSilently());
    return () => setAccessTokenProvider(undefined);
  }, [getAccessTokenSilently]);

  return null;
};
