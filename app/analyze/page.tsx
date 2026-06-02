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
  Alert,
} from "@mantine/core";
import { IconSparkles, IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { PageContainer } from "../components/PageContainer";
import { StepFooter } from "../components/StepFooter";
import { analysis, ensureAuth, ApiError } from "../lib/api";
import { setSessionId, getSessionId } from "../lib/store";
import type { AnalysisSseEvent, CompanyAnalysis } from "../lib/types";

type LogLine = { tag: string; text: string; success?: boolean };

const eventToLog = (e: AnalysisSseEvent): LogLine | null => {
  switch (e.type) {
    case "searching":
      return { tag: "search", text: `${e.purpose} — ${e.query}` };
    case "search_done":
      return { tag: "search", text: `${e.purpose} · ${e.count}건 수집` };
    case "fetching":
      return { tag: "fetch", text: `${e.purpose} — ${e.url}` };
    case "fetch_done":
      return {
        tag: "fetch",
        text: `${e.purpose} · ${e.success ? `${e.length}자` : "실패"}`,
      };
    case "saving":
      return { tag: "save", text: e.message };
    case "template_saved":
      return { tag: "eval", text: "평가표 생성·저장 완료" };
    case "cached":
      return { tag: "done", text: "기존 분석 결과 사용", success: true };
    case "complete":
      return { tag: "done", text: "분석 완료", success: true };
    case "error":
      return { tag: "error", text: e.message };
    default:
      return null;
  }
};

// CompanyAnalysis → 화면용 카테고리 묶음
const buildFindings = (a: CompanyAnalysis) =>
  [
    { label: "인재상", items: a.talents },
    { label: "기술 스택", items: a.techStack },
    { label: "면접 스타일", items: a.interviewStyle },
    { label: "문화 키워드", items: a.cultureKeywords },
  ].filter((f) => Array.isArray(f.items) && f.items.length > 0);

export default function AnalyzePage() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [extra, setExtra] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [result, setResult] = useState<CompanyAnalysis | null>(null);
  const logViewport = useRef<HTMLDivElement | null>(null);

  // 새로고침해도 직전 분석 결과를 다시 보여준다.
  useEffect(() => {
    ensureAuth().catch(() => {});
    const sid = getSessionId();
    if (!sid) return;
    analysis
      .get(sid)
      .then((a) => {
        setResult(a);
        setCompany(a.companyName);
        setRole(a.jobRole);
        if (a.rawAdditionalInfo) setExtra(a.rawAdditionalInfo);
        setDone(true);
        setLogs([{ tag: "done", text: "기존 분석 결과 불러옴", success: true }]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    logViewport.current?.scrollTo({ top: 999999 });
  }, [logs]);

  const start = async () => {
    if (!company.trim() || !role.trim()) {
      setError("회사명과 지원 직무를 입력해 주세요.");
      return;
    }
    setAnalyzing(true);
    setDone(false);
    setError(null);
    setLogs([{ tag: "agent", text: `${company} · ${role} 분석 시작` }]);
    setResult(null);

    try {
      await analysis.start(
        {
          companyName: company.trim(),
          jobRole: role.trim(),
          additionalInfo: extra.trim() || undefined,
        },
        (event) => {
          const line = eventToLog(event);
          if (line) setLogs((prev) => [...prev, line]);

          if (event.type === "complete" || event.type === "cached") {
            setSessionId(event.sessionId);
            setResult(event.data);
            setDone(true);
          }
          if (event.type === "error") {
            setError(event.message);
          }
        },
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "분석 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const findings = result ? buildFindings(result) : [];

  return (
    <PageContainer size="lg">
      <Stack gap={48}>
        <PageHeader
          step={1}
          title="회사 분석"
          description="웹 검색 Agent가 회사의 인재상·기술스택·면접후기·문화를 자동 수집합니다."
        />

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
          <Text fz="md" fw={700}>
            회사 정보
          </Text>
          <Group gap="md" grow align="flex-start">
            <TextInput
              label="회사명"
              placeholder="예: 토스"
              value={company}
              onChange={(e) => setCompany(e.currentTarget.value)}
              disabled={analyzing}
            />
            <TextInput
              label="지원 직무"
              placeholder="예: 프론트엔드 엔지니어"
              value={role}
              onChange={(e) => setRole(e.currentTarget.value)}
              disabled={analyzing}
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
            disabled={analyzing}
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
            <ScrollArea h={180} viewportRef={logViewport}>
              {logs.length === 0 ? (
                <Text fz="xs" c="dimmed" ff="monospace">
                  분석을 시작하면 진행 상황이 여기에 표시됩니다.
                </Text>
              ) : (
                <Stack gap={8} ff="monospace">
                  {logs.map((line, i) => (
                    <Group key={i} gap={12} wrap="nowrap" align="baseline">
                      <Text fz="xs" c="dimmed" style={{ minWidth: 24 }}>
                        {String(i + 1).padStart(2, "0")}
                      </Text>
                      <Text
                        fz="xs"
                        fw={600}
                        style={{
                          minWidth: 64,
                          color:
                            line.tag === "error"
                              ? "var(--mantine-color-red-6)"
                              : line.success
                                ? "var(--mantine-color-success-7)"
                                : "var(--mantine-color-brand-6)",
                        }}
                      >
                        {line.tag}
                      </Text>
                      <Text fz="xs" c="dark.7" style={{ wordBreak: "break-all" }}>
                        {line.text}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              )}
            </ScrollArea>
          </Box>
        </Stack>

        {result && (
          <>
            {(result.companySummary || result.jobRoleSummary) && (
              <Stack gap="sm">
                <Text fz="md" fw={700}>
                  요약
                </Text>
                {result.companySummary && (
                  <Text fz="sm" c="dark.7" lh={1.65}>
                    {result.companySummary}
                  </Text>
                )}
                {result.jobRoleSummary && (
                  <Text fz="sm" c="dark.6" lh={1.65}>
                    {result.jobRoleSummary}
                  </Text>
                )}
              </Stack>
            )}

            <Stack gap={0}>
              <Group justify="space-between" align="end" mb="xs">
                <Text fz="md" fw={700}>
                  수집 결과
                </Text>
                <Text fz="xs" c="dimmed">
                  출처 {result.searchSources?.length ?? 0}건 · 신뢰도{" "}
                  {result.confidenceScore}
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
          </>
        )}

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
