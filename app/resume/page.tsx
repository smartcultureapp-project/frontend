"use client";

import {
  Stack,
  Group,
  Button,
  Text,
  Progress,
  Divider,
  Box,
  FileButton,
  Alert,
  Loader,
  rem,
} from "@mantine/core";
import {
  IconCheck,
  IconAlertCircle,
  IconSparkles,
  IconUpload,
  IconFileText,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { PageContainer } from "../components/PageContainer";
import { StepFooter } from "../components/StepFooter";
import classes from "./resume.module.css";
import { resume, evaluation, analysis, ensureAuth, ApiError } from "../lib/api";
import { getSessionId, getResumeId, setResumeId } from "../lib/store";
import type {
  ResumeAnalysis,
  EvaluationTemplate,
  CompanyAnalysis,
} from "../lib/types";

type RubricRow = { label: string; weight: number };

// 업로드한 파일에서 텍스트 추출 (PDF는 pdfjs, 그 외는 텍스트로 읽음).
// 백엔드는 rawText(문자열)만 받으므로 클라이언트에서 추출해 전송한다.
async function extractText(file: File): Promise<string> {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return (await file.text()).trim();
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" ") + "\n";
  }
  return text.trim();
}

// 평가 템플릿(stages[].sections[]) → 가중치 막대
function buildRubric(tmpl: EvaluationTemplate | null): RubricRow[] {
  const stages = tmpl?.template?.stages ?? tmpl?.stages ?? [];
  const rows: RubricRow[] = [];
  for (const stage of stages) {
    for (const section of stage.sections ?? []) {
      rows.push({ label: section.name, weight: section.weight });
    }
  }
  return rows;
}

