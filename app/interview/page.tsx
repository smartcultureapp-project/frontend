"use client";

import {
  Stack,
  Group,
  Text,
  Avatar,
  ScrollArea,
  ActionIcon,
  Button,
  Box,
  Divider,
  Textarea,
  Tooltip,
  Alert,
  Loader,
} from "@mantine/core";
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconCheck,
  IconArrowRight,
  IconAlertCircle,
  IconSend,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import classes from "./interview.module.css";
import { sessions, ensureAuth, ApiError } from "../lib/api";
import { getSessionId } from "../lib/store";
import type { AnswerFeedback, NextQuestion } from "../lib/types";

const interviewers = [
  { id: "A", name: "김주현", role: "주면접관" },
  { id: "B", name: "박지훈", role: "기술면접관" },
  { id: "C", name: "이수민", role: "인사담당관" },
];

const TOTAL_QUESTIONS = 10;

// 브라우저 SpeechRecognition (표준 타입 미제공 → 최소 정의)
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
};
type SpeechWindow = {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export default function InterviewPage() {
  const router = useRouter();

  const [sessionId, setSid] = useState<string | null>(null);
  const [current, setCurrent] = useState<NextQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loadingQ, setLoadingQ] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [camError, setCamError] = useState<string | null>(null);
  const [camReady, setCamReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // 세션 로드 + 진행 중인 질문 복구(없으면 첫 질문 생성)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureAuth().catch(() => {});
      const sid = getSessionId();
      if (cancelled) return;
      setSid(sid);
      if (!sid) {
        setError("진행 중인 세션이 없습니다. 먼저 회사 분석을 완료해 주세요.");
        return;
      }
      try {
        const turns = await sessions.listTurns(sid);
        if (cancelled) return;
        setAnsweredCount(turns.filter((t) => t.answer).length);
        const pending = turns.find((t) => t.question && !t.answer);
        if (pending) {
          setCurrent({
            turnId: pending.id,
            question: pending.question,
            turnIndex: pending.turnIndex,
          });
        } else {
          await loadNextQuestion(sid);
        }
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "세션을 불러오지 못했습니다.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 웹캠
  useEffect(() => {
    if (!cameraOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamReady(false);
      setCamError(null);
      return;
    }

    let cancelled = false;
    setCamError(null);
    setCamReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("이 브라우저는 카메라 접근을 지원하지 않아요");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(
            () => setCamReady(true),
            () => setCamReady(true),
          );
        }
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        if (err.name === "NotAllowedError") setCamError("카메라 권한이 거부되었어요");
        else if (err.name === "NotFoundError")
          setCamError("연결된 카메라를 찾을 수 없어요");
        else setCamError("카메라를 열 수 없어요");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOn]);

  // 음성 인식 (지원 시) — 인식 결과를 답변 텍스트에 이어붙임
  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const w = window as unknown as SpeechWindow;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError(
        "이 브라우저는 음성 인식을 지원하지 않습니다. 아래 입력창에 직접 답변을 작성해 주세요.",
      );
      return;
    }

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) chunk += e.results[i][0].transcript;
      }
      if (chunk) setAnswer((prev) => (prev ? `${prev} ${chunk}` : chunk).trim());
    };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const loadNextQuestion = async (sid: string) => {
    setLoadingQ(true);
    setError(null);
    try {
      const q = await sessions.nextQuestion(sid);
      setCurrent(q);
      setAnswer("");
      setFeedback(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "질문을 가져오지 못했습니다.",
      );
    } finally {
      setLoadingQ(false);
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !answer.trim()) return;
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    }
    setSubmitting(true);
    setError(null);
    try {
      const fb = await sessions.submitAnswer(sessionId, answer.trim());
      setFeedback(fb);
      setAnsweredCount((c) => c + 1);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "답변 제출에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const endInterview = async () => {
    if (sessionId) {
      await sessions.patch(sessionId, { phase: "DONE" }).catch(() => {});
    }
    router.push("/report");
  };

  const number = Math.min(answeredCount + 1, TOTAL_QUESTIONS);
  const progress = (number / TOTAL_QUESTIONS) * 100;
  const reachedLimit = answeredCount >= TOTAL_QUESTIONS;

  return (
    <Box className={classes.shell}>
      <Group justify="space-between" px="lg" py="sm" className={classes.topbar}>
        <Group gap="md">
          <Text fz="sm" fw={700}>
            면접 진행 중
          </Text>
          <Text fz="sm" c="dimmed" ff="monospace">
            {String(number).padStart(2, "0")} / {TOTAL_QUESTIONS}
          </Text>
        </Group>
        <Group gap="xs">
          <Box className={classes.recDot} />
          <Text fz="xs" c="dimmed" fw={600} style={{ letterSpacing: 0.8 }}>
            {recording ? "REC" : "READY"}
          </Text>
        </Group>
        <Button
          color="dark"
          size="sm"
          rightSection={<IconArrowRight size={14} />}
          onClick={endInterview}
        >
          면접 종료
        </Button>
      </Group>

      <Box px="lg" pt={4} pb={4}>
        <Box
          style={{
            height: 3,
            background: "var(--mantine-color-gray-2)",
            borderRadius: 0,
          }}
        >
          <Box
            style={{
              height: 3,
              width: `${progress}%`,
              background: "var(--mantine-color-dark-6)",
              transition: "width var(--duration-md, 240ms) ease-out",
            }}
          />
        </Box>
      </Box>

      <Box className={classes.main}>
        <Box className={classes.camArea}>
          <Box className={classes.camFeed}>
            <video
              ref={videoRef}
              className={classes.video}
              data-on={cameraOn && camReady && !camError ? "true" : undefined}
              autoPlay
              muted
              playsInline
            />
            {!cameraOn && (
              <Stack align="center" gap={4} c="gray.6">
                <IconVideoOff size={48} stroke={1.5} />
                <Text fz="xs">카메라 꺼짐</Text>
              </Stack>
            )}
            {cameraOn && camError && (
              <Stack align="center" gap={6} c="red.4" px="md" maw={320}>
                <IconAlertCircle size={48} stroke={1.5} />
                <Text fz="sm" fw={600} ta="center">
                  {camError}
                </Text>
                <Text fz="xs" c="gray.5" ta="center">
                  주소창의 자물쇠 아이콘에서 카메라 권한을 허용해 주세요
                </Text>
              </Stack>
            )}
            {cameraOn && !camError && !camReady && (
              <Stack align="center" gap={4} c="gray.6">
                <IconVideo size={32} stroke={1.5} />
                <Text fz="xs">카메라 연결 중…</Text>
              </Stack>
            )}

            <Box className={classes.poseChip}>
              <IconCheck size={12} />
              <Text fz="xs" fw={600}>
                자세 양호
              </Text>
            </Box>

            <Box className={classes.micLevel}>
              {[0.1, 0.2, 0.15, 0.05, 0.12].map((d, i) => (
                <Box
                  key={i}
                  className={`${classes.bar} ${recording ? classes.barOn : ""}`}
                  style={{ animationDelay: `${d}s` }}
                />
              ))}
            </Box>

            <Box className={classes.interviewerStrip}>
              {interviewers.map((p) => (
                <Tooltip key={p.id} label={`${p.name} · ${p.role}`} withArrow>
                  <Avatar
                    size="md"
                    radius="xl"
                    color="dark"
                    styles={{ placeholder: { fontWeight: 700 } }}
                  >
                    {p.id}
                  </Avatar>
                </Tooltip>
              ))}
            </Box>
          </Box>

          <Group justify="center" gap="md" mt="md">
            <Tooltip label={recording ? "음성 인식 중지" : "음성 인식 시작"}>
              <ActionIcon
                size={48}
                radius="xl"
                color={recording ? "red" : "gray"}
                variant="filled"
                onClick={toggleRecording}
              >
                {recording ? (
                  <IconMicrophone size={20} />
                ) : (
                  <IconMicrophoneOff size={20} />
                )}
              </ActionIcon>
            </Tooltip>
            <Tooltip label={cameraOn ? "카메라 끄기" : "카메라 켜기"}>
              <ActionIcon
                size={48}
                radius="xl"
                color="gray"
                variant={cameraOn ? "light" : "filled"}
                onClick={() => setCameraOn((c) => !c)}
              >
                {cameraOn ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>

        <Box className={classes.panel}>
          {error && (
            <Alert
              color="red"
              variant="light"
              icon={<IconAlertCircle size={16} />}
              mb="md"
            >
              {error}
            </Alert>
          )}

          <Box className={classes.questionSection} key={current?.turnId}>
            <Text
              fz={11}
              c="brand.6"
              fw={700}
              ff="monospace"
              style={{ letterSpacing: 1 }}
            >
              Q{String(number).padStart(2, "0")}
            </Text>
            {loadingQ ? (
              <Group gap={8} mt={10}>
                <Loader size={16} color="brand" />
                <Text fz="sm" c="dimmed">
                  질문 생성 중…
                </Text>
              </Group>
            ) : (
              <Text fz={18} lh={1.65} fw={500} mt={10} c="dark.9">
                {current?.question ?? "질문을 불러오는 중입니다."}
              </Text>
            )}
          </Box>

          <Divider />

          {feedback ? (
            <Box className={classes.transcriptSection}>
              <Group justify="space-between" mb={12}>
                <Text
                  fz={11}
                  c="dimmed"
                  fw={600}
                  ff="monospace"
                  style={{ letterSpacing: 1 }}
                >
                  피드백
                </Text>
                {feedback.score != null && (
                  <Text fz="sm" ff="monospace" fw={700} c="brand.6">
                    {feedback.score}
                    <Text component="span" c="dimmed" fz="sm" inherit>
                      /5
                    </Text>
                  </Text>
                )}
              </Group>
              <ScrollArea h={200} type="auto" offsetScrollbars>
                <Stack gap={14}>
                  {feedback.feedbackGood && (
                    <Box>
                      <Text fz={11} c="success.7" fw={700} mb={4}>
                        잘한 점
                      </Text>
                      <Text fz="sm" c="dark.7" lh={1.6}>
                        {feedback.feedbackGood}
                      </Text>
                    </Box>
                  )}
                  {feedback.feedbackImprove && (
                    <Box>
                      <Text fz={11} c="dark.5" fw={700} mb={4}>
                        보완할 점
                      </Text>
                      <Text fz="sm" c="dark.7" lh={1.6}>
                        {feedback.feedbackImprove}
                      </Text>
                    </Box>
                  )}
                  {feedback.betterAnswer && (
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
                        {feedback.betterAnswer}
                      </Text>
                    </Box>
                  )}
                </Stack>
              </ScrollArea>
              <Group justify="flex-end" mt="md" pt="sm" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
                {reachedLimit ? (
                  <Button color="brand" onClick={endInterview}>
                    리포트 보기 →
                  </Button>
                ) : (
                  <Button
                    color="brand"
                    loading={loadingQ}
                    onClick={() => sessionId && loadNextQuestion(sessionId)}
                  >
                    다음 질문 →
                  </Button>
                )}
              </Group>
            </Box>
          ) : (
            <Box className={classes.transcriptSection}>
              <Group justify="space-between" mb={12}>
                <Text
                  fz={11}
                  c="dimmed"
                  fw={600}
                  ff="monospace"
                  style={{ letterSpacing: 1 }}
                >
                  내 답변
                </Text>
                {recording && (
                  <Group gap={5} align="center">
                    <Box className={classes.recIndicator} />
                    <Text fz={11} c="red.7" fw={600}>
                      음성 인식 중
                    </Text>
                  </Group>
                )}
              </Group>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.currentTarget.value)}
                placeholder="마이크로 답하거나 여기에 직접 답변을 작성하세요."
                autosize
                minRows={8}
                maxRows={12}
                variant="unstyled"
                styles={{ input: { fontSize: 14, lineHeight: 1.75 } }}
                disabled={submitting || !current}
              />
              <Group
                justify="space-between"
                mt="md"
                pt="sm"
                style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
              >
                <Text fz={11} c="dimmed" ff="monospace">
                  {answer.length} 자
                </Text>
                <Button
                  size="xs"
                  color="brand"
                  rightSection={<IconSend size={13} />}
                  loading={submitting}
                  disabled={!answer.trim() || !current}
                  onClick={submitAnswer}
                >
                  답변 제출
                </Button>
              </Group>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
