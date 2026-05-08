"use client";

import Link from "next/link";
import { Button, Group, Divider, Stack } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

type Props = {
  prevHref?: string;
  prevLabel?: string;
  nextHref?: string;
  nextLabel?: string;
  nextColor?: string;
  onNextClick?: () => void;
};

export function StepFooter({
  prevHref,
  prevLabel = "이전",
  nextHref,
  nextLabel = "다음",
  nextColor = "dark",
  onNextClick,
}: Props) {
  return (
    <Stack gap={32} mt={48}>
      <Divider />
      <Group justify="space-between">
        {prevHref ? (
          <Button
            component={Link}
            href={prevHref}
            variant="subtle"
            color="dark"
            leftSection={<IconArrowLeft size={16} />}
          >
            {prevLabel}
          </Button>
        ) : (
          <span />
        )}
        {nextHref ? (
          <Button
            component={Link}
            href={nextHref}
            color={nextColor}
            rightSection={<IconArrowRight size={16} />}
            onClick={onNextClick}
          >
            {nextLabel}
          </Button>
        ) : null}
      </Group>
    </Stack>
  );
}
