import { describe, expect, it, vi } from "vitest";
import { toPersonPayload, type PersonDetailFormData } from "./PersonForm";

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsByIdPositions: vi.fn(),
}));

const data: PersonDetailFormData = {
  firstName: "Ana",
  lastName: "Ruiz",
  phoneNumber: "+51999",
  email: " ana@x.org ",
  memberState: "VISITOR",
  leader: false,
  positions: [],
};

describe("toPersonPayload", () => {
  it("sends the email without surrounding spaces", () => {
    expect(toPersonPayload(data, "n1", []).email).toBe("ana@x.org");
  });

  it("leaves the email out when it is empty", () => {
    expect(toPersonPayload({ ...data, email: "  " }, "n1", []).email).toBe(
      undefined,
    );
  });
});

describe("toPersonPayload member state", () => {
  it("sends the state the person was given", () => {
    expect(
      toPersonPayload(
        { ...data, memberState: "MEMBERSHIP_IN_PROGRESS" },
        "n1",
        [],
      ).memberState,
    ).toBe("MEMBERSHIP_IN_PROGRESS");
  });

  it("a position makes them a member whatever the state says", () => {
    expect(toPersonPayload(data, "n1", ["p1"]).memberState).toBe("MEMBER");
  });
});
