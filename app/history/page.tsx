"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Alert,
  Loader,
  Divider,
} from "@mantine/core";
import { IconArrowRight, IconAlertCircle } from "@tabler/icons-react";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { sessions, auth, ensureAuth, isGuestEmail, ApiError } from "../lib/api";
import { setSessionId } from "../lib/store";
import type { Session } from "../lib/types";

const REC_COLOR: Record<string, string> = {
  강력추천: "green",
  추천: "green",
  보류: "yellow",
  비추천: "gray",
};

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Session[]>([]);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    (async () => {
      await ensureAuth().catch(() => {});
      try {
        // 게스트(미로그인)면 기록을 보여주지 않고 로그인 안내
        const profile = await auth.me();
        if (isGuestEmail(profile.email)) {
          setIsGuest(true);
          return;
        }
        const data = await sessions.list();
        setItems(data);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "기록을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 회사별 그룹
  const byCompany = items.reduce<Record<string, Session[]>>((acc, s) => {
    (acc[s.companyName] ??= []).push(s);
    return acc;
  }, {});

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <PageContainer size="lg">
      <Stack gap={32}>
        <PageHeader
          title="내 면접 기록"
          description="진행한 모의면접을 회사·직무별로 모아봅니다. 각 항목에서 리포트를 다시 볼 수 있어요."
        />

        {error && (
          <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Group gap={10} py={60} justify="center">
            <Loader size={18} color="brand" />
            <Text c="dimmed">기록을 불러오는 중…</Text>
          </Group>
        ) : isGuest ? (
          <Alert color="brand" variant="light">
            <Stack gap={10} align="flex-start">
              <Text fz="sm">
                내 면접 기록은 <b>로그인</b> 후에 볼 수 있어요. 로그인하면 진행한
                면접이 회사·직무별로 내 계정에 모입니다.
              </Text>
              <Button component={Link} href="/login" color="brand" size="sm">
                로그인 / 회원가입
              </Button>
            </Stack>
          </Alert>
        ) : items.length === 0 ? (
          <Alert color="gray" variant="light">
            아직 진행한 면접이 없습니다.{" "}
            <Link href="/analyze">새 면접 시작하기 →</Link>
          </Alert>
        ) : (
          <Stack gap={36}>
            {Object.entries(byCompany).map(([company, list]) => (
              <Stack key={company} gap="sm">
                <Group gap={8} align="baseline">
                  <Text fw={700} fz="md">
                    {company}
                  </Text>
                  <Text fz="xs" c="dimmed">
                    {list.length}회
                  </Text>
                </Group>
                <Divider />
                {list.map((s) => {
                  const report = s.finalReport;
                  return (
                    <Group
                      key={s.id}
                      justify="space-between"
                      wrap="nowrap"
                      py={10}
                    >
                      <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Badge variant="light" color="brand" radius="sm">
                          {s.jobRole}
                        </Badge>
                        <Text fz="xs" c="dimmed" style={{ flexShrink: 0 }}>
                          {fmtDate(s.createdAt)}
                        </Text>
                        {report ? (
                          <Group gap={6} wrap="nowrap">
                            <Text fz="sm" fw={700} c="brand.6">
                              {report.overallScore}점
                            </Text>
                            <Badge
                              size="sm"
                              variant="light"
                              color={REC_COLOR[report.recommendation] ?? "gray"}
                            >
                              {report.recommendation}
                            </Badge>
                          </Group>
                        ) : (
                          <Text fz="xs" c="dimmed">
                            리포트 미생성
                          </Text>
                        )}
                      </Group>
                      <Button
                        component={Link}
                        href={`/report?session=${s.id}`}
                        onClick={() => setSessionId(s.id)}
                        variant="subtle"
                        size="compact-sm"
                        color="dark"
                        rightSection={<IconArrowRight size={14} />}
                        style={{ flexShrink: 0 }}
                      >
                        리포트
                      </Button>
                    </Group>
                  );
                })}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </PageContainer>
  );
}
