import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PublicPageResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { PublicPage } from "./PublicPage";

afterEach(cleanup);

const group: PublicPageResponse = {
  name: "Jóvenes",
  type: "GROUP",
  description: "Para los de 18 a 30",
  schedule: "Sábados 5 pm",
  socialLinks: { instagramUrl: "https://instagram.com/jovenes" },
  leaders: ["Ana Ruiz"],
  members: ["Luis Paz", "Eva Sol"],
  positions: [],
};

const church: PublicPageResponse = {
  name: "Iglesia Central",
  type: "CHURCH",
  schedule: "Domingos 10 am",
  address: "Av. 1",
  phoneNumber: "999 111 222",
  socialLinks: {},
  leaders: [],
  positions: [{ position: "Pastor", people: ["Pedro Pastor", "Ana Ruiz"] }],
  orgChart: {
    name: "Iglesia Central",
    type: "CHURCH",
    slug: "church-slug",
    leaders: [],
    children: [
      {
        name: "Sede Norte",
        type: "LOCATION",
        slug: "norte-slug",
        leaders: ["Lía Líder"],
        children: [
          { name: "Jóvenes", type: "GROUP", leaders: [], children: [] },
        ],
      },
    ],
  },
};

describe("PublicPage of a group", () => {
  it("shows what it is, when it meets, its leaders and its members", () => {
    render(<PublicPage page={group} />);

    expect(
      screen.getByRole("heading", { name: "Jóvenes", level: 1 }),
    ).toBeTruthy();
    expect(screen.getByText("Para los de 18 a 30")).toBeTruthy();
    expect(screen.getByText("Horario: Sábados 5 pm")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Líder" })).toBeTruthy();
    expect(
      within(screen.getByRole("list", { name: "Miembros" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(2);
  });

  it("links its social networks safely", () => {
    render(<PublicPage page={group} />);

    const link = screen.getByRole("link", { name: /Instagram/ });
    expect(link.getAttribute("href")).toBe("https://instagram.com/jovenes");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("has no contact block, positions or org chart", () => {
    render(<PublicPage page={group} />);

    expect(screen.queryByText(/Dirección/)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Cargos" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Organigrama" })).toBeNull();
  });
});

describe("PublicPage of a church", () => {
  it("shows the contact of the place and who holds each position", () => {
    render(<PublicPage page={church} />);

    expect(screen.getByText("Dirección: Av. 1")).toBeTruthy();
    expect(screen.getByText("Teléfono: 999 111 222")).toBeTruthy();
    const positions = screen.getByRole("list", { name: "Cargos" });
    expect(within(positions).getByText("Pastor")).toBeTruthy();
    expect(within(positions).getByText("Pedro Pastor, Ana Ruiz")).toBeTruthy();
  });

  it("draws the org chart and links the nodes that have a public page", () => {
    render(<PublicPage page={church} />);

    const chart = screen.getByRole("list", { name: "Organigrama" });
    expect(within(chart).getByText(/Lía Líder/)).toBeTruthy();
    expect(
      within(chart)
        .getByRole("link", { name: "Sede Norte" })
        .getAttribute("href"),
    ).toBe("/g/norte-slug");
    // A node without a public page is just a name.
    expect(within(chart).queryByRole("link", { name: "Jóvenes" })).toBeNull();
    expect(within(chart).getByText("Jóvenes")).toBeTruthy();
    // The root is the page itself.
    expect(
      within(chart).queryByRole("link", { name: "Iglesia Central" }),
    ).toBeNull();
  });

  it("leaves out the org chart when the page has none", () => {
    render(<PublicPage page={{ ...church, orgChart: undefined }} />);

    expect(screen.queryByRole("heading", { name: "Organigrama" })).toBeNull();
  });
});
