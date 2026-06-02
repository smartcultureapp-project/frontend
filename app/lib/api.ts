// 백엔드(NestJS) REST 클라이언트.
// - JWT accessToken 을 localStorage 에 저장하고 Authorization 헤더로 전송
// - 보호된 엔드포인트 접근 전 게스트 계정을 자동 발급(ensureAuth)
// - /analysis/start 는 text/event-stream 이라 fetch + ReadableStream 으로 처리

import type {
  AnalysisSseEvent,
  AnswerFeedback,
  AuthTokenResponse,
  CompanyAnalysis,
  EvaluationTemplate,
  ExpectedQuestions,
  FinalReport,
  InterviewTurn,
  NextQuestion,
  ResumeAnalysis,
  Session,
  UserProfile,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

const TOKEN_KEY = "preq.accessToken";
const GUEST_KEY = "preq.guest";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

// 토큰 + 게스트 자격증명 모두 폐기 (백엔드 전환/시크릿 변경 시 무효 토큰 정리)
export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(GUEST_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ReqOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean; // 기본 true
  _retried?: boolean; // 401 재시도 가드 (내부용)
};

async function request<T>(path: string, opts: ReqOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 무효/만료 토큰(백엔드 전환 포함) → 자격증명 폐기 후 재발급, 1회 재시도
  if (res.status === 401 && auth && !opts._retried) {
    clearAuth();
    await ensureAuth();
    return request<T>(path, { ...opts, _retried: true });
  }

  if (!res.ok) {
    let message = `요청 실패 (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message
        ? Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message
        : message;
    } catch {
      /* JSON 아님 — 기본 메시지 사용 */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const auth = {
  register: (body: { email: string; password: string; name: string }) =>
    request<AuthTokenResponse>("/auth/register", {
      method: "POST",
      body,
      auth: false,
    }),
  login: (body: { email: string; password: string }) =>
    request<AuthTokenResponse>("/auth/login", {
      method: "POST",
      body,
      auth: false,
    }),
  me: () => request<UserProfile & { createdAt: string }>("/auth/me"),
};

type GuestCreds = { email: string; password: string };

// 로그인 UI 가 없으므로, 첫 접근 시 데모 게스트 계정을 만들어 토큰을 확보한다.
// 한 번 만든 자격증명은 localStorage 에 저장해 재사용한다.
export async function ensureAuth(): Promise<void> {
  if (typeof window === "undefined") return;
  if (getToken()) return;

  const stored = window.localStorage.getItem(GUEST_KEY);
  if (stored) {
    const creds = JSON.parse(stored) as GuestCreds;
    try {
      const { accessToken } = await auth.login(creds);
      setToken(accessToken);
      return;
    } catch {
      /* 비밀번호 변경/삭제 등 — 새 게스트로 재발급 */
    }
  }

  // crypto.randomUUID 로 충돌 없는 게스트 이메일 생성
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : `${Date.now()}`;
  const creds: GuestCreds = {
    email: `guest-${id}@preq.local`,
    password: `guest-${id}-pw`,
  };
  const { accessToken } = await auth.register({ ...creds, name: "게스트" });
  window.localStorage.setItem(GUEST_KEY, JSON.stringify(creds));
  setToken(accessToken);
}

// ---------------------------------------------------------------------------
// Analysis (회사 딥리서치, SSE)
// ---------------------------------------------------------------------------

export const analysis = {
  // SSE 스트림. onEvent 로 진행 이벤트를 흘려보내고, 종료 시 resolve.
  async start(
    body: {
      companyName: string;
      jobRole: string;
      additionalInfo?: string;
      forceRefresh?: boolean;
    },
    onEvent: (event: AnalysisSseEvent) => void,
    signal?: AbortSignal,
    _retried = false,
  ): Promise<void> {
    await ensureAuth();
    const token = getToken();

    const res = await fetch(`${API_URL}/analysis/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });

    // 무효/만료 토큰 → 자격증명 폐기 후 재발급, 1회 재시도
    if (res.status === 401 && !_retried) {
      clearAuth();
      await ensureAuth();
      return this.start(body, onEvent, signal, true);
    }

    if (!res.ok || !res.body) {
      throw new ApiError(res.status, `분석 시작 실패 (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // SSE 프레임은 "\n\n" 으로 구분, 각 줄은 "data: {json}"
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        const dataLine = frame
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const json = dataLine.slice(5).trim();
        if (!json) continue;
        try {
          onEvent(JSON.parse(json) as AnalysisSseEvent);
        } catch {
          /* 파싱 불가 프레임 무시 */
        }
      }
    }
  },

  get: (sessionId: string) =>
    request<CompanyAnalysis>(`/analysis/${sessionId}`),
};

// ---------------------------------------------------------------------------
// Resume
// ---------------------------------------------------------------------------

export const resume = {
  create: (body: {
    rawText: string;
    sessionId?: string;
    fileName?: string;
    fileType?: string;
    fileData?: string;
  }) => request<ResumeAnalysis>("/resume", { method: "POST", body }),
  list: () => request<ResumeAnalysis[]>("/resume"),
  get: (id: string) => request<ResumeAnalysis>(`/resume/${id}`),
  // 요약이 비어있는(과거 실패) 이력서 재분석 트리거
  reanalyze: (id: string) =>
    request<ResumeAnalysis>(`/resume/${id}/reanalyze`, { method: "POST" }),

  // 저장된 원본 파일을 인증 포함으로 받아 blob URL 로 반환 (새 탭으로 열기용)
  fileBlobUrl: async (id: string): Promise<string> => {
    const token = getToken();
    const res = await fetch(`${API_URL}/resume/${id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new ApiError(res.status, "원본 파일을 불러오지 못했습니다.");
    }
    return URL.createObjectURL(await res.blob());
  },
};

// ---------------------------------------------------------------------------
// Sessions / 모의면접
// ---------------------------------------------------------------------------

export const sessions = {
  list: () => request<Session[]>("/sessions"),
  get: (id: string) => request<Session>(`/sessions/${id}`),
  patch: (
    id: string,
    body: {
      phase?: string;
      resumeAnalysisId?: string | null;
      evaluationSheetId?: string | null;
    },
  ) => request<Session>(`/sessions/${id}`, { method: "PATCH", body }),

  listTurns: (id: string) =>
    request<InterviewTurn[]>(`/sessions/${id}/interview-turns`),

  nextQuestion: (id: string) =>
    request<NextQuestion>(`/sessions/${id}/interview/next-question`, {
      method: "POST",
    }),

  submitAnswer: (id: string, answer: string) =>
    request<AnswerFeedback>(`/sessions/${id}/interview/answer`, {
      method: "POST",
      body: { answer },
    }),

  // 4-2단계: 최종 면접 리포트 생성·저장
  generateReport: (id: string) =>
    request<FinalReport>(`/sessions/${id}/interview/report`, {
      method: "POST",
    }),

  // 2단계: 이력서 + 회사 분석 기반 맞춤 예상 질문 (캐시)
  expectedQuestions: (id: string, refresh = false) =>
    request<ExpectedQuestions>(
      `/sessions/${id}/expected-questions${refresh ? "?refresh=true" : ""}`,
    ),
};

// ---------------------------------------------------------------------------
// Evaluation template
// ---------------------------------------------------------------------------

export const evaluation = {
  bySession: (sessionId: string) =>
    request<EvaluationTemplate | { error: string }>(
      `/evaluation-template?sessionId=${encodeURIComponent(sessionId)}`,
    ),
};
