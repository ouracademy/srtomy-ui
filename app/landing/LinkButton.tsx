import Button, { type ButtonProps } from "@mui/material/Button";
import NextLink from "next/link";

type LinkButtonProps = Omit<ButtonProps<"a">, "component" | "href"> &
  Readonly<{ href: string }>;

const isInternal = (href: string) =>
  href.startsWith("/") || href.startsWith("#");

// A button that is really a link: next/link for pages and anchors, a plain
// link in a new tab for anything else (WhatsApp, mail).
export function LinkButton({ href, children, ...props }: LinkButtonProps) {
  if (isInternal(href)) {
    return (
      <Button component={NextLink} href={href} {...props}>
        {children}
      </Button>
    );
  }
  const external = href.startsWith("http");
  return (
    <Button
      component="a"
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      {...props}
    >
      {children}
    </Button>
  );
}
