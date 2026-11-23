import { act, cleanup, render, screen } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NodeDetails from "./page";

const node = vi.hoisted(() => ({
  current: { isLoading: true } as {
    data?: unknown;
    error?: unknown;
    isLoading: boolean;
  },
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: () => ({ ...node.current, mutate: vi.fn() }),
}));
vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({ can: () => true }),
}));

afterEach(cleanup);

// The page reads its params with `React.use`, so it renders once the promise resolves.
const renderPage = () =>
  act(async () => {
    render(
      <Suspense>
        <NodeDetails params={Promise.resolve({ nodeId: "999" })} />
      </Suspense>,
    );
  });

describe("the details of a node", () => {
  it("shows the progress indicator while it loads", async () => {
    node.current = { isLoading: true };
    await renderPage();

    expect(await screen.findByRole("progressbar")).toBeInTheDocument();
  });

  it("says the node does not exist when the API answers 404", async () => {
    node.current = {
      isLoading: false,
      error: new AxiosError(
        "not found",
        "ERR_BAD_REQUEST",
        undefined,
        undefined,
        {
          status: 404,
        } as AxiosResponse,
      ),
    };
    await renderPage();

    expect(
      await screen.findByRole("heading", { name: "No encontrado" }),
    ).toBeInTheDocument();
  });
});
