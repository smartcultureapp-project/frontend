"use client";

import {
  Stack,
  TextInput,
  Textarea,
  Group,
  Button,
  Text,
  ScrollArea,
  Divider,
  Box,
  rem,
  Loader,
} from "@mantine/core";
import { IconSparkles, IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { PageContainer } from "../components/PageContainer";
import { StepFooter } from "../components/StepFooter";

const streamLines = [
  { tag: "agent", text: "회사 분석 시작" },
  { tag: "search", text: "Brave API · 18건 결과 수집" },
  { tag: "extract", text: "인재상 키워드 5개 추출" },
  { tag: "extract", text: "기술스택 12개 추출" },
  { tag: "extract", text: "면접 후기 8건 수집" },
  { tag: "save", text: "PostgreSQL 저장 완료" },
  { tag: "eval", text: "평가표 초안 생성" },
  { tag: "done", text: "분석 완료", success: true },
];

const findings: { label: string; items: string[] }[] = [
  {
    label: "인재상",
    items: ["도전 정신", "사용자 중심 사고", "데이터 기반 의사결정"],
  },
  {
    label: "기술 스택",
    items: ["React", "TypeScript", "Next.js", "GraphQL"],
  },
  {
    label: "면접 스타일",
    items: ["실무 시나리오 중심", "깊이 있는 꼬리질문"],
  },
];

export default function AnalyzePage() {
  const [company, setCompany] = useState("토스 (Toss)");
  const [role, setRole] = useState("프론트엔드 엔지니어");
  const [extra, setExtra] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(true);

  const start = () => {
    setAnalyzing(true);
    setDone(false);
    setTimeout(() => {
      setAnalyzing(false);
      setDone(true);
    }, 1500);
  };

  return (
    <PageContainer size="lg">
    <Stack gap={48}>
      <PageHeader
        step={1}
        title="회사 분석"
        description="웹 검색 Agent가 회사의 인재상·기술스택·면접후기·문화를 자동 수집합니다."
      />

      <Stack gap="md">
        <Text fz="md" fw={700}>
          회사 정보
        </Text>
        <Group gap="md" grow align="flex-start">
          <TextInput
            label="회사명"
            placeholder="예: 토스"
            value={company}
            onChange={(e) => setCompany(e.currentTarget.value)}
          />
          <TextInput
            label="지원 직무"
            placeholder="예: 프론트엔드 엔지니어"
            value={role}
            onChange={(e) => setRole(e.currentTarget.value)}
          />
        </Group>
        <Textarea
          label="추가 정보"
          description="알고 있는 회사 정보가 있다면 입력해 주세요"
          placeholder="자유롭게 입력"
          minRows={2}
          autosize
          value={extra}
          onChange={(e) => setExtra(e.currentTarget.value)}
        />
        <Group justify="flex-end" mt={4}>
          <Button
            color="brand"
            leftSection={<IconSparkles size={14} />}
            loading={analyzing}
            onClick={start}
          >
            분석 시작
          </Button>
        </Group>
      </Stack>

      <Stack gap="sm">
        <Group justify="space-between" align="end">
          <Text fz="md" fw={700}>
            분석 로그
          </Text>
          {analyzing ? (
            <Group gap={6}>
              <Loader size={10} color="brand" />
              <Text fz="xs" c="brand.6" ff="monospace" fw={600}>
                RUNNING
              </Text>
            </Group>
          ) : done ? (
            <Group gap={4}>
              <IconCheck size={12} color="var(--mantine-color-success-6)" />
              <Text fz="xs" c="success.7" ff="monospace" fw={600}>
                COMPLETE
              </Text>
            </Group>
          ) : (
            <Text fz="xs" c="dimmed" ff="monospace">
              IDLE
            </Text>
          )}
        </Group>
        <Box
          p="md"
          style={{
            border: `1px solid var(--mantine-color-gray-2)`,
            borderRadius: rem(6),
            background: "var(--mantine-color-gray-0)",
          }}
        >
          <ScrollArea h={180}>
            <Stack gap={8} ff="monospace">
              {streamLines.map((line, i) => (
                <Group key={i} gap={12} wrap="nowrap" align="baseline">
                  <Text fz="xs" c="dimmed" style={{ minWidth: 24 }}>
                    {String(i + 1).padStart(2, "0")}
                  </Text>
                  <Text
                    fz="xs"
                    fw={600}
                    style={{
                      minWidth: 64,
                      color: line.success
                        ? "var(--mantine-color-success-7)"
                        : "var(--mantine-color-brand-6)",
                    }}
                  >
                    {line.tag}
                  </Text>
                  <Text fz="xs" c="dark.7">
                    {line.text}
                  </Text>
                </Group>
              ))}
            </Stack>
          </ScrollArea>
        </Box>
      </Stack>

      <Stack gap={0}>
        <Group justify="space-between" align="end" mb="xs">
          <Text fz="md" fw={700}>
            수집 결과
          </Text>
          <Text fz="xs" c="dimmed">
            출처 18건 기반
          </Text>
        </Group>
        <Divider />
        {findings.map((f) => (
          <Box key={f.label}>
            <Box py={20} px={4}>
              <Group gap="xl" align="flex-start" wrap="nowrap">
                <Text
                  fz={11}
                  fw={600}
                  c="dimmed"
                  ff="monospace"
                  style={{
                    minWidth: 100,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    paddingTop: 3,
                  }}
                >
                  {f.label}
                </Text>
                <Group gap={8} style={{ flex: 1 }}>
                  {f.items.map((item) => (
                    <Box
                      key={item}
                      px={10}
                      py={4}
                      style={{
                        border: `1px solid var(--mantine-color-gray-2)`,
                        borderRadius: rem(999),
                        fontSize: rem(13),
                      }}
                    >
                      {item}
                    </Box>
                  ))}
                </Group>
              </Group>
            </Box>
            <Divider />
          </Box>
        ))}
      </Stack>

      <StepFooter
        prevHref="/"
        prevLabel="홈"
        nextHref="/resume"
        nextLabel="이력서 업로드"
      />
    </Stack>
    </PageContainer>
  );
}
