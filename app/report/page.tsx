"use client";

import {
  Stack,
  Group,
  Text,
  Tabs,
  RingProgress,
  Center,
  SimpleGrid,
  Progress,
  Button,
  Box,
  Divider,
  rem,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconDownload,
  IconRefresh,
  IconHome,
  IconArrowLeft,
} from "@tabler/icons-react";
import Link from "next/link";
import { PageHeader } from "../components/PageHeader";
import { PageContainer } from "../components/PageContainer";

const breakdown = [
  { label: "직무 기술 역량", score: 24, max: 30 },
  { label: "인재상 부합도", score: 22, max: 25 },
  { label: "문제 해결 능력", score: 18, max: 25 },
  { label: "커뮤니케이션", score: 14, max: 20 },
];

const strengths = [
  "React 실무 경험이 풍부함",
  "답변에 자신감이 있고 명확함",
  "팀 협업 경험을 구체적으로 설명",
];

const weaknesses = [
  "시스템 설계 관련 깊이 부족",
  "일부 답변이 추상적",
  "실패 경험에 대한 회고 부족",
];

type QA = {
  question: string;
  answer: string;
  feedback: string;
  score: number;
  max: number;
};

const qa: QA[] = [
  {
    question: "자기소개 부탁드립니다.",
    answer:
      "안녕하세요, 3년차 프론트엔드 개발자 홍길동입니다. React와 TypeScript를 주력으로 사용하고 있습니다.",
    feedback:
      "경력과 기술 스택을 잘 정리해서 전달했습니다. 다만 본인의 강점이나 차별점을 한 문장 추가하면 더 좋습니다.",
    score: 8,
    max: 10,
  },
  {
    question: "React 성능 최적화 경험을 말씀해주세요.",
    answer: "React.memo와 useMemo를 활용해서 불필요한 렌더링을 줄였습니다.",
    feedback:
      "도구 이름은 알고 있지만 구체적인 사례나 측정값이 부족합니다. “초기 렌더링 시 3초였던 페이지를 0.8초로 단축했습니다”처럼 수치 기반 답변이 더 좋습니다.",
    score: 6,
    max: 10,
  },
  {
    question: "팀 내 의사결정 갈등 경험을 말씀해주세요.",
    answer:
      "기술 스택 선정에서 의견이 갈렸을 때 데이터 기반으로 PoC를 진행해 합의를 이끌어냈습니다.",
    feedback:
      "갈등 상황과 해결 과정, 결과까지 STAR 구조로 잘 전달했습니다.",
    score: 9,
    max: 10,
  },
];

