import { PortalProviders } from "./PortalProviders";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalProviders>{children}</PortalProviders>;
}
