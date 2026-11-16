import { describe, expect, it } from "vitest";
import { privacyContent } from "./content";

describe("privacyContent", () => {
  it("names Claude, from Anthropic, as the provider of the AI assistant", () => {
    const section = privacyContent.sections.find(
      ({ title }) => title === "ASISTENTE DE INTELIGENCIA ARTIFICIAL",
    );

    const text = section?.paragraphs.join(" ") ?? "";
    expect(text).toContain("Claude");
    expect(text).toContain("Anthropic");
  });

  it("warns that a plan with AI can send data to third-party providers", () => {
    const section = privacyContent.sections.find(
      ({ title }) => title === "ASISTENTE DE INTELIGENCIA ARTIFICIAL",
    );

    const text = section?.paragraphs.join(" ") ?? "";
    expect(text).toContain("plan con inteligencia artificial");
    expect(text).toContain("aplicaciones de terceros");
    expect(text).toContain("OpenAI");
  });
});
