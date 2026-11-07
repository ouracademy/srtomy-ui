import type { EventNoticeResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoticesPanel } from "./NoticesPanel";

const api = vi.hoisted(() => ({
  data: undefined as unknown,
  mutate: vi.fn(),
  post: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetEventsByIdNotices: () => ({ data: api.data, mutate: api.mutate }),
  postEventsByIdNotices: (...args: unknown[]) => api.post(...args),
}));

beforeEach(() => {
  api.mutate.mockReset();
  api.post.mockReset();
});
afterEach(cleanup);

const notice: EventNoticeResponse = {
  kind: "CHANGED",
  message: "Nuevo lugar: Salón 3.",
  createdAt: new Date(2030, 0, 5, 10, 30),
};

describe("NoticesPanel", () => {
  it("lists the notices of the event", () => {
    api.data = [notice];
    render(<NoticesPanel eventId="e1" canPost />);

    expect(screen.getByText("Nuevo lugar: Salón 3.")).toBeInTheDocument();
    expect(screen.getByText("5 de enero, 10:30")).toBeInTheDocument();
  });

  it("publishes an announcement and reads the list again", async () => {
    api.data = [];
    api.post.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<NoticesPanel eventId="e1" canPost />);

    await user.type(screen.getByLabelText("Nuevo aviso"), "  Traer Biblia ");
    await user.click(screen.getByRole("button", { name: "Publicar aviso" }));

    expect(api.post).toHaveBeenCalledWith("e1", { message: "Traer Biblia" });
    await vi.waitFor(() => expect(api.mutate).toHaveBeenCalled());
    expect(screen.getByLabelText("Nuevo aviso")).toHaveValue("");
  });

  it("does not publish an empty announcement", async () => {
    api.data = [];
    const user = userEvent.setup();
    render(<NoticesPanel eventId="e1" canPost />);

    await user.click(screen.getByRole("button", { name: "Publicar aviso" }));

    expect(api.post).not.toHaveBeenCalled();
  });

  it("keeps what was typed when publishing fails", async () => {
    api.data = [];
    api.post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "El aviso es muy largo" } },
    });
    const user = userEvent.setup();
    render(<NoticesPanel eventId="e1" canPost />);

    await user.type(screen.getByLabelText("Nuevo aviso"), "Hola");
    await user.click(screen.getByRole("button", { name: "Publicar aviso" }));

    await vi.waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(screen.getByLabelText("Nuevo aviso")).toHaveValue("Hola");
  });

  it("only lists them to someone who cannot post, and shows nothing when there are none", () => {
    api.data = [notice];
    const { rerender } = render(<NoticesPanel eventId="e1" canPost={false} />);
    expect(screen.queryByLabelText("Nuevo aviso")).toBeNull();
    expect(screen.getByText("Nuevo lugar: Salón 3.")).toBeInTheDocument();

    api.data = [];
    rerender(<NoticesPanel eventId="e1" canPost={false} />);
    expect(screen.queryByRole("region", { name: "Avisos" })).toBeNull();
  });
});
