"use client";

import {
  Stack,
  Group,
  Button,
  Text,
  Progress,
  rem,
  FileButton,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconUpload,
  IconFileTypePdf,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { PageContainer } from "../components/PageContainer";
import { StepFooter } from "../components/StepFooter";
import classes from "./resume.module.css";

const rubric = [
  { label: "직무 기술 역량", weight: 30 },
  { label: "인재상 부합도", weight: 25 },
  { label: "문제 해결 능력", weight: 25 },
  { label: "커뮤니케이션", weight: 20 },
];

type Category = "intro" | "technical" | "behavioral" | "culture";

const categoryMeta: Record<Category, { label: string; color: string }> = {
  intro: { label: "Intro", color: "var(--mantine-color-brand-5)" },
  technical: { label: "Technical", color: "var(--mantine-color-teal-5)" },
  behavioral: { label: "Behavioral", color: "var(--mantine-color-yellow-6)" },
  culture: { label: "Culture", color: "var(--mantine-color-pink-5)" },
};

const questions: { category: Category; text: string }[] = [
  { category: "intro", text: "간단한 자기소개 부탁드립니다." },
  { category: "intro", text: "토스에 지원하신 동기는 무엇인가요?" },
  {
    category: "technical",
    text: "React에서 렌더링 최적화를 어떻게 하셨는지 경험을 들려주세요.",
  },
  { category: "technical", text: "TypeScript 제네릭을 활용한 사례가 있나요?" },
  {
    category: "behavioral",
    text: "팀에서 갈등이 있었던 경험과 해결 방법을 말씀해주세요.",
  },
  {
    category: "culture",
    text: "‘사용자 중심’이라는 가치를 본인 경험에 비춰 설명해주세요.",
  },
  {
    category: "technical",
    text: "Next.js의 서버/클라이언트 컴포넌트 차이와 각자 언제 쓰는지 설명해주세요.",
  },
  {
    category: "behavioral",
    text: "기술 의사결정에서 본인 의견이 받아들여지지 않았던 경험과 대응 방식은?",
  },
  {
    category: "technical",
    text: "성능 측정 도구(Lighthouse, web-vitals 등)를 실무에서 어떻게 활용했나요?",
  },
  {
    category: "culture",
    text: "데이터 기반 의사결정 사례를 구체적인 지표와 함께 말해주세요.",
  },
];

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <PageContainer size="lg">
      <Stack gap={48}>
        <PageHeader
          step={2}
          title="이력서 분석 + 질문 생성"
          description="이력서를 업로드하면 회사 분석 결과와 결합해 평가표·맞춤 질문을 자동 생성합니다."
        />

        <Stack gap="md">
          <Group justify="space-between" align="end">
            <Text fz="md" fw={700}>
              이력서
            </Text>
            {file && (
              <Button
                variant="subtle"
                size="compact-sm"
                color="dark"
                leftSection={<IconX size={14} />}
                onClick={() => setFile(null)}
              >
                제거
              </Button>
            )}
          </Group>

          {file ? (
            <Box
              p="md"
              style={{
                border: `1px solid var(--mantine-color-gray-2)`,
                borderRadius: rem(6),
              }}
            >
              <Group gap="md" wrap="nowrap">
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    background: "var(--mantine-color-brand-0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconFileTypePdf
                    size={20}
                    color="var(--mantine-color-brand-6)"
                  />
                </Box>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text fz="sm" fw={600} truncate>
                    {file.name}
                  </Text>
                  <Text fz="xs" c="dimmed">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · 업로드 완료
                  </Text>
                </Stack>
                <Group gap={4} wrap="nowrap">
                  <IconCheck size={16} color="var(--mantine-color-success-6)" />
                  <Text fz="xs" c="success.7" fw={600}>
                    분석 완료
                  </Text>
                </Group>
              </Group>
            </Box>
          ) : (
            <FileButton onChange={setFile} accept="application/pdf">
              {(props) => (
                <Box
                  {...props}
                  p={32}
                  style={{
                    border: `1px dashed var(--mantine-color-gray-3)`,
                    borderRadius: rem(6),
                    background: "var(--mantine-color-gray-0)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition:
                      "background var(--duration-sm) var(--ease-out), border-color var(--duration-sm) var(--ease-out)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--mantine-color-brand-0)";
                    e.currentTarget.style.borderColor =
                      "var(--mantine-color-brand-3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "var(--mantine-color-gray-0)";
                    e.currentTarget.style.borderColor =
                      "var(--mantine-color-gray-3)";
                  }}
                >
                  <Stack align="center" gap={6}>
                    <IconUpload
                      size={20}
                      color="var(--mantine-color-gray-6)"
                    />
                    <Text fz="sm" fw={500}>
                      PDF 파일을 끌어다 놓거나 클릭해서 업로드
                    </Text>
                    <Text fz="xs" c="dimmed">
                      최대 10MB · PDF 형식만 지원
                    </Text>
                  </Stack>
                </Box>
              )}
            </FileButton>
          )}
        </Stack>

        <Stack gap="sm">
          <Group justify="space-between" align="end">
            <Text fz="md" fw={700}>
              평가표
            </Text>
            <Text fz="xs" c="dimmed">
              회사 분석 + 이력서 기반 자동 생성
            </Text>
          </Group>
          <Stack gap="md">
            {rubric.map((r) => (
              <Stack key={r.label} gap={6}>
                <Group justify="space-between">
                  <Text fz="sm">{r.label}</Text>
                  <Text fz="sm" c="dimmed" ff="monospace">
                    {r.weight}점
                  </Text>
                </Group>
                <Progress
                  value={r.weight}
                  color="brand"
                  size="xs"
                  radius="xl"
                />
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Stack gap={0}>
          <Group justify="space-between" align="end" mb="xs">
            <Text fz="md" fw={700}>
              생성된 질문
            </Text>
            <Text fz="xs" c="dimmed" ff="monospace">
              {questions.length} QUESTIONS
            </Text>
          </Group>
          <Divider />
          {questions.map((q, i) => {
            const meta = categoryMeta[q.category];
            return (
              <Box key={i}>
                <Box className={classes.row}>
                  <Group gap="xl" align="flex-start" wrap="nowrap">
                    <Text
                      ff="monospace"
                      fz="xs"
                      c="dimmed"
                      fw={600}
                      style={{ minWidth: 40, paddingTop: 3 }}
                    >
                      Q{String(i + 1).padStart(2, "0")}
                    </Text>
                    <Stack gap={6} style={{ flex: 1 }}>
                      <Text
                        fz={11}
                        fw={600}
                        c="dimmed"
                        style={{
                          letterSpacing: 0.8,
                          textTransform: "uppercase",
                        }}
                      >
                        <span
                          className={classes.dot}
                          style={{ background: meta.color }}
                        />
                        {meta.label}
                      </Text>
                      <Text fz="sm" lh={1.6}>
                        {q.text}
                      </Text>
                    </Stack>
                  </Group>
                </Box>
                <Divider />
              </Box>
            );
          })}
        </Stack>

        <StepFooter
          prevHref="/analyze"
          nextHref="/interview"
          nextLabel="면접 시작하기"
        />
      </Stack>
    </PageContainer>
  );
}
