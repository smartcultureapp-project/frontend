"use client";

import Link from "next/link";
import { Group, Text } from "@mantine/core";
import classes from "./TopNav.module.css";

export function TopNav() {
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
      </Group>
    </nav>
  );
}
