"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#eef0ff",
  "#d8dcff",
  "#aeb6ff",
  "#828dff",
  "#5d6cff",
  "#4555f5",
  "#3a48d4",
  "#2e3aae",
  "#222c8a",
  "#171f6b",
];

const success: MantineColorsTuple = [
  "#e9faf3",
  "#cdf1de",
  "#a3e3c1",
  "#74d2a2",
  "#4cc488",
  "#2ebd76",
  "#1bb56b",
  "#089d59",
  "#008c4d",
  "#007940",
];

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: 5,
  colors: { brand, success },
  fontFamily:
    "Pretendard, 'Pretendard Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontFamilyMonospace:
    "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace",
  defaultRadius: "sm",
  headings: {
    fontFamily:
      "Pretendard, 'Pretendard Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "2.25rem", lineHeight: "1.2" },
      h2: { fontSize: "1.625rem", lineHeight: "1.3" },
      h3: { fontSize: "1.25rem", lineHeight: "1.4" },
    },
  },
  components: {
    Card: {
      defaultProps: {
        withBorder: true,
        shadow: undefined,
      },
    },
    Button: {
      defaultProps: {
        radius: "sm",
      },
    },
  },
});
