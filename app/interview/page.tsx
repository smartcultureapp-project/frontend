"use client";

import {
  Stack,
  Group,
  Text,
  Avatar,
  Indicator,
  Progress,
  ScrollArea,
  ActionIcon,
  Button,
  Box,
  Divider,
  rem,
  Tooltip,
} from "@mantine/core";
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconCheck,
  IconPlayerStopFilled,
  IconArrowRight,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import classes from "./interview.module.css";

type Interviewer = {
  id: string;
  name: string;
  role: string;
};

const interviewers: Interviewer[] = [
  { id: "A", name: "김주현", role: "주면접관" },
  { id: "B", name: "박지훈", role: "기술면접관" },
  { id: "C", name: "이수민", role: "인사담당관" },
];

const sampleAnswer =
  "네, 안녕하세요. 3년차 프론트엔드 개발자 홍길동입니다. 주로 React와 TypeScript를 사용해 사내 어드민과 사용자 서비스를 개발했고, 최근에는 Next.js 기반 SSR 프로젝트에서 성능 최적화와 디자인 시스템 구축을 담당했습니다.";

const questions = [
  {
    interviewer: interviewers[0],
    text: "안녕하세요. 오늘 면접에 와주셔서 감사합니다. 먼저 간단하게 자기소개 부탁드립니다.",
  },
  {
    interviewer: interviewers[1],
    text: "최근 프로젝트에서 React 성능 최적화를 위해 어떤 방법을 적용해보셨나요?",
  },
  {
    interviewer: interviewers[2],
    text: "팀 내 의사결정 과정에서 본인의 의견이 받아들여지지 않았을 때 어떻게 대처하셨나요?",
  },
];

