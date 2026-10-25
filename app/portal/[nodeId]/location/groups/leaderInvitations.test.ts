import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import {
  inviteLeaders,
  invitationSummary,
  leadersToInvite,
} from "./leaderInvitations";

const ana = { id: "p1", label: "Ana Ruiz", email: "ana@x.org" };
const luis = { id: "p2", label: "Luis Paz", email: " luis@x.org " };
const sinCorreo = { id: "p3", label: "Eva Sol" };

describe("leadersToInvite", () => {
  it("keeps only the leaders that have an email", () => {
    expect(leadersToInvite([ana, sinCorreo, { ...luis, email: "  " }])).toEqual(
      [ana],
    );
  });
});

describe("inviteLeaders", () => {
  it("invites each leader by their person in the group", async () => {
    const invite = vi.fn().mockResolvedValue({ emailSent: true });

    const result = await inviteLeaders("g1", [ana, luis, sinCorreo], invite);

    expect(invite).toHaveBeenCalledTimes(2);
    expect(invite).toHaveBeenCalledWith("g1", {
      email: "ana@x.org",
      personId: "p1",
    });
    expect(invite).toHaveBeenCalledWith("g1", {
      email: "luis@x.org",
      personId: "p2",
    });
    expect(result).toEqual({ invited: 2, notDelivered: 0, failed: [] });
  });

  it("counts the emails that could not be delivered", async () => {
    const invite = vi.fn().mockResolvedValue({ emailSent: false });

    expect(await inviteLeaders("g1", [ana], invite)).toEqual({
      invited: 1,
      notDelivered: 1,
      failed: [],
    });
  });

  it("goes on after a refusal and explains it", async () => {
    const refusal = new AxiosError("bad", "400", undefined, undefined, {
      data: { detail: "Esa persona ya usa la aplicación" },
    } as never);
    const invite = vi
      .fn()
      .mockRejectedValueOnce(refusal)
      .mockResolvedValueOnce({ emailSent: true });

    const result = await inviteLeaders("g1", [ana, luis], invite);

    expect(result.invited).toBe(1);
    expect(result.failed).toEqual([
      { label: "Ana Ruiz", reason: "Esa persona ya usa la aplicación" },
    ]);
  });

  it("does nothing without leaders to invite", async () => {
    const invite = vi.fn();

    expect(await inviteLeaders("g1", [sinCorreo], invite)).toEqual({
      invited: 0,
      notDelivered: 0,
      failed: [],
    });
    expect(invite).not.toHaveBeenCalled();
  });
});

describe("invitationSummary", () => {
  it("is the plain message when nobody was invited", () => {
    expect(invitationSummary({ invited: 0, notDelivered: 0, failed: [] })).toBe(
      "Guardado exitosamente",
    );
  });

  it("counts the invited leaders", () => {
    expect(invitationSummary({ invited: 1, notDelivered: 0, failed: [] })).toBe(
      "Guardado exitosamente. 1 líder invitado",
    );
    expect(invitationSummary({ invited: 3, notDelivered: 0, failed: [] })).toBe(
      "Guardado exitosamente. 3 líderes invitados",
    );
  });

  it("reports what went wrong", () => {
    expect(
      invitationSummary({
        invited: 1,
        notDelivered: 1,
        failed: [
          { label: "Luis Paz", reason: "Esa persona ya usa la aplicación" },
        ],
      }),
    ).toBe(
      "Guardado exitosamente. 1 líder invitado; no se pudo enviar el correo a 1; Luis Paz: Esa persona ya usa la aplicación",
    );
  });
});
