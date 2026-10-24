import type { Metadata } from "next";
import "./globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import { Providers } from "./Providers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./src/theme";
import { Roboto } from "next/font/google";
import {
  siteDescription,
  siteKeywords,
  siteName,
  siteTitle,
  siteUrl,
} from "./site";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: `%s | ${siteName}` },
  description: siteDescription,
  keywords: siteKeywords,
  applicationName: siteName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "/",
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={roboto.variable}>
      <body>
        <ThemeProvider theme={theme}>
          <AppRouterCacheProvider>
            <Providers>{children}</Providers>
          </AppRouterCacheProvider>
        </ThemeProvider>
        <GoogleTagManager gtmId="GTM-KHZ22MM9" />
      </body>
    </html>
  );
}