export default function InterviewPage() {
  const [qIndex, setQIndex] = useState(0);
  const [recording, setRecording] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [camError, setCamError] = useState<string | null>(null);
  const [camReady, setCamReady] = useState(false);
  const tickRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const current = questions[qIndex];

  useEffect(() => {
    if (!recording) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    setTranscript("");
    let i = 0;
    tickRef.current = window.setInterval(() => {
      i += 1;
      if (i > sampleAnswer.length) {
        if (tickRef.current) window.clearInterval(tickRef.current);
        return;
      }
      setTranscript(sampleAnswer.slice(0, i));
    }, 35);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [recording, qIndex]);

  useEffect(() => {
    if (!cameraOn) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
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
          videoRef.current
            .play()
            .then(() => setCamReady(true))
            .catch(() => setCamReady(true));
        }
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        if (err.name === "NotAllowedError") {
          setCamError("카메라 권한이 거부되었어요");
        } else if (err.name === "NotFoundError") {
          setCamError("연결된 카메라를 찾을 수 없어요");
        } else {
          setCamError("카메라를 열 수 없어요");
        }
      });

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOn]);

  const next = () => {
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      setTranscript("");
    }
  };

  const totalQuestions = 10;
  const progress = ((qIndex + 1) / totalQuestions) * 100;

  return (
    <Box className={classes.shell}>
      <Group justify="space-between" px="lg" py="sm" className={classes.topbar}>
        <Group gap="md">
          <Text fz="sm" fw={700}>
            면접 진행 중
          </Text>
          <Text fz="sm" c="dimmed" ff="monospace">
            {String(qIndex + 1).padStart(2, "0")} / {totalQuestions}
          </Text>
        </Group>
        <Group gap="xs">
          <Box className={classes.recDot} />
          <Text fz="xs" c="dimmed" fw={600} style={{ letterSpacing: 0.8 }}>
            REC · 12:34
          </Text>
        </Group>
        <Button
          component="a"
          href="/report"
          color="dark"
          size="sm"
          rightSection={<IconArrowRight size={14} />}
        >
          면접 종료
        </Button>
      </Group>

      <Box px="lg" pt={4} pb={4}>
        <Progress value={progress} color="dark" size={3} radius={0} />
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
              <Box className={`${classes.bar} ${recording ? classes.barOn : ""}`} />
              <Box className={`${classes.bar} ${recording ? classes.barOn : ""}`} style={{ animationDelay: "0.1s" }} />
              <Box className={`${classes.bar} ${recording ? classes.barOn : ""}`} style={{ animationDelay: "0.2s" }} />
              <Box className={`${classes.bar} ${recording ? classes.barOn : ""}`} style={{ animationDelay: "0.15s" }} />
              <Box className={`${classes.bar} ${recording ? classes.barOn : ""}`} style={{ animationDelay: "0.05s" }} />
            </Box>

            <Box className={classes.interviewerStrip}>
              {interviewers.map((p) => {
                const speaking = current.interviewer.id === p.id;
                return (
                  <Indicator
                    key={p.id}
                    color="success.5"
                    size={8}
                    offset={3}
                    processing
                    disabled={!speaking}
                  >
                    <Tooltip label={`${p.name} · ${p.role}`} withArrow>
                      <Avatar
                        size="md"
                        radius="xl"
                        color={speaking ? "brand" : "dark"}
                        styles={{
                          placeholder: {
                            fontWeight: 700,
                            border: speaking
                              ? "2px solid white"
                              : "2px solid transparent",
                          },
                        }}
                      >
                        {p.id}
                      </Avatar>
                    </Tooltip>
                  </Indicator>
                );
              })}
            </Box>
          </Box>

          <Group justify="center" gap="md" mt="md">
            <Tooltip label={recording ? "음성 인식 중지" : "음성 인식 시작"}>
              <ActionIcon
                size={48}
                radius="xl"
                color={recording ? "red" : "gray"}
                variant="filled"
                onClick={() => setRecording((r) => !r)}
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
                {cameraOn ? (
                  <IconVideo size={20} />
                ) : (
                  <IconVideoOff size={20} />
                )}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="다음 질문으로">
              <ActionIcon
                size={48}
                radius="xl"
                color="dark"
                variant="filled"
                onClick={next}
                disabled={qIndex >= questions.length - 1}
              >
                <IconPlayerStopFilled size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>

        <Box className={classes.panel}>
          <Box className={classes.questionSection} key={qIndex}>
            <Text
              fz={11}
              c="brand.6"
              fw={700}
              ff="monospace"
              style={{ letterSpacing: 1 }}
            >
              Q{String(qIndex + 1).padStart(2, "0")}
            </Text>
            <Text fz={18} lh={1.65} fw={500} mt={10} c="dark.9">
              {current.text}
            </Text>
            <Text fz="xs" c="dimmed" mt={14}>
              — {current.interviewer.name}, {current.interviewer.role}
            </Text>
          </Box>

          <Divider />

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
              {recording ? (
                <Group gap={5} align="center">
                  <Box className={classes.recIndicator} />
                  <Text fz={11} c="red.7" fw={600}>
                    음성 인식 중
                  </Text>
                </Group>
              ) : (
                <Text fz={11} c="dimmed" fw={600}>
                  일시 정지
                </Text>
              )}
            </Group>
            <ScrollArea h={240} type="auto" offsetScrollbars>
              {transcript ? (
                <Text fz="sm" lh={1.75} c="dark.8">
                  {transcript}
                  {recording && <span className={classes.cursor}>|</span>}
                </Text>
              ) : (
                <Text fz="sm" c="dimmed" lh={1.75}>
                  마이크 버튼을 눌러 답변을 시작하세요. 인식된 음성이 여기에
                  실시간으로 표시됩니다.
                </Text>
              )}
            </ScrollArea>
            <Group justify="space-between" mt="md" pt="sm" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
              <Text fz={11} c="dimmed" ff="monospace">
                {transcript.length} 자
              </Text>
              <Button
                size="xs"
                variant="subtle"
                color="brand"
                disabled={!transcript || qIndex >= questions.length - 1}
                onClick={next}
              >
                답변 완료 →
              </Button>
            </Group>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
