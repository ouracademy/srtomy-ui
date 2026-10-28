import Footer from "./footer/Footer";
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
      <Footer
        socialLinks={[
          {
            src: "https://cdn.builder.io/api/v1/image/assets%2F8bcc86290bcc406f950f314bd3e91ce3%2F9d2b20fa291c4acaad0f27aa6a18cd81",
            alt: "Whatsapp",
          },
        ]}
        legalLinks={[
          { href: "/terms-conditions", text: "Términos y condiciones" },
          {
            href: "/privacy-policy",
            text: "Política de privacidad",
          },
          {
            href: "/complaints-book",
            text: "Libro de reclamaciones",
          },
        ]}
        contactEmail="info@sr-tommy.com"
        contactPhone="+51 941475889"
      ></Footer>
    </div>
  );
}

//display: "flex", flexDirection: "column"
