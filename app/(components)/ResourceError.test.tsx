import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import useSWR, { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResourceError } from "./ResourceError";

afterEach(cleanup);

const responseError = (status: number) =>
  new AxiosError("failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
  } as AxiosResponse);

describe("ResourceError", () => {
  it("says the resource does not exist on a 404, with nothing to retry", () => {
    render(<ResourceError error={responseError(404)} />);

    expect(
      screen.getByRole("heading", { name: "No encontrado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reintentar" }),
    ).not.toBeInTheDocument();
  });

  it("says the request failed on anything else and retries with the button", async () => {
    const onRetry = vi.fn();
    render(<ResourceError error={responseError(500)} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("without its own retry, reloads every request of the page", async () => {
    const fetcher = vi.fn().mockResolvedValue("data");
    const Reader = () => {
      useSWR("/organizations/n1", fetcher);
      return null;
    };
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <Reader />
        <ResourceError error={new Error("network")} />
      </SWRConfig>,
    );
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
