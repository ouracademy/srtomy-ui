import { cleanup, render, screen } from "@testing-library/react";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { afterEach, describe, expect, it } from "vitest";
import { PortalMenu } from "./PortalMenu";

afterEach(cleanup);

describe("PortalMenu", () => {
  it("renders a link per item", () => {
    render(
      <PortalMenu
        items={[
          { label: "Mi espacio", href: "/portal/me", Icon: HomeOutlinedIcon },
        ]}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Mi espacio" }).getAttribute("href"),
    ).toBe("/portal/me");
  });
});
