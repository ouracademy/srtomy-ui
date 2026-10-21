import axios from "axios";
import { env } from "../env";
import { handleDates } from "./date";

// srtomy-api versions its endpoints under /v1 (see srtomy-api#23); kept out of
// NEXT_PUBLIC_API_URL itself so every environment's env var only has to name
// the API's origin, not repeat the version suffix.
export const apiUrl = `${env.NEXT_PUBLIC_API_URL}/v1`;

type AccessTokenProvider = () => Promise<string | undefined>;

let accessTokenProvider: AccessTokenProvider | undefined;

// Registered by AuthTokenBridge once Auth0 is available.
export const setAccessTokenProvider = (provider?: AccessTokenProvider) => {
  accessTokenProvider = provider;
};

// The only HTTP client of the app. Components never use it directly: they go
// through the functions and hooks in ./services.
export const apiClient = axios.create({ baseURL: apiUrl });

apiClient.interceptors.request.use(async (config) => {
  if (!accessTokenProvider) return config;

  try {
    const token = await accessTokenProvider();
    if (token) config.headers.set("authorization", `Bearer ${token}`);
  } catch {
    // Anonymous visitor (e.g. the public complaints book): send the request
    // without a token and let the API decide.
  }
  return config;
});

apiClient.interceptors.response.use((response) => {
  handleDates(response.data);
  return response;
});
