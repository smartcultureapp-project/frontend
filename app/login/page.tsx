"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Tabs,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { loginUser, signupUser, ApiError } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<string>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signupUser(email.trim(), password, name.trim());
      } else {
        await loginUser(email.trim(), password);
      }
      router.push("/history");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : mode === "signup"
            ? "회원가입에 실패했습니다."
            : "로그인에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer size="xs">
      <Stack gap={32}>
        <PageHeader
          title="로그인"
          description="로그인하면 면접 기록과 리포트를 회사·직무별로 모아볼 수 있어요."
        />

        <Tabs value={mode} onChange={(v) => setMode(v ?? "login")}>
          <Tabs.List grow mb="lg">
            <Tabs.Tab value="login">로그인</Tabs.Tab>
            <Tabs.Tab value="signup">회원가입</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {error && (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertCircle size={16} />}
          >
            {error}
          </Alert>
        )}

        <Stack gap="md">
          {mode === "signup" && (
            <TextInput
              label="이름"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />
          )}
          <TextInput
            label="이메일"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <PasswordInput
            label="비밀번호"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Button
            color="brand"
            loading={loading}
            onClick={submit}
            mt="sm"
            fullWidth
          >
            {mode === "signup" ? "회원가입" : "로그인"}
          </Button>
          <Text fz="xs" c="dimmed" ta="center">
            로그인 없이 둘러봐도 게스트로 자동 저장되며, 로그인하면 기존
            기록과는 별도로 내 계정에 쌓입니다.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
