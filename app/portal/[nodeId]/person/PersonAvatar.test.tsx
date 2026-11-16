import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PersonAvatar, personInitials, toneFor } from "./PersonAvatar";

afterEach(cleanup);

describe("personInitials", () => {
  it("uses the first letter of the first and last name", () => {
    expect(personInitials({ firstName: "ana", lastName: "Diaz" })).toBe("AD");
  });

  it("falls back to the full name", () => {
    expect(personInitials({ fullName: "Beto  Ruiz Soto" })).toBe("BR");
    expect(personInitials({ fullName: "Beto" })).toBe("B");
  });

  it("uses a question mark when there is no name", () => {
    expect(personInitials({})).toBe("?");
  });
});

describe("toneFor", () => {
  it("gives the same color to the same person", () => {
    expect(toneFor("p1")).toBe(toneFor("p1"));
    expect(toneFor("p1")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("PersonAvatar", () => {
  it("shows the initials", () => {
    render(<PersonAvatar person={{ id: "p1", fullName: "Ana Diaz" }} />);

    expect(screen.getByText("AD")).toBeInTheDocument();
  });
});
