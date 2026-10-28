import { IosInstallHint } from "../(components)/IosInstallHint";
import { PortalProviders } from "./PortalProviders";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalProviders>
      <IosInstallHint />
      {children}
    </PortalProviders>
  );
}
