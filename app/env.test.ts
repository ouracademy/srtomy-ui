import { afterEach, describe, expect, it, vi } from "vitest";

const load = async () => {
  vi.resetModules();
  return (await import("./env")).env;
};

describe("env", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads the validated public variables", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "tenant.example.com");
    vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "client");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080/v1");

    const env = await load();

    expect(env.NEXT_PUBLIC_AUTH0_DOMAIN).toBe("tenant.example.com");
    expect(env.NEXT_PUBLIC_AUTH0_AUDIENCE).toBeUndefined();
    expect(env.NEXT_PUBLIC_API_URL).toBe("http://localhost:8080/v1");
  });

  it("leaves the assistant off without an agent URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "tenant.example.com");
    vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "client");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
    vi.stubEnv("NEXT_PUBLIC_AGENT_URL", "");

    expect((await load()).NEXT_PUBLIC_AGENT_URL).toBeUndefined();
  });

  it("reads the agent URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "tenant.example.com");
    vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "client");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
    vi.stubEnv("NEXT_PUBLIC_AGENT_URL", "http://localhost:8000");

    expect((await load()).NEXT_PUBLIC_AGENT_URL).toBe("http://localhost:8000");
  });

  it("rejects an agent URL that is not a URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "tenant.example.com");
    vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "client");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
    vi.stubEnv("NEXT_PUBLIC_AGENT_URL", "localhost:8000/chat");

    await expect(load()).rejects.toThrow(/NEXT_PUBLIC_AGENT_URL/);
  });

  it("fails naming the missing variables", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "");
    vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await expect(load()).rejects.toThrow(/NEXT_PUBLIC_AUTH0_DOMAIN/);
  });
});
