import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  LinkCodeResponse,
  WhatsAppLinkResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { MyWhatsAppCard } from "./MyWhatsAppCard";

afterEach(cleanup);

const now = new Date("2026-11-01T10:00:00Z");
const code: LinkCodeResponse = {
  code: "AB12-CD34",
  displayNumber: "+51 999 888 777",
  expiresAt: new Date("2026-11-01T10:09:30Z"),
};

const renderCard = (
  link: WhatsAppLinkResponse,
  handlers: {
    onRequestCode?: () => Promise<LinkCodeResponse | undefined>;
    onUnlink?: () => Promise<void>;
  } = {},
) => {
  const onRequestCode = vi.fn(handlers.onRequestCode ?? (async () => code));
  const onUnlink = vi.fn(handlers.onUnlink ?? (async () => undefined));
  render(
    <MyWhatsAppCard
      link={link}
      onRequestCode={onRequestCode}
      onUnlink={onUnlink}
      now={() => now}
    />,
  );
  return { onRequestCode, onUnlink };
};

describe("MyWhatsAppCard", () => {
  it("shows the message to send, the number, the time left and a link that opens WhatsApp", async () => {
    const user = userEvent.setup();
    const { onRequestCode } = renderCard({ linked: false });

    expect(screen.getByText("Sin vincular")).toBeTruthy();
    expect(screen.queryByText("VINCULAR AB12-CD34")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Obtener código" }));

    expect(onRequestCode).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("VINCULAR AB12-CD34")).toBeTruthy();
    expect(screen.getByText(/al \+51 999 888 777/)).toBeTruthy();
    expect(screen.getByText(/Vale 10 minutos/)).toBeTruthy();
    const open = screen.getByRole("link", { name: "Abrir WhatsApp" });
    expect(open.getAttribute("href")).toBe(
      "https://wa.me/51999888777?text=VINCULAR%20AB12-CD34",
    );
    expect(open.getAttribute("rel")).toContain("noopener");
  });

  it("copies the whole message, not just the code", async () => {
    const user = userEvent.setup();
    renderCard({ linked: false });

    await user.click(screen.getByRole("button", { name: "Obtener código" }));
    await user.click(
      await screen.findByRole("button", { name: "Copiar mensaje" }),
    );

    expect(await navigator.clipboard.readText()).toBe("VINCULAR AB12-CD34");
  });

  it("has no link to WhatsApp while the number of the church is not known", async () => {
    const user = userEvent.setup();
    renderCard(
      { linked: false },
      { onRequestCode: async () => ({ ...code, displayNumber: undefined }) },
    );

    await user.click(screen.getByRole("button", { name: "Obtener código" }));

    expect(await screen.findByText("VINCULAR AB12-CD34")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Abrir WhatsApp" })).toBeNull();
  });

  it("shows nothing when the code could not be made", async () => {
    const user = userEvent.setup();
    const { onRequestCode } = renderCard(
      { linked: false },
      { onRequestCode: async () => undefined },
    );

    await user.click(screen.getByRole("button", { name: "Obtener código" }));

    await waitFor(() => expect(onRequestCode).toHaveBeenCalled());
    expect(screen.queryByText(/VINCULAR/)).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Obtener código",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it("is blocked while the code is being made", async () => {
    const user = userEvent.setup();
    let finish: (value: LinkCodeResponse) => void = () => undefined;
    const { onRequestCode } = renderCard(
      { linked: false },
      { onRequestCode: () => new Promise((resolve) => (finish = resolve)) },
    );

    const button = screen.getByRole("button", { name: "Obtener código" });
    await user.click(button);

    expect(onRequestCode).toHaveBeenCalledTimes(1);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    finish(code);
    expect(await screen.findByText("VINCULAR AB12-CD34")).toBeTruthy();
  });

  it("shows a linked number hidden, and asks before unlinking", async () => {
    const user = userEvent.setup();
    const { onUnlink } = renderCard({
      linked: true,
      maskedPhone: "+•••••••8777",
    });

    expect(screen.getByText("Vinculado")).toBeTruthy();
    expect(screen.getByText("+•••••••8777")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Vincular otro número" }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Desvincular" }));
    expect(onUnlink).not.toHaveBeenCalled();

    const confirm = screen
      .getAllByRole("button", { name: "Desvincular" })
      .at(-1);
    await user.click(confirm as HTMLElement);

    await waitFor(() => expect(onUnlink).toHaveBeenCalledTimes(1));
  });

  it("does not unlink when the person cancels", async () => {
    const user = userEvent.setup();
    const { onUnlink } = renderCard({ linked: true, maskedPhone: "+•••8777" });

    await user.click(screen.getByRole("button", { name: "Desvincular" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onUnlink).not.toHaveBeenCalled();
  });

  it("offers no unlink to someone who has not linked", () => {
    renderCard({ linked: false });

    expect(screen.queryByRole("button", { name: "Desvincular" })).toBeNull();
  });
});
