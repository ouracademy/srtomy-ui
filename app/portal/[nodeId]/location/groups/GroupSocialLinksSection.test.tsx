import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormContainer } from "react-hook-form-mui";
import { afterEach, describe, expect, it } from "vitest";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";
import { GroupSocialLinksSection } from "./GroupSocialLinksSection";

afterEach(cleanup);

const setup = (disabled = false) => {
  render(
    <FormContainer
      defaultValues={{
        socialLinks: {
          ...emptySocialLinks,
          instagramUrl: "https://instagram.com/jovenes",
        },
      }}
    >
      <GroupSocialLinksSection prefix="socialLinks" disabled={disabled} />
    </FormContainer>,
  );
  return userEvent.setup();
};

describe("GroupSocialLinksSection", () => {
  it("is folded and says it is optional", () => {
    setup();

    const toggle = screen.getByRole("button", {
      name: /Redes sociales y sitio web/,
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText(/opcional/)).toBeTruthy();
  });

  it("has one field per network, with the saved links", async () => {
    const user = setup();

    await user.click(
      screen.getByRole("button", { name: /Redes sociales y sitio web/ }),
    );

    for (const name of [
      "Sitio web",
      "Facebook",
      "Instagram",
      "YouTube",
      "TikTok",
    ]) {
      expect(screen.getByRole("textbox", { name })).toBeTruthy();
    }
    expect(
      (screen.getByRole("textbox", { name: "Instagram" }) as HTMLInputElement)
        .value,
    ).toBe("https://instagram.com/jovenes");
  });

  it("cannot be edited when disabled", async () => {
    const user = setup(true);

    await user.click(
      screen.getByRole("button", { name: /Redes sociales y sitio web/ }),
    );

    expect(
      screen
        .getByRole("textbox", { name: "Facebook" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
