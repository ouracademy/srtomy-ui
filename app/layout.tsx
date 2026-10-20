import type { Metadata } from "next";
import "./globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import { Providers } from "./Providers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./src/theme";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: `Sr Tommy`,
  description: "Nuestra app te ayuda a marcar asistencias a tu iglesia :)",
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
