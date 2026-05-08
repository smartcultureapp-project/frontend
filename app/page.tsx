"use client";

import Link from "next/link";
import {
  Button,
  Group,
  Stack,
  Text,
  Title,
  Box,
  Divider,
} from "@mantine/core";
import { IconArrowRight, IconArrowUpRight } from "@tabler/icons-react";
import { PageContainer } from "./components/PageContainer";
import classes from "./page.module.css";

const steps = [
  {
    num: "01",
    href: "/analyze",
    title: "회사 분석",
    desc: "지원 회사의 인재상·기술스택·면접 후기를 웹에서 자동 수집",
    duration: "약 30초",
  },
  {
    num: "02",
    href: "/resume",
    title: "이력서 분석 + 질문 생성",
    desc: "이력서와 회사 정보를 결합해 평가표·맞춤 질문 10개 생성",
    duration: "약 1분",
  },
  {
    num: "03",
    href: "/interview",
    title: "멀티 에이전트 면접",
    desc: "주면접관·기술면접관·인사담당관 3명이 협력하며 진행",
    duration: "10~15분",
  },
  {
    num: "04",
    href: "/report",
    title: "채점 및 리포트",
    desc: "각 면접관의 독립 채점을 종합한 점수·강점·개선점 리포트",
    duration: "약 20초",
  },
];

export default function HomePage() {
  return (
    <PageContainer size="lg">
      <Stack gap={80}>
        <Stack gap="xl" pt={48} pb={24}>
          <Text fz="xs" c="brand.6" style={{ letterSpacing: 1.5 }} fw={600}>
            PREQ · AI INTERVIEW COACH
          </Text>
          <Title order={1} fz={48} lh={1.15} fw={800} maw={680}>
            실제 면접에 가장 가까운
            <br />
            <Text
              component="span"
              inherit
              variant="gradient"
              gradient={{ from: "brand.6", to: "brand.4", deg: 100 }}
            >
              AI 모의면접 코치
            </Text>
          </Title>
          <Text c="dark.6" fz="lg" maw={560} lh={1.6}>
            3명의 AI 면접관이 회사 정보와 이력서를 바탕으로 실제 면접처럼
            질문하고 꼬리질문하며 채점해 드립니다.
          </Text>
          <Group gap="md" mt="xs">
            <Button
              component={Link}
              href="/analyze"
              size="md"
              color="brand"
              rightSection={<IconArrowRight size={16} />}
            >
              면접 시작하기
            </Button>
            <Button
              component="a"
              href="#how"
              size="md"
              variant="subtle"
              color="dark"
            >
              어떻게 작동하나요?
            </Button>
          </Group>
        </Stack>

        <Stack gap={0} id="how">
          <Group justify="space-between" align="end" mb="xs">
            <Title order={3} fz="md" fw={700} style={{ letterSpacing: -0.2 }}>
              진행 단계
            </Title>
            <Text fz="xs" c="dimmed">
              전체 약 12~17분 소요
            </Text>
          </Group>
          <Divider />
          {steps.map((step) => (
            <Box key={step.num}>
              <Link href={step.href} className={classes.stepRow}>
                <Group align="flex-start" wrap="nowrap" gap="xl">
                  <Text
                    fz={14}
                    fw={500}
                    ff="monospace"
                    c="dimmed"
                    className={classes.stepNum}
                    style={{ minWidth: 40, paddingTop: 2 }}
                  >
                    {step.num}
                  </Text>
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text fw={600} fz="md">
                      {step.title}
                    </Text>
                    <Text fz="sm" c="dimmed" lh={1.55}>
                      {step.desc}
                    </Text>
                  </Stack>
                  <Group
                    gap={6}
                    align="center"
                    style={{ minWidth: 90, justifyContent: "flex-end" }}
                    wrap="nowrap"
                  >
                    <Text fz="xs" c="dimmed">
                      {step.duration}
                    </Text>
                    <span className={classes.chevron}>
                      <IconArrowUpRight size={16} />
                    </span>
                  </Group>
                </Group>
              </Link>
              <Divider />
            </Box>
          ))}
        </Stack>
      </Stack>
    </PageContainer>
  );
}
