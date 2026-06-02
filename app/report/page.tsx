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
  Table,
  Paper,
} from "@mantine/core";
import { RadarChart, BarChart } from "@mantine/charts";
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
import type { FinalReport, InterviewTurn } from "../lib/types";

const INTERVIEWER_NAMES: Record<string, string> = {
  lead: "주면접관",
  tech: "기술면접관",
  hr: "인사담당관",
};
const interviewerName = (id: string) => INTERVIEWER_NAMES[id] ?? "면접관";

export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await ensureAuth().catch(() => {});
      // 기록 페이지에서 ?session= 으로 특정 과거 리포트를 열 수 있다
      const fromQuery =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("session")
          : null;
      const sid = fromQuery || getSessionId();
      if (!sid) {
        setError("리포트를 표시할 세션이 없습니다. 면접을 먼저 진행해 주세요.");
        setLoading(false);
        return;
      }
      try {
        const data = await sessions.listTurns(sid);
        const answered = data.filter((t) => t.answer);
        setTurns(answered);

        // 최종 총평: 캐시(session.finalReport) 있으면 사용, 없고 채점된 답변이 있으면 생성
        if (answered.some((t) => t.score != null)) {
          setReportLoading(true);
          try {
            const session = await sessions.get(sid);
            if (session.finalReport) {
              setReport(session.finalReport);
            } else {
              setReport(await sessions.generateReport(sid));
            }
          } catch {
            /* 총평 실패해도 나머지 리포트는 표시 */
          } finally {
            setReportLoading(false);
          }
        }
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
  // 종합 점수·합격가능성: 면접관 패널 총평(report)이 있으면 그 값을, 없으면 평균 기반 휴리스틱
  const total100 = report?.overallScore ?? Math.round((avg / 5) * 100);
  const recColor: Record<string, string> = {
    강력추천: "success.7",
    추천: "success.7",
    보류: "yellow.7",
    비추천: "dark.6",
  };
  const likelihood = report
    ? { label: report.recommendation, color: recColor[report.recommendation] ?? "brand.6" }
    : avg >= 4 ? { label: "높음", color: "success.7" }
    : avg >= 3 ? { label: "보통", color: "yellow.7" }
    : { label: "보완 필요", color: "dark.6" };

  const strengths = turns
    .map((t) => t.feedbackGood)
    .filter((x): x is string => !!x);
  const weaknesses = turns
    .map((t) => t.feedbackImprove)
    .filter((x): x is string => !!x);

  // 발화 분석(전달력): 답변별 STT 지표를 누적
  const speechTurns = turns.filter((t) => t.speechMetrics);
  const speech =
    speechTurns.length > 0
      ? {
          count: speechTurns.length,
          avgWpm: Math.round(
            speechTurns.reduce(
              (s, t) => s + (t.speechMetrics?.wordsPerMin ?? 0),
              0,
            ) / speechTurns.length,
          ),
          fillers: speechTurns.reduce(
            (s, t) => s + (t.speechMetrics?.fillerCount ?? 0),
            0,
          ),
          pauses: speechTurns.reduce(
            (s, t) => s + (t.speechMetrics?.pauseCount ?? 0),
            0,
          ),
        }
      : null;

  // 역량 5축 (백엔드 CategoryScoresSchema 와 동일 순서)
  const CATEGORIES = [
    { key: "jobUnderstanding", label: "직무이해" },
    { key: "technicalSkill", label: "기술역량" },
    { key: "communication", label: "의사소통" },
    { key: "problemSolving", label: "문제해결" },
    { key: "companyFit", label: "회사적합성" },
  ] as const;

  const withCats = turns.filter((t) => t.categoryScores != null);

  // 역량별 전체 평균 (레이더 차트용)
  const radarData = CATEGORIES.map(({ key, label }) => {
    const vals = withCats
      .map((t) => t.categoryScores?.[key])
      .filter((v): v is number => typeof v === "number");
    const mean = vals.length
      ? vals.reduce((s, v) => s + v, 0) / vals.length
      : 0;
    return { category: label, 점수: Math.round(mean * 10) / 10 };
  });

  // 문항별 종합 점수 (막대 그래프용)
  const barData = scored.map((t, i) => ({
    q: `Q${String(i + 1).padStart(2, "0")}`,
    점수: t.score ?? 0,
  }));

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
                {barData.length > 0 ? (
                  <Box style={{ width: "100%", minWidth: 0 }}>
                    <BarChart
                      h={200}
                      data={barData}
                      dataKey="q"
                      series={[{ name: "점수", color: "brand.5" }]}
                      yAxisProps={{ domain: [0, 5], ticks: [0, 1, 2, 3, 4, 5] }}
                      barProps={{ radius: 4 }}
                      gridAxis="y"
                    />
                  </Box>
                ) : (
                  <Text fz="sm" c="dimmed">
                    채점된 문항이 없습니다.
                  </Text>
                )}
              </Stack>
            </SimpleGrid>

            {withCats.length > 0 && (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
                <Stack gap="md">
                  <Text
                    fz="xs"
                    c="dimmed"
                    fw={600}
                    style={{ letterSpacing: 0.8 }}
                  >
                    역량 분석
                  </Text>
                  <Box style={{ width: "100%", minWidth: 0 }}>
                    <RadarChart
                      h={260}
                      data={radarData}
                      dataKey="category"
                      series={[
                        { name: "점수", color: "brand.5", opacity: 0.25 },
                      ]}
                      withPolarRadiusAxis
                      polarRadiusAxisProps={{ domain: [0, 5], angle: 90 }}
                    />
                  </Box>
                </Stack>

                <Stack gap="md">
                  <Text
                    fz="xs"
                    c="dimmed"
                    fw={600}
                    style={{ letterSpacing: 0.8 }}
                  >
                    역량별 평균 점수
                  </Text>
                  <Paper withBorder radius="md" p={0}>
                    <Table verticalSpacing="sm" horizontalSpacing="md">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>역량</Table.Th>
                          <Table.Th ta="right">평균</Table.Th>
                          <Table.Th ta="right">5점 만점</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {radarData.map((r) => (
                          <Table.Tr key={r.category}>
                            <Table.Td fw={600}>{r.category}</Table.Td>
                            <Table.Td
                              ta="right"
                              ff="monospace"
                              c="brand.6"
                              fw={700}
                            >
                              {r.점수.toFixed(1)}
                            </Table.Td>
                            <Table.Td ta="right" c="dimmed" ff="monospace">
                              / 5
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </Stack>
              </SimpleGrid>
            )}

            {reportLoading && !report && (
              <Group gap={10}>
                <Loader size={14} color="brand" />
                <Text fz="sm" c="dimmed">
                  면접관 패널이 종합 총평을 작성하는 중입니다…
                </Text>
              </Group>
            )}

            {report && (
              <Stack gap="lg">
                <Stack gap={8}>
                  <Text
                    fz="xs"
                    c="dimmed"
                    fw={600}
                    style={{ letterSpacing: 0.8 }}
                  >
                    종합 총평
                  </Text>
                  <Text fz="sm" c="dark.7" lh={1.7}>
                    {report.overallSummary}
                  </Text>
                </Stack>

                <Stack gap="md">
                  <Text
                    fz="xs"
                    c="dimmed"
                    fw={600}
                    style={{ letterSpacing: 0.8 }}
                  >
                    면접관별 총평
                  </Text>
                  <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                    {report.interviewerReviews.map((r) => (
                      <Box
                        key={r.interviewerId}
                        p="md"
                        style={{
                          border: "1px solid var(--mantine-color-gray-2)",
                          borderRadius: 10,
                        }}
                      >
                        <Text fz="sm" fw={700} mb={6}>
                          {interviewerName(r.interviewerId)}
                        </Text>
                        <Text fz="xs" c="dark.6" lh={1.6} mb={10}>
                          {r.summary}
                        </Text>
                        {r.strengths.length > 0 && (
                          <Stack gap={2} mb={8}>
                            {r.strengths.map((s, i) => (
                              <Text key={i} fz="xs" c="success.8" lh={1.5}>
                                + {s}
                              </Text>
                            ))}
                          </Stack>
                        )}
                        {r.concerns.length > 0 && (
                          <Stack gap={2}>
                            {r.concerns.map((c, i) => (
                              <Text key={i} fz="xs" c="dark.5" lh={1.5}>
                                − {c}
                              </Text>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Stack>
            )}

            {speech && (
              <Stack gap="md">
                <div>
                  <Text
                    fz="xs"
                    c="dimmed"
                    fw={600}
                    style={{ letterSpacing: 0.8 }}
                  >
                    발화 분석 (전달력)
                  </Text>
                  <Text fz={11} c="dimmed" mt={2}>
                    음성 답변 {speech.count}개 기준 · 무엇을 말했는지가 아니라
                    어떻게 말했는지(속도·군말·망설임)를 봅니다
                  </Text>
                </div>
                <SimpleGrid cols={{ base: 3 }} spacing="md">
                  {[
                    {
                      label: "평균 말 속도",
                      value: `${speech.avgWpm}`,
                      unit: "WPM",
                      warn: speech.avgWpm > 160 || speech.avgWpm < 70,
                    },
                    {
                      label: "더듬·추임새",
                      value: `${speech.fillers}`,
                      unit: "회",
                      warn: speech.fillers > 8,
                    },
                    {
                      label: "멈칫(망설임)",
                      value: `${speech.pauses}`,
                      unit: "회",
                      warn: speech.pauses > 8,
                    },
                  ].map((m) => (
                    <Box
                      key={m.label}
                      p="md"
                      style={{
                        border: "1px solid var(--mantine-color-gray-2)",
                        borderRadius: 10,
                      }}
                    >
                      <Text fz="xs" c="dimmed" mb={6}>
                        {m.label}
                      </Text>
                      <Group gap={4} align="baseline">
                        <Text
                          fz={26}
                          fw={800}
                          c={m.warn ? "orange.7" : "brand.6"}
                          style={{ lineHeight: 1 }}
                        >
                          {m.value}
                        </Text>
                        <Text fz="xs" c="dimmed">
                          {m.unit}
                        </Text>
                      </Group>
                    </Box>
                  ))}
                </SimpleGrid>
              </Stack>
            )}

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
                      {t.scoreBreakdown && t.scoreBreakdown.length > 0 && (
                        <Group gap="md" wrap="wrap">
                          {t.scoreBreakdown.map((b) => (
                            <Text key={b.interviewerId} fz="xs" c="dimmed">
                              {interviewerName(b.interviewerId)}{" "}
                              <Text component="span" fw={700} c="brand.6" inherit>
                                {b.score}/5
                              </Text>
                            </Text>
                          ))}
                        </Group>
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