export default function ResumePage() {
  const [sessionId, setSid] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [summaryReady, setSummaryReady] = useState(false);
  const [summaryTimedOut, setSummaryTimedOut] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeAnalysis | null>(null);
  const [rubric, setRubric] = useState<RubricRow[]>([]);
  const [questions, setQuestions] = useState<
    { category: string; text: string }[]
  >([]);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    ensureAuth().catch(() => {});
    const sid = getSessionId();
    setSid(sid);
    if (!sid) return;

    // 회사 분석에서 만든 평가표 + 기출/추천 질문 로드
    evaluation
      .bySession(sid)
      .then((t) => {
        if ("error" in t) return;
        setRubric(buildRubric(t));
      })
      .catch(() => {});

    analysis
      .get(sid)
      .then((a: CompanyAnalysis) => {
        const qs: { category: string; text: string }[] = [];
        (a.actualQuestions ?? []).forEach((q) =>
          qs.push({ category: "기출", text: q }),
        );
        (a.recommendedQuestionAngles ?? []).forEach((q) =>
          qs.push({ category: "추천 각도", text: q }),
        );
        setQuestions(qs);
      })
      .catch(() => {});

    // 이미 등록한 이력서가 있으면 요약을 다시 불러온다.
    const rid = getResumeId();
    if (rid) {
      resume
        .get(rid)
        .then((r) => {
          setResumeData(r);
          setRawText(r.rawText);
          setRegistered(true);
          if (r.summary) setSummaryReady(true);
          else pollSummary(rid);
        })
        .catch(() => {});
    }

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  // 백그라운드 AI 요약 폴링 (최대 ~80초, 그 뒤엔 타임아웃 처리해 무한 스피너 방지)
  const pollSummary = (id: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    setSummaryTimedOut(false);
    let attempts = 0;
    pollRef.current = window.setInterval(async () => {
      attempts += 1;
      try {
        const r = await resume.get(id);
        if (r.summary) {
          setResumeData(r);
          setSummaryReady(true);
          if (pollRef.current) window.clearInterval(pollRef.current);
          return;
        }
      } catch {
        /* 다음 틱에 재시도 */
      }
      if (attempts >= 40) {
        setSummaryTimedOut(true);
        if (pollRef.current) window.clearInterval(pollRef.current);
      }
    }, 2000);
  };

  // 파일 선택 → 텍스트 추출
  const onFile = async (f: File | null) => {
    setError(null);
    setFile(f);
    setRawText("");
    if (!f) return;
    setExtracting(true);
    try {
      const text = await extractText(f);
      if (!text) {
        setError(
          "파일에서 텍스트를 추출하지 못했습니다. (이미지로만 구성된 PDF일 수 있어요)",
        );
        return;
      }
      setRawText(text);
    } catch {
      setError("파일을 읽는 중 오류가 발생했습니다. 다른 파일로 시도해 주세요.");
    } finally {
      setExtracting(false);
    }
  };

  const submit = async () => {
    if (!rawText.trim()) {
      setError("이력서 파일을 업로드해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSummaryReady(false);
    try {
      const created = await resume.create({
        rawText: rawText.trim(),
        sessionId: sessionId ?? undefined,
      });
      setResumeId(created.id);
      setResumeData(created);
      setRegistered(true); // rawText 저장·세션 연결 완료 → 면접 시작 가능
      if (created.summary) setSummaryReady(true);
      else pollSummary(created.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "이력서 등록에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const summary = resumeData?.summary;

  return (
    <PageContainer size="lg">
      <Stack gap={48}>
        <PageHeader
          step={2}
          title="이력서 분석 + 질문 생성"
          description="이력서 내용을 입력하면 회사 분석 결과와 결합해 평가표·맞춤 질문을 준비합니다."
        />

        {!sessionId && (
          <Alert
            color="yellow"
            variant="light"
            icon={<IconAlertCircle size={16} />}
          >
            먼저 1단계 회사 분석을 진행하면 회사 맞춤 평가표·질문이 함께
            연결됩니다. 회사 분석 없이도 이력서만 등록할 수 있습니다.
          </Alert>
        )}

        {error && (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertCircle size={16} />}
            title="오류"
          >
            {error}
          </Alert>
        )}

        <Stack gap="md">
          <Group justify="space-between" align="end">
            <Text fz="md" fw={700}>
              이력서 파일
            </Text>
            {summaryReady && (
              <Group gap={4} wrap="nowrap">
                <IconCheck size={16} color="var(--mantine-color-success-6)" />
                <Text fz="xs" c="success.7" fw={600}>
                  분석 완료
                </Text>
              </Group>
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
                  <IconFileText size={20} color="var(--mantine-color-brand-6)" />
                </Box>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text fz="sm" fw={600} truncate>
                    {file.name}
                  </Text>
                  <Text fz="xs" c="dimmed">
                    {(file.size / 1024).toFixed(0)} KB
                    {extracting
                      ? " · 텍스트 추출 중…"
                      : rawText
                        ? ` · ${rawText.length.toLocaleString()}자 추출됨`
                        : ""}
                  </Text>
                </Stack>
                {extracting ? (
                  <Loader size={16} color="brand" />
                ) : (
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    color="dark"
                    leftSection={<IconX size={14} />}
                    onClick={() => onFile(null)}
                    disabled={submitting}
                  >
                    제거
                  </Button>
                )}
              </Group>
            </Box>
          ) : (
            <FileButton onChange={onFile} accept=".pdf,.txt,.md,application/pdf,text/plain">
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
                  }}
                >
                  <Stack align="center" gap={6}>
                    <IconUpload size={20} color="var(--mantine-color-gray-6)" />
                    <Text fz="sm" fw={500}>
                      이력서 파일을 클릭해서 업로드
                    </Text>
                    <Text fz="xs" c="dimmed">
                      PDF · TXT · MD 지원
                    </Text>
                  </Stack>
                </Box>
              )}
            </FileButton>
          )}

          <Group justify="flex-end">
            <Button
              color="brand"
              leftSection={<IconSparkles size={14} />}
              loading={submitting}
              disabled={!rawText || extracting}
              onClick={submit}
            >
              이력서 등록 · 분석
            </Button>
          </Group>

          {registered && (
            <Alert
              color="green"
              variant="light"
              icon={<IconCheck size={16} />}
            >
              <Text fz="sm">
                이력서가 등록되었어요. 지금 바로 <b>면접을 시작</b>할 수 있고,
                아래 AI 요약은 준비되는 대로 표시됩니다.
              </Text>
            </Alert>
          )}

          {registered && !summaryReady && !summaryTimedOut && (
            <Group gap={8}>
              <Loader size={12} color="brand" />
              <Text fz="xs" c="dimmed">
                AI가 이력서 요약을 생성하는 중입니다…
              </Text>
            </Group>
          )}

          {summaryTimedOut && !summaryReady && (
            <Text fz="xs" c="dimmed">
              AI 요약 생성이 지연되고 있어요. 요약 없이도 면접은 바로 시작할 수
              있습니다.
            </Text>
          )}
        </Stack>

        {summary && (
          <Stack gap="md">
            <Text fz="md" fw={700}>
              이력서 요약
            </Text>
            {summary.profile && (
              <Text fz="sm" c="dark.7">
                {[
                  summary.profile.title,
                  summary.profile.yearsOfExperience != null
                    ? `${summary.profile.yearsOfExperience}년차`
                    : null,
                  summary.profile.education,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            )}
            {summary.skills && summary.skills.length > 0 && (
              <Group gap={8}>
                {summary.skills.map((s) => (
                  <Box
                    key={s}
                    px={10}
                    py={4}
                    style={{
                      border: `1px solid var(--mantine-color-gray-2)`,
                      borderRadius: 999,
                      fontSize: 13,
                    }}
                  >
                    {s}
                  </Box>
                ))}
              </Group>
            )}
            {summary.interviewFocus && summary.interviewFocus.length > 0 && (
              <Stack gap={6}>
                <Text fz="xs" c="dimmed" fw={600}>
                  면접 집중 포인트
                </Text>
                {summary.interviewFocus.map((f) => (
                  <Text key={f} fz="sm" c="dark.6" lh={1.5}>
                    · {f}
                  </Text>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {rubric.length > 0 && (
          <Stack gap="sm">
            <Group justify="space-between" align="end">
              <Text fz="md" fw={700}>
                평가표
              </Text>
              <Text fz="xs" c="dimmed">
                회사 분석 기반 자동 생성
              </Text>
            </Group>
            <Stack gap="md">
              {rubric.map((r, i) => (
                <Stack key={`${r.label}-${i}`} gap={6}>
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
        )}

        {questions.length > 0 && (
          <Stack gap={0}>
            <Group justify="space-between" align="end" mb="xs">
              <Text fz="md" fw={700}>
                예상 질문
              </Text>
              <Text fz="xs" c="dimmed" ff="monospace">
                {questions.length} QUESTIONS
              </Text>
            </Group>
            <Divider />
            {questions.map((q, i) => (
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
                          style={{ background: "var(--mantine-color-brand-5)" }}
                        />
                        {q.category}
                      </Text>
                      <Text fz="sm" lh={1.6}>
                        {q.text}
                      </Text>
                    </Stack>
                  </Group>
                </Box>
                <Divider />
              </Box>
            ))}
          </Stack>
        )}

        <StepFooter
          prevHref="/analyze"
          nextHref="/interview"
          nextLabel="면접 시작하기"
        />
      </Stack>
    </PageContainer>
  );
}
