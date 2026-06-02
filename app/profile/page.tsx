"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Stack,
  Group,
  Text,
  Box,
  Button,
  Alert,
  Loader,
  Avatar,
} from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { auth, ensureAuth, logout, isGuestEmail } from "../lib/api";
import type { UserProfile } from "../lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureAuth().catch(() => {});
      try {
        setMe(await auth.me());
      } catch {
        /* 무시 */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const guest = isGuestEmail(me?.email);

  const onLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <PageContainer size="xs">
      <Stack gap={32}>
        <PageHeader title="프로필" />

        {loading ? (
          <Group gap={10} py={40} justify="center">
            <Loader size={18} color="brand" />
          </Group>
        ) : (
          <Stack gap="lg">
            <Group gap="md">
              <Avatar size="lg" radius="xl" color="brand">
                <IconUser size={24} />
              </Avatar>
              <Stack gap={2}>
                <Text fw={700} fz="lg">
                  {guest ? "게스트" : (me?.name ?? "사용자")}
                </Text>
                <Text fz="sm" c="dimmed">
                  {guest ? "로그인하지 않은 임시 계정" : me?.email}
                </Text>
              </Stack>
            </Group>

            {guest ? (
              <Alert color="brand" variant="light">
                <Stack gap={8}>
                  <Text fz="sm">
                    지금은 <b>게스트</b>로 이용 중이에요. 로그인하면 면접 기록을
                    내 계정에 영구 보관하고 어디서든 볼 수 있습니다.
                  </Text>
                  <Button
                    component={Link}
                    href="/login"
                    color="brand"
                    size="sm"
                    w="fit-content"
                  >
                    로그인 / 회원가입
                  </Button>
                </Stack>
              </Alert>
            ) : (
              <Button
                variant="light"
                color="dark"
                leftSection={<IconLogout size={16} />}
                onClick={onLogout}
                w="fit-content"
              >
                로그아웃
              </Button>
            )}

            <Box>
              <Button component={Link} href="/history" variant="subtle" color="brand">
                내 면접 기록 보기 →
              </Button>
            </Box>
          </Stack>
        )}
      </Stack>
    </PageContainer>
  );
}
