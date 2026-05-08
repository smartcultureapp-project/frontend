import { Stack, Title, Text } from "@mantine/core";

type Props = {
  step?: number;
  title: string;
  description?: string;
};

export function PageHeader({ step, title, description }: Props) {
  return (
    <Stack gap={10} pt={8} pb={24}>
      {step !== undefined && (
        <Text
          fz="xs"
          c="brand.6"
          fw={600}
          ff="monospace"
          style={{ letterSpacing: 1.2 }}
        >
          STEP 0{step}
        </Text>
      )}
      <Title order={2} fz={32} fw={700} style={{ letterSpacing: -0.5 }}>
        {title}
      </Title>
      {description && (
        <Text c="dimmed" fz="sm" lh={1.6} maw={620}>
          {description}
        </Text>
      )}
    </Stack>
  );
}
