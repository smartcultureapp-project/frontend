// 백엔드(NestJS) 응답 스키마와 1:1로 맞춘 타입.
// 출처: backend/src/docs/response-schemas.ts, backend/prisma/schemas/*.prisma

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthTokenResponse = {
  accessToken: string;
  user: UserProfile;
};

export type Session = {
  id: string;
  userId: string;
  companyName: string;
  jobRole: string;
  additionalInfo: string | null;
  phase: string;
  companyAnalysisId: string | null;
  resumeAnalysisId: string | null;
  evaluationSheetId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyAnalysis = {
  id: string;
  sessionId: string;
  companyId: string | null;
  companyName: string;
  jobRole: string;
  rawAdditionalInfo: string | null;
  talents: string[];
  techStack: string[];
  cultureKeywords: string[];
  interviewStyle: string[];
  recommendedQuestionAngles: string[];
  interviewAvoid: string[];
  interviewSuccessTips: string[];
  interviewTips: string[];
  actualQuestions: string[];
  searchSources: { url: string; title: string; type: string }[];
  rawSearchResults: unknown | null;
  interviewProcess: string;
  companySummary: string;
  jobRoleSummary: string;
  confidenceScore: number;
  researchedAt: string;
  createdAt: string;
};

// resumeAnalysis.summary 의 형태 (resume-analysis.agent / mock 기준)
export type ResumeSummary = {
  profile?: {
    name?: string;
    title?: string;
    yearsOfExperience?: number;
    education?: string;
  };
  skills?: string[];
  experiences?: {
    company?: string;
    role?: string;
    period?: string;
    highlights?: string[];
  }[];
  strengths?: string[];
  weaknesses?: string[];
  interviewFocus?: string[];
};

export type ResumeAnalysis = {
  id: string;
  userId: string;
  rawText: string;
  summary: ResumeSummary | null;
  createdAt: string;
  updatedAt: string;
};

// 답변별 역량 점수 (백엔드 CategoryScoresSchema 와 동일, 각 1~5)
export type CategoryScores = {
  jobUnderstanding: number;
  technicalSkill: number;
  communication: number;
  problemSolving: number;
  companyFit: number;
};

export type InterviewTurn = {
  id: string;
  sessionId: string;
  question: string | null;
  answer: string | null;
  score: number | null;
  categoryScores: CategoryScores | null;
  feedbackGood: string | null;
  feedbackImprove: string | null;
  betterAnswer: string | null;
  turnIndex: number | null;
  createdAt: string;
};

export type NextQuestion = {
  turnId: string;
  question: string | null;
  turnIndex: number | null;
};

export type AnswerFeedback = {
  turnId: string;
  score: number | null;
  categoryScores: CategoryScores | null;
  feedbackGood: string | null;
  feedbackImprove: string | null;
  betterAnswer: string | null;
};

// 평가 템플릿 (evaluation-template.types.ts)
export type EvaluationCriterion = {
  name: string;
  description: string;
  type: "score" | "descriptive" | "hybrid";
  maxScore?: number;
  evaluationGuide: string;
};

export type EvaluationSection = {
  name: string;
  weight: number;
  criteria: EvaluationCriterion[];
};

export type InterviewStage = {
  name: string;
  description: string;
  sections: EvaluationSection[];
};

export type EvaluationTemplate = {
  id: string;
  companyAnalysisId: string;
  companyName: string;
  jobRole: string;
  createdAt: string;
  template?: { stages: InterviewStage[] };
  stages?: InterviewStage[];
};

// POST /analysis/start 의 SSE 이벤트 (analysis.service.ts SseEvent)
export type AnalysisSseEvent =
  | { type: "searching"; purpose: string; query: string }
  | { type: "search_done"; purpose: string; count: number }
  | { type: "fetching"; purpose: string; url: string }
  | { type: "fetch_done"; purpose: string; success: boolean; length: number }
  | { type: "saving"; message: string }
  | { type: "cached"; sessionId: string; analysisId: string; data: CompanyAnalysis }
  | { type: "complete"; sessionId: string; analysisId: string; data: CompanyAnalysis }
  | { type: "template_saved"; templateId: string }
  | { type: "error"; message: string };
