import { describe, expect, it } from "vitest";
import {
  emptyInvitation,
  invitationErrors,
  toInvitationRequest,
} from "./invitationForm";

const valid = {
  email: " beto@x.org ",
  positionId: "",
  personId: "",
};

describe("invitationErrors", () => {
  it("accepts an invitation with only an email", () => {
    expect(invitationErrors(valid)).toEqual({});
  });

  it("asks for the email", () => {
    expect(invitationErrors(emptyInvitation)).toEqual({
      email: "Ingrese el correo",
    });
  });

  it("rejects an email that is not one", () => {
    expect(invitationErrors({ ...valid, email: "beto" })).toEqual({
      email: "Ingrese un correo válido",
    });
  });
});

describe("toInvitationRequest", () => {
  it("sends only the email when nothing else was chosen", () => {
    expect(toInvitationRequest(valid)).toEqual({ email: "beto@x.org" });
  });

  it("adds the position and the person when chosen", () => {
    expect(
      toInvitationRequest({ ...valid, positionId: "p1", personId: "per1" }),
    ).toEqual({ email: "beto@x.org", positionId: "p1", personId: "per1" });
  });
});
