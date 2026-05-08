"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Group, Text } from "@mantine/core";
import classes from "./TopNav.module.css";

const steps = [
  { href: "/", label: "홈" },
  { href: "/analyze", label: "회사분석" },
  { href: "/resume", label: "이력서" },
  { href: "/interview", label: "면접" },
  { href: "/report", label: "리포트" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className={classes.nav}>
      <Group justify="space-between" align="center" h="100%" px="lg" wrap="nowrap">
        <Link href="/" className={classes.brand}>
          <Group gap={6} align="baseline" wrap="nowrap">
            <Text fw={800} fz="md" c="dark.9" style={{ letterSpacing: -0.4 }}>
              PreQ
            </Text>
            <Text fz={11} c="dimmed" style={{ letterSpacing: 0.5 }}>
              BETA
            </Text>
          </Group>
        </Link>

        <Group gap={28} wrap="nowrap">
          {steps.map((step) => {
            const active =
              step.href === "/"
                ? pathname === "/"
                : pathname.startsWith(step.href);
            return (
              <Link
                key={step.href}
                href={step.href}
                data-active={active || undefined}
                className={classes.link}
              >
                {step.label}
              </Link>
            );
          })}
        </Group>
      </Group>
    </nav>
  );
}
