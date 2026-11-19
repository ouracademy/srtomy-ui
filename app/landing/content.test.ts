import { describe, expect, it } from "vitest";
import { plans, whatsappLink } from "./content";

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

// The same numbers as the specification of the plans (srtomy-api, specs/018).
describe("plans", () => {
  it("has the four plans of the API, the free one first, with growing prices", () => {
    expect(plans.map((plan) => plan.name)).toEqual([
      "Gratis",
      "Básico",
      "Iglesia",
      "Red",
    ]);
    expect(plans.map((plan) => plan.price)).toEqual([
      "S/ 0",
      "S/ 45",
      "S/ 75",
      "S/ 149",
    ]);
  });

  it("tells the price in Colombia of each paid plan", () => {
    expect(plans.slice(1).map((plan) => plan.priceNote)).toEqual([
      "al mes · COP 49.000 en Colombia",
      "al mes · COP 79.000 en Colombia",
      "al mes · COP 159.000 en Colombia",
    ]);
  });

  it("highlights exactly one plan, the Iglesia one", () => {
    expect(plans.filter((plan) => plan.highlighted).map((p) => p.name)).toEqual(
      ["Iglesia"],
    );
  });

  it("sends every plan to the portal, where the plan is paid", () => {
    expect(plans.map((plan) => plan.href)).toEqual([
      "/portal",
      "/portal",
      "/portal",
      "/portal",
    ]);
  });
});
