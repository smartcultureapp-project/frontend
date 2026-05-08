import type { Metadata } from "next";
import { MantineProvider, ColorSchemeScript, Box } from "@mantine/core";
import { TopNav } from "./components/TopNav";
import { theme } from "./theme";
import "@mantine/core/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 면접 코치",
  description: "멀티 에이전트 모의면접 — 회사 분석부터 리포트까지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <TopNav />
          <Box pt={56}>{children}</Box>
        </MantineProvider>
      </body>
    </html>
  );
}
