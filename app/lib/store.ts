// 페이지 간(회사분석 → 이력서 → 면접 → 리포트) 공유 상태.
// 백엔드가 세션 단위로 모든 데이터를 묶으므로 sessionId 만 들고 다니면 된다.

const SESSION_KEY = "preq.sessionId";
const RESUME_KEY = "preq.resumeId";

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string) {
  window.localStorage.setItem(SESSION_KEY, id);
}

export function getResumeId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(RESUME_KEY);
}

export function setResumeId(id: string) {
  window.localStorage.setItem(RESUME_KEY, id);
}
