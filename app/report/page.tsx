"use client";

import {
  Stack,
  Group,
  Text,
  RingProgress,
  Center,
  SimpleGrid,
  Button,
  Box,
  Divider,
  Alert,
  Loader,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconHome,
  IconArrowLeft,
  IconAlertCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { PageContainer } from "../components/PageContainer";
import { sessions, ensureAuth, ApiError } from "../lib/api";
import { getSessionId } from "../lib/store";
import type { InterviewTurn } from "../lib/types";

export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);

  useEffect(() => {
    (async () => {
      await ensureAuth().catch(() => {});
      const sid = getSessionId();
      if (!sid) {
        setError("리포트를 표시할 세션이 없습니다. 면접을 먼저 진행해 주세요.");
        setLoading(false);
        return;
      }
      try {
        const data = await sessions.listTurns(sid);
        setTurns(data.filter((t) => t.answer));
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "리포트를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 턴 점수는 1~5점 → 100점 환산
  const scored = turns.filter((t) => t.score != null);
  const avg =
    scored.length > 0
      ? scored.reduce((s, t) => s + (t.score ?? 0), 0) / scored.length
      : 0;
  const total100 = Math.round((avg / 5) * 100);
  const likelihood =
    avg >= 4 ? { label: "높음", color: "success.7" }
    : avg >= 3 ? { label: "보통", color: "yellow.7" }
    : { label: "보완 필요", color: "dark.6" };

  const strengths = turns
    .map((t) => t.feedbackGood)
    .filter((x): x is string => !!x);
  const weaknesses = turns
    .map((t) => t.feedbackImprove)
    .filter((x): x is string => !!x);

  if (loading) {
    return (
      <PageContainer size="lg">
        <Group gap={10} py={80} justify="center">
          <Loader size={18} color="brand" />
          <Text c="dimmed">리포트를 불러오는 중…</Text>
        </Group>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg">
      <Stack gap={48}>
        <PageHeader
          step={4}
          title="면접 리포트"
          description="면접관이 각 답변을 채점한 결과를 종합한 최종 리포트입니다."
        />

        {error && (
          <Alert
            color="yellow"
            variant="light"
            icon={<IconAlertCircle size={16} />}
          >
            {error}
          </Alert>
        )}

        {turns.length === 0 && !error ? (
          <Alert color="gray" variant="light">
            아직 채점된 답변이 없습니다. 면접을 진행한 뒤 다시 확인해 주세요.
          </Alert>
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
              <Stack gap="md" align="flex-start">
                <Text fz="xs" c="dimmed" fw={600} style={{ letterSpacing: 0.8 }}>
                  종합 점수
                </Text>
                <Group gap="xl" align="center">
                  <RingProgress
                    size={140}
                    thickness={8}
                    roundCaps
                    sections={[{ value: total100, color: "brand.5" }]}
                    label={
                      <Center>
                        <Stack align="center" gap={0}>
                          <Text
                            fz={36}
                            fw={800}
                            c="brand.6"
                            style={{ lineHeight: 1 }}
                          >
                            {total100}
                          </Text>
                          <Text fz="xs" c="dimmed" mt={2}>
                            / 100
                          </Text>
                        </Stack>
                      </Center>
                    }
                  />
                  <Stack gap={6}>
                    <Text fz="xs" c="dimmed" fw={600}>
                      합격 가능성
                    </Text>
                    <Text fz={24} fw={700} c={likelihood.color}>
                      {likelihood.label}
                    </Text>
                    <Text fz="xs" c="dimmed" maw={180} lh={1.4}>
                      {scored.length}개 답변 평균 {avg.toFixed(1)} / 5점 기준
                    </Text>
                  </Stack>
                </Group>
              </Stack>

              <Stack gap="md">
                <Text fz="xs" c="dimmed" fw={600} style={{ letterSpacing: 0.8 }}>
                  문항별 점수
                </Text>
                <Stack gap="sm">
                  {scored.map((t, i) => (
                    <Group key={t.id} justify="space-between">
                      <Text fz="sm" c="dark.7" truncate style={{ maxWidth: 240 }}>
                        Q{String(i + 1).padStart(2, "0")}. {t.question}
                      </Text>
                      <Text fz="sm" ff="monospace" c="brand.6" fw={700}>
                        {t.score}
                        <Text component="span" c="dimmed" inherit>
                          /5
                        </Text>
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
              <Stack gap="md">
                <Text fz="xs" c="dimmed" fw={600} style={{ letterSpacing: 0.8 }}>
                  핵심 강점
                </Text>
                <Stack gap={10}>
                  {strengths.length === 0 && (
                    <Text fz="sm" c="dimmed">
                      집계된 강점이 없습니다.
                    </Text>
                  )}
                  {strengths.map((s, i) => (
                    <Group key={i} gap={10} wrap="nowrap" align="flex-start">
                      <Box
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          background: "var(--mantine-color-success-1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <IconCheck
                          size={10}
                          color="var(--mantine-color-success-7)"
                          stroke={3}
                        />
                      </Box>
                      <Text fz="sm" lh={1.55}>
                        {s}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>

              <Stack gap="md">
                <Text fz="xs" c="dimmed" fw={600} style={{ letterSpacing: 0.8 }}>
                  개선 필요
                </Text>
                <Stack gap={10}>
                  {weaknesses.length === 0 && (
                    <Text fz="sm" c="dimmed">
                      집계된 개선점이 없습니다.
                    </Text>
                  )}
                  {weaknesses.map((w, i) => (
                    <Group key={i} gap={10} wrap="nowrap" align="flex-start">
                      <Box
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          background: "var(--mantine-color-gray-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <IconX
                          size={10}
                          color="var(--mantine-color-dark-7)"
                          stroke={3}
                        />
                      </Box>
                      <Text fz="sm" lh={1.55}>
                        {w}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </SimpleGrid>

            <Stack gap={0}>
              <Text fz="md" fw={700} mb="xs">
                전체 Q&A
              </Text>
              <Divider />
              {turns.map((t, i) => (
                <Box key={t.id}>
                  <Box py={24} px={4}>
                    <Group justify="space-between" align="flex-start" mb={12}>
                      <Group gap={10} align="baseline" wrap="nowrap">
                        <Text
                          ff="monospace"
                          fz="xs"
                          c="dimmed"
                          fw={600}
                          style={{ minWidth: 32 }}
                        >
                          Q{String(i + 1).padStart(2, "0")}
                        </Text>
                        <Text fw={600} fz="sm" lh={1.5}>
                          {t.question}
                        </Text>
                      </Group>
                      {t.score != null && (
                        <Text fz="sm" ff="monospace" fw={700} c="brand.6">
                          {t.score}
                          <Text component="span" c="dimmed" fz="sm" inherit>
                            /5
                          </Text>
                        </Text>
                      )}
                    </Group>
                    <Stack gap={12} pl={42}>
                      <Text fz="sm" c="dark.7" lh={1.6}>
                        “{t.answer}”
                      </Text>
                      {t.feedbackGood && (
                        <Text fz="sm" c="success.8" lh={1.6}>
                          + {t.feedbackGood}
                        </Text>
                      )}
                      {t.feedbackImprove && (
                        <Text fz="sm" c="dark.5" lh={1.6}>
                          − {t.feedbackImprove}
                        </Text>
                      )}
                      {t.betterAnswer && (
                        <Box
                          pl="md"
                          style={{
                            borderLeft: `2px solid var(--mantine-color-brand-3)`,
                          }}
                        >
                          <Text fz={11} c="brand.6" fw={700} mb={4}>
                            더 나은 답변 예시
                          </Text>
                          <Text fz="sm" c="dark.6" lh={1.6}>
                            {t.betterAnswer}
                          </Text>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                  <Divider />
                </Box>
              ))}
            </Stack>
          </>
        )}

        <Divider />

        <Group justify="space-between" wrap="wrap" gap="sm">
          <Button
            component={Link}
            href="/interview"
            variant="subtle"
            color="dark"
            leftSection={<IconArrowLeft size={16} />}
          >
            면접으로
          </Button>
          <Group gap="sm" wrap="wrap">
            <Button
              component={Link}
              href="/analyze"
              color="brand"
              leftSection={<IconRefresh size={14} />}
            >
              새 면접 시작
            </Button>
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="dark"
              leftSection={<IconHome size={14} />}
            >
              홈
            </Button>
          </Group>
        </Group>
      </Stack>
    </PageContainer>
  );
}
