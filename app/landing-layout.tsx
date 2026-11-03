import { LandingFooter } from "./landing/LandingFooter";
import Header from "./header/Header";
import bowTie from "./bow-tie.webp";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Header src={bowTie} alt="Logo de Oveja fiel"></Header>
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}

//display: "flex", flexDirection: "column"
