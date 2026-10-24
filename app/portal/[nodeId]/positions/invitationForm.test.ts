import { describe, expect, it } from "vitest";
import {
  emptyInvitation,
  invitationErrors,
  toInvitationRequest,
} from "./invitationForm";

const valid = {
  email: " beto@x.org ",
  firstName: " Beto ",
  lastName: "Pérez",
  positionId: "",
};

describe("invitationErrors", () => {
  it("accepts a complete invitation", () => {
    expect(invitationErrors(valid)).toEqual({});
  });

  it("asks for each missing field", () => {
    expect(invitationErrors(emptyInvitation)).toEqual({
      email: "Ingrese el correo",
      firstName: "Ingrese el nombre",
      lastName: "Ingrese el apellido",
    });
  });

  it("rejects an email that is not one", () => {
    expect(invitationErrors({ ...valid, email: "beto" })).toEqual({
      email: "Ingrese un correo válido",
    });
  });
});

describe("toInvitationRequest", () => {
  it("trims the values and leaves out an empty position", () => {
    expect(toInvitationRequest(valid)).toEqual({
      email: "beto@x.org",
      firstName: "Beto",
      lastName: "Pérez",
    });
  });

  it("sends the chosen position", () => {
    expect(toInvitationRequest({ ...valid, positionId: "p1" }).positionId).toBe(
      "p1",
    );
  });
});
