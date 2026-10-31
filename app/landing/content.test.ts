import { describe, expect, it } from "vitest";
import { formatPrice, plans, whatsappLink } from "./content";

describe("whatsappLink", () => {
  it("opens a chat with the church line", () => {
    expect(whatsappLink()).toBe("https://wa.me/51941475889");
  });

  it("encodes the message", () => {
    expect(whatsappLink("Hola, quiero el plan Red")).toBe(
      "https://wa.me/51941475889?text=Hola%2C%20quiero%20el%20plan%20Red",
    );
  });
});

describe("formatPrice", () => {
  it("shows soles", () => {
    expect(formatPrice(0)).toBe("S/ 0");
    expect(formatPrice(69)).toBe("S/ 69");
  });
});

describe("plans", () => {
  it("has three plans with growing prices", () => {
    expect(plans.map((plan) => plan.price)).toEqual([0, 69, 149]);
  });

  it("highlights exactly one plan", () => {
    expect(plans.filter((plan) => plan.highlighted)).toHaveLength(1);
  });

  it("sends the free plan to the portal and paid plans to WhatsApp", () => {
    const [free, ...paid] = plans;
    expect(free?.href).toBe("/portal");
    for (const plan of paid) {
      expect(plan.href).toContain("https://wa.me/");
      expect(decodeURIComponent(plan.href)).toContain(plan.name);
    }
  });
});
