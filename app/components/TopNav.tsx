"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Group, Text, Button, Avatar, Menu } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import classes from "./TopNav.module.css";
import { auth, getToken, isGuestEmail } from "../lib/api";
import type { UserProfile } from "../lib/types";

export function TopNav() {
  const [me, setMe] = useState<UserProfile | null>(null);

  useEffect(() => {
    // 토큰이 있을 때만 조회 (게스트 자동발급은 각 페이지가 함)
    if (!getToken()) return;
    auth
      .me()
      .then(setMe)
      .catch(() => {});
  }, []);

  const guest = !me || isGuestEmail(me.email);

  return (
    <nav className={classes.nav}>
      <Group
        justify="space-between"
        align="center"
        h="100%"
        px="lg"
        wrap="nowrap"
      >
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

        <Group gap="sm" wrap="nowrap">
          <Button
            component={Link}
            href="/history"
            variant="subtle"
            color="dark"
            size="compact-sm"
          >
            내 기록
          </Button>
          {guest ? (
            <Button
              component={Link}
              href="/login"
              variant="light"
              color="brand"
              size="compact-sm"
            >
              로그인
            </Button>
          ) : (
            <Menu position="bottom-end" withArrow>
              <Menu.Target>
                <Avatar
                  size="sm"
                  radius="xl"
                  color="brand"
                  style={{ cursor: "pointer" }}
                >
                  <IconUser size={16} />
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{me?.name ?? me?.email}</Menu.Label>
                <Menu.Item component={Link} href="/profile">
                  프로필
                </Menu.Item>
                <Menu.Item component={Link} href="/history">
                  내 면접 기록
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>
    </nav>
  );
}
