import axios, { type AxiosRequestConfig } from "axios";
import { env } from "../env";
import { handleDates } from "./date";

// Only the origin: the paths in openapi/ovejafiel-api.json already carry the /v1
// prefix (ovejafiel-api#23), so adding it here would duplicate it.
export const apiUrl = env.NEXT_PUBLIC_API_URL;

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

// Mutator for the generated code (orval.config.ts). Generated functions call
// it with a fetch-style (url, init) pair and get back only the body.
export const customInstance = <T>(
  url: string,
  { method, headers, body, signal }: RequestInit,
): Promise<T> =>
  apiClient
    .request<T>({
      url,
      method,
      headers: headers as AxiosRequestConfig["headers"],
      data: body,
      signal: signal ?? undefined,
    })
    .then(({ data }) => data);
