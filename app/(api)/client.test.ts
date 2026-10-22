import type { AxiosHeaders, AxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const load = async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "tenant.example.com");
  vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "client");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
  return import("./client");
};

// Replaces the network: records the request config and answers with `data`.
const fakeNetwork = (
  client: Awaited<ReturnType<typeof load>>["apiClient"],
  data: unknown = {},
) => {
  const requests: AxiosRequestConfig[] = [];
  client.defaults.adapter = async (config) => {
    requests.push(config);
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };
  return requests;
};

const authorization = (config?: AxiosRequestConfig) =>
  (config?.headers as AxiosHeaders | undefined)?.get("authorization");

describe("apiClient", () => {
  beforeEach(() => vi.unstubAllEnvs());
  afterEach(() => vi.unstubAllEnvs());

  it("targets the origin of the API", async () => {
    const { apiClient, apiUrl } = await load();

    expect(apiUrl).toBe("http://api.test");
    expect(apiClient.defaults.baseURL).toBe("http://api.test");
  });

  it("sends the access token as a bearer header", async () => {
    const { apiClient, setAccessTokenProvider } = await load();
    const requests = fakeNetwork(apiClient);
    setAccessTokenProvider(async () => "token-123");

    await apiClient.get("/people");

    expect(authorization(requests[0])).toBe("Bearer token-123");
  });

  it("sends no authorization header without a provider", async () => {
    const { apiClient } = await load();
    const requests = fakeNetwork(apiClient);

    await apiClient.get("/people");

    expect(authorization(requests[0])).toBeUndefined();
  });

  it("still sends the request when the token cannot be obtained", async () => {
    const { apiClient, setAccessTokenProvider } = await load();
    const requests = fakeNetwork(apiClient);
    setAccessTokenProvider(async () => {
      throw new Error("login_required");
    });

    await apiClient.post("/complaints", { comment: "hola" });

    expect(requests).toHaveLength(1);
    expect(authorization(requests[0])).toBeUndefined();
  });

  it("customInstance sends the generated request and returns only the body", async () => {
    const { apiClient, customInstance } = await load();
    const requests = fakeNetwork(apiClient, { id: "p-1" });

    const body = await customInstance<{ id: string }>("/v1/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Ana" }),
    });

    expect(body).toEqual({ id: "p-1" });
    expect(requests[0]?.url).toBe("/v1/people");
    expect(requests[0]?.method).toBe("post");
    expect(requests[0]?.data).toBe('{"firstName":"Ana"}');
  });

  it("turns ISO date-times in responses into Date objects", async () => {
    const { apiClient } = await load();
    fakeNetwork(apiClient, { start: "2025-03-15T10:30:00" });

    const { data } = await apiClient.get("/events/1");

    expect(data.start).toBeInstanceOf(Date);
  });
});
