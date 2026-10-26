import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { CalendarSyncCard } from "./CalendarSyncCard";

const feed = vi.hoisted(() => ({
  data: undefined as { path?: string } | undefined,
  error: undefined as unknown,
  isLoading: false,
  mutate: vi.fn(),
  renew: vi.fn(),
  isMutating: false,
}));

vi.mock("@/app/(api)/client", () => ({ apiUrl: "https://api.example.org" }));
vi.mock("@/app/(api)/generated", () => ({
  useGetMeCalendarFeed: () => ({
    data: feed.data,
    error: feed.error,
    isLoading: feed.isLoading,
    mutate: feed.mutate,
  }),
  usePostMeCalendarFeedRenew: () => ({
    trigger: feed.renew,
    isMutating: feed.isMutating,
  }),
}));

const showMessage = vi.fn();

const renderCard = () =>
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <CalendarSyncCard />
    </SnackbarContext.Provider>,
  );

beforeEach(() => {
  feed.data = { path: "/v1/public/calendar/tok123.ics" };
  feed.error = undefined;
  feed.isLoading = false;
  feed.isMutating = false;
  feed.mutate.mockReset();
  feed.renew.mockReset();
  showMessage.mockReset();
});

afterEach(cleanup);

describe("CalendarSyncCard", () => {
  it("shows the private address and the links to subscribe", () => {
    renderCard();

    expect(screen.getByLabelText("Enlace del calendario")).toHaveValue(
      "https://api.example.org/v1/public/calendar/tok123.ics",
    );
    expect(
      screen.getByRole("link", { name: "Agregar a Google Calendar" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("https://calendar.google.com/calendar/r?cid="),
    );
    expect(
      screen.getByRole("link", { name: "Agregar a Apple Calendar" }),
    ).toHaveAttribute(
      "href",
      "webcal://api.example.org/v1/public/calendar/tok123.ics",
    );
  });

  it("shows a spinner while the address loads", () => {
    feed.data = undefined;
    feed.isLoading = true;

    renderCard();

    expect(
      screen.queryByText("Sincroniza con tu calendario"),
    ).not.toBeInTheDocument();
  });

  it("shows the error when the address could not be loaded", () => {
    feed.data = undefined;
    feed.error = new Error("boom");

    renderCard();

    expect(
      screen.queryByText("Sincroniza con tu calendario"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reintentar/i }),
    ).toBeInTheDocument();
  });

  it("copies the address", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    renderCard();

    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));

    expect(writeText).toHaveBeenCalledWith(
      "https://api.example.org/v1/public/calendar/tok123.ics",
    );
    expect(showMessage).toHaveBeenCalledWith("Enlace copiado");
  });

  it("asks before generating a new address and then shows it", async () => {
    const user = userEvent.setup();
    feed.renew.mockResolvedValue({ path: "/v1/public/calendar/new456.ics" });
    renderCard();

    await user.click(
      screen.getByRole("button", { name: "Generar un enlace nuevo" }),
    );
    expect(feed.renew).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Generar" }));

    await waitFor(() =>
      expect(feed.mutate).toHaveBeenCalledWith(
        { path: "/v1/public/calendar/new456.ics" },
        { revalidate: false },
      ),
    );
    expect(showMessage).toHaveBeenCalledWith(
      "Listo: el enlace anterior ya no funciona",
    );
  });

  it("keeps the address when generating a new one fails", async () => {
    const user = userEvent.setup();
    feed.renew.mockRejectedValue(new Error("boom"));
    renderCard();

    await user.click(
      screen.getByRole("button", { name: "Generar un enlace nuevo" }),
    );
    await user.click(screen.getByRole("button", { name: "Generar" }));

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "No se pudo generar el enlace. Intenta de nuevo.",
      ),
    );
    expect(feed.mutate).not.toHaveBeenCalled();
  });
});