export default function ReportPage() {
  const total = breakdown.reduce((sum, b) => sum + b.score, 0);

  return (
    <PageContainer size="lg">
    <Stack gap={48}>
      <PageHeader
        step={4}
        title="면접 리포트"
        description="3명의 면접관이 독립 채점한 결과를 종합한 최종 리포트입니다."
      />

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
              sections={[{ value: total, color: "brand.5" }]}
              label={
                <Center>
                  <Stack align="center" gap={0}>
                    <Text fz={36} fw={800} c="brand.6" style={{ lineHeight: 1 }}>
                      {total}
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
              <Text fz={24} fw={700} c="success.7">
                높음
              </Text>
              <Text fz="xs" c="dimmed" maw={180} lh={1.4}>
                상위 25% 수준의 답변 일관성과 구조화 점수
              </Text>
            </Stack>
          </Group>
        </Stack>

        <Stack gap="md">
          <Text fz="xs" c="dimmed" fw={600} style={{ letterSpacing: 0.8 }}>
            항목별 점수
          </Text>
          <Stack gap="md">
            {breakdown.map((b) => {
              const pct = (b.score / b.max) * 100;
              return (
                <Stack key={b.label} gap={6}>
                  <Group justify="space-between">
                    <Text fz="sm">{b.label}</Text>
                    <Text fz="sm" ff="monospace" c="dimmed">
                      {b.score} / {b.max}
                    </Text>
                  </Group>
                  <Progress value={pct} color="brand" size="xs" radius="xl" />
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
        <Stack gap="md">
          <Text fz="xs" c="dimmed" fw={600} style={{ letterSpacing: 0.8 }}>
            핵심 강점
          </Text>
          <Stack gap={10}>
            {strengths.map((s) => (
              <Group key={s} gap={10} wrap="nowrap" align="flex-start">
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
            {weaknesses.map((w) => (
              <Group key={w} gap={10} wrap="nowrap" align="flex-start">
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

      <Stack gap="md">
        <Tabs defaultValue="all" color="brand" variant="default">
          <Tabs.List>
            <Tabs.Tab value="all">전체 Q&A</Tabs.Tab>
            <Tabs.Tab value="lead">주면접관 총평</Tabs.Tab>
            <Tabs.Tab value="tech">기술면접관</Tabs.Tab>
            <Tabs.Tab value="hr">인사담당관</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="all" pt="lg">
            <Stack gap={0}>
              <Divider />
              {qa.map((item, i) => (
                <Box key={i}>
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
                          {item.question}
                        </Text>
                      </Group>
                      <Text fz="sm" ff="monospace" fw={700} c="brand.6">
                        {item.score}
                        <Text component="span" c="dimmed" fz="sm" inherit>
                          /{item.max}
                        </Text>
                      </Text>
                    </Group>
                    <Stack gap={12} pl={42}>
                      <Text fz="sm" c="dark.7" lh={1.6}>
                        “{item.answer}”
                      </Text>
                      <Box
                        pl="md"
                        style={{
                          borderLeft: `2px solid var(--mantine-color-brand-3)`,
                        }}
                      >
                        <Text fz="sm" c="dark.6" lh={1.6}>
                          {item.feedback}
                        </Text>
                      </Box>
                    </Stack>
                  </Box>
                  <Divider />
                </Box>
              ))}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="lead" pt="lg">
            <Text fz="sm" c="dark.7" lh={1.7} maw={680}>
              전반적으로 자신감 있는 톤이 인상적이었고, 질문 의도를 잘 파악해
              구조적으로 답변했습니다. 다만 결정적 순간의 의사결정 근거가 다소
              모호한 부분이 있어, STAR 구조에서 R(결과)을 더 수치화하면
              좋겠습니다.
            </Text>
          </Tabs.Panel>
          <Tabs.Panel value="tech" pt="lg">
            <Text fz="sm" c="dark.7" lh={1.7} maw={680}>
              React 기초와 최적화 도구에 대한 이해는 충분합니다. 시스템 설계,
              상태 관리 전략, 캐시 무효화 등 서비스 규모가 커질 때 부딪치는
              문제에 대한 사고 깊이를 더 보강하면 좋겠습니다.
            </Text>
          </Tabs.Panel>
          <Tabs.Panel value="hr" pt="lg">
            <Text fz="sm" c="dark.7" lh={1.7} maw={680}>
              협업 사례에서 갈등 해결 능력이 잘 드러났습니다. 다만 실패 경험에
              대한 회고가 다소 표면적이라, 본인의 한계를 인정하고 무엇을
              배웠는지 더 깊이 있게 표현하면 신뢰감이 올라갈 것입니다.
            </Text>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Divider />

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Button
          component={Link}
          href="/interview"
          variant="subtle"
          color="dark"
          leftSection={<IconArrowLeft size={16} />}
        >
          면접 다시보기
        </Button>
        <Group gap="sm" wrap="wrap">
          <Button
            variant="default"
            leftSection={<IconDownload size={14} />}
          >
            PDF 다운로드
          </Button>
          <Button
            component={Link}
            href="/analyze"
            color="brand"
            leftSection={<IconRefresh size={14} />}
          >
            약점 보완 재면접
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
