import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { AddToNodeDialog } from "./AddToNodeDialog";

const api = vi.hoisted(() => ({ put: vi.fn() }));
vi.mock("@/app/(api)/generated", () => ({
  putPeopleByIdMembershipsByOrganizationId: api.put,
}));

const showMessage = vi.fn();
const close = vi.fn();
const onAdded = vi.fn();

const open = (nodeType = "GROUP") =>
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <AddToNodeDialog
        person={{ id: "p1", name: "Ana Diaz" }}
        nodeId="n1"
        nodeName="Jóvenes"
        nodeType={nodeType}
        close={close}
        onAdded={onAdded}
      />
    </SnackbarContext.Provider>,
  );

describe("AddToNodeDialog", () => {
  beforeEach(() => {
    api.put.mockReset().mockResolvedValue(undefined);
    showMessage.mockReset();
    close.mockReset();
    onAdded.mockReset();
  });
  afterEach(cleanup);

  it("adds the person as a visitor by default", async () => {
    const user = userEvent.setup();
    open();

    expect(screen.getByText("Agregar a Ana Diaz a Jóvenes")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    expect(api.put).toHaveBeenCalledWith("p1", "n1", {
      memberState: "VISITOR",
      leader: false,
    });
    expect(close).toHaveBeenCalled();
  });

  it("can make the person a leader of a group", async () => {
    const user = userEvent.setup();
    open("MINISTRY");

    await user.click(
      screen.getByRole("checkbox", { name: "Es líder de Jóvenes" }),
    );
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("p1", "n1", {
        memberState: "VISITOR",
        leader: true,
      }),
    );
  });

  it("does not offer leadership in a location", () => {
    open("LOCATION");

    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("says why it failed and stays open", async () => {
    const user = userEvent.setup();
    api.put.mockRejectedValue(
      new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        data: { detail: "Quien tiene un cargo es miembro" },
      } as never),
    );
    open();

    await user.click(screen.getByRole("button", { name: "Agregar" }));

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "Quien tiene un cargo es miembro",
      ),
    );
    expect(onAdded).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it("stays closed without a person", () => {
    render(
      <AddToNodeDialog
        person={null}
        nodeId="n1"
        nodeName="Jóvenes"
        nodeType="GROUP"
        close={close}
        onAdded={onAdded}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
