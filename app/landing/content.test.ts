import { describe, expect, it } from "vitest";
import { formatMoney, monthlyPrice, plans, whatsappLink } from "./content";

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

describe("plans", () => {
  it("has the two plans of the API, the free one first", () => {
    expect(plans.map((plan) => plan.name)).toEqual(["Gratis", "Iglesia"]);
    expect(plans.map((plan) => plan.price)).toEqual(["S/ 0", "S/ 75"]);
  });

  it("highlights exactly one plan", () => {
    expect(plans.filter((plan) => plan.highlighted)).toHaveLength(1);
  });

  it("sends both plans to the portal, where the plan is paid", () => {
    expect(plans.map((plan) => plan.href)).toEqual(["/portal", "/portal"]);
  });
});

// The same examples as the specification of the plans (specs/018-plans-billing).
describe("monthlyPrice", () => {
  it.each([
    ["PE", 80, 75],
    ["PE", 150, 75],
    ["PE", 151, 110],
    ["PE", 200, 110],
    ["PE", 600, 250],
    ["CO", 80, 85000],
    ["CO", 200, 125000],
    ["CO", 600, 285000],
  ] as const)(
    "charges %s with %i people %i a month",
    (country, people, price) => {
      expect(monthlyPrice(country, people)).toBe(price);
    },
  );
});

describe("formatMoney", () => {
  it("writes soles with cents and pesos without", () => {
    expect(formatMoney("PE", 75)).toMatch(/S\/\s?75[.,]00/);
    expect(formatMoney("CO", 85000)).toMatch(/85[.,\s]000/);
    expect(formatMoney("CO", 85000)).not.toMatch(/,00/);
  });
});
