"use client";

import { useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

export type PostureState =
  | { status: "loading" }
  | { status: "good" }
  | { status: "no_face" }
  | { status: "adjust"; hint: string };

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// MediaPipe/TFLite 가 Emscripten stderr 로 찍는 양성 INFO 로그(XNNPACK 등)를 한 번만 걸러낸다.
// (Next dev 오버레이가 이를 'Console Error' 로 표시 → 실제 에러는 그대로 통과)
let consoleFiltered = false;
function filterBenignMediapipeLogs() {
  if (consoleFiltered || typeof window === "undefined") return;
  consoleFiltered = true;
  const benign =
    /XNNPACK|TensorFlow Lite|Created TensorFlow|GL version|gl_context|delegate for CPU/i;
  (["error", "warn", "info", "log"] as const).forEach((method) => {
    const orig = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      if (typeof args[0] === "string" && benign.test(args[0])) return;
      orig(...args);
    };
  });
}

/**
 * 웹캠 영상에서 얼굴 위치·크기를 감지해 면접 자세를 판정한다(MediaPipe FaceLandmarker).
 * 모델/WASM 은 CDN 에서 lazy 로드. 좌우 방향 힌트는 미러링 혼동을 피해 쓰지 않는다.
 */
export function usePosture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
): PostureState {
  const [state, setState] = useState<PostureState>({ status: "loading" });
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    if (!active) {
      setState({ status: "loading" });
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    (async () => {
      try {
        filterBenignMediapipeLogs();
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);

        const make = (delegate: "GPU" | "CPU") =>
          vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate },
            runningMode: "VIDEO",
            numFaces: 1,
          });

        const landmarker = await make("GPU").catch(() => make("CPU"));
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        intervalId = window.setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;

          let res;
          try {
            res = landmarker.detectForVideo(video, performance.now());
          } catch {
            return;
          }

          const faces = res.faceLandmarks;
          if (!faces || faces.length === 0) {
            setState({ status: "no_face" });
            return;
          }

          let minX = 1,
            maxX = 0,
            minY = 1,
            maxY = 0;
          for (const p of faces[0]) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const faceH = maxY - minY;

          let hint = "";
          if (faceH > 0.85) hint = "카메라에서 조금 떨어지세요";
          else if (faceH < 0.18) hint = "카메라에 조금 더 가까이 오세요";
          else if (centerX < 0.28 || centerX > 0.72)
            hint = "얼굴을 화면 중앙에 맞춰주세요";
          else if (centerY > 0.62) hint = "카메라를 눈높이로 올려주세요";
          else if (centerY < 0.3) hint = "카메라를 조금 내려주세요";

          setState(hint ? { status: "adjust", hint } : { status: "good" });
        }, 350);
      } catch {
        // 모델 로드 실패(네트워크 등) — 로딩 상태 유지(가짜 '양호' 표시는 하지 않음)
        if (!cancelled) setState({ status: "loading" });
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      try {
        landmarkerRef.current?.close();
      } catch {
        /* noop */
      }
      landmarkerRef.current = null;
    };
  }, [active, videoRef]);

  return state;
}
