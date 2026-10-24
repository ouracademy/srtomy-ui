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
