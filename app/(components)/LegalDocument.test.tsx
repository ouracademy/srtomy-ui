import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { privacyContent } from "../privacy-policy/content";
import { termsContent } from "../terms-conditions/content";
import { LegalDocument } from "./LegalDocument";

afterEach(cleanup);

describe("LegalDocument", () => {
  it("renders the title as h1 and each clause under its own h2", () => {
    render(
      <LegalDocument
        title="Título"
        intro={["Introducción"]}
        sections={[
          { title: "Uno", paragraphs: ["Texto uno"] },
          { title: "Dos", paragraphs: ["Texto dos", "Más texto"] },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Título",
    );
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Uno", "Dos"]);
    expect(screen.getByText("Introducción")).toBeVisible();
    expect(screen.getByText("Más texto")).toBeVisible();
  });

  it("keeps every clause exported from the old terms page", () => {
    render(<LegalDocument {...termsContent} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(8);
    expect(screen.getByText(/info@sr-tommy\.com/)).toBeVisible();
  });

  it("keeps every clause exported from the old privacy page", () => {
    render(<LegalDocument {...privacyContent} />);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      "RECOLECCIÓN DE DATA Y USO",
      "COMO SOLICITAR LA ELIMINACIÓN DE SU DATA DE NUESTRO SISTEMA",
      "SEGURIDAD",
      "REGISTRO",
      "ORDEN",
      "ACTUALIZACIONES",
    ]);
  });
});
