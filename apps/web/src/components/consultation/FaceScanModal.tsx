"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { XCircle, Camera, RotateCcw, Check } from "lucide-react";

// Dynamically imported inside the component to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceApiModule = typeof import("@vladmandic/face-api");

const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model/";

type FaceShape =
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "diamond"
  | "oblong"
  | "triangle";

interface Point {
  x: number;
  y: number;
}

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectFaceShape(landmarks: any): FaceShape {
  const pts: Point[] = landmarks.positions;

  // Jaw contour: 0–16 (0=right ear, 8=chin, 16=left ear)
  const faceWidth = dist(pts[0]!, pts[16]!);          // full jaw width
  const jawWidth = dist(pts[3]!, pts[13]!);            // narrower chin width
  const foreheadWidth = dist(pts[17]!, pts[26]!);      // outer brow span as forehead proxy

  // Face height: chin (8) to estimated forehead
  const browMidY = ((pts[19]?.y ?? 0) + (pts[24]?.y ?? 0)) / 2;
  const chinY = pts[8]!.y;
  const browToChin = Math.abs(chinY - browMidY);
  const faceHeight = browToChin * 1.5; // include forehead above brows

  if (faceWidth === 0) return "oval"; // guard

  const hwRatio = faceHeight / faceWidth;
  const jawRatio = jawWidth / faceWidth;
  const foreheadRatio = foreheadWidth / faceWidth;

  if (hwRatio > 1.65) return "oblong";
  if (hwRatio < 1.10) return "round";
  if (jawRatio > 0.88) return "square";
  if (foreheadRatio - jawRatio > 0.12) return "heart";
  if (foreheadRatio < 0.78 && jawRatio < 0.78) return "diamond";
  if (jawRatio - foreheadRatio > 0.10) return "triangle";
  return "oval";
}

interface Props {
  onDetected: (shape: FaceShape) => void;
  onClose: () => void;
}

type Status =
  | "loading-models"
  | "requesting-camera"
  | "live"
  | "capturing"
  | "detected"
  | "no-face"
  | "error";

export function FaceScanModal({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<FaceApiModule | null>(null);

  const [status, setStatus] = useState<Status>("loading-models");
  const [statusMsg, setStatusMsg] = useState("Loading AI models…");
  const [detected, setDetected] = useState<FaceShape | null>(null);

  // Load models once
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceApiRef.current = faceapi;
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);
        if (cancelled) return;
        setStatus("requesting-camera");
        setStatusMsg("Requesting camera access…");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setStatusMsg("Failed to load AI models. Please check your connection.");
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // Start camera once models are loaded
  useEffect(() => {
    if (status !== "requesting-camera") return;
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("live");
        setStatusMsg("");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setStatusMsg("Camera access denied. Please allow camera and retry.");
        }
      }
    };
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [status]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceapi = faceApiRef.current;
    if (!video || !canvas || !faceapi) return;

    setStatus("capturing");
    setStatusMsg("Analysing face…");

    // Draw current frame to canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const result = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks(true); // true = tiny net

      if (!result) {
        setStatus("no-face");
        setStatusMsg("No face detected — please centre your face and try again.");
        return;
      }

      const shape = detectFaceShape(result.landmarks);
      setDetected(shape);
      setStatus("detected");
      setStatusMsg("");

      // Stop camera once we have a result
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      setStatus("error");
      setStatusMsg("Detection failed. Please try again.");
    }
  }, []);

  const retry = () => {
    setDetected(null);
    setStatus("requesting-camera");
    setStatusMsg("Restarting camera…");
  };

  const confirm = () => {
    if (detected) onDetected(detected);
  };

  const SHAPE_LABELS: Record<FaceShape, string> = {
    oval: "Oval",
    round: "Round",
    square: "Square",
    heart: "Heart",
    diamond: "Diamond",
    oblong: "Oblong",
    triangle: "Triangle",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="text-sm font-semibold text-gray-900">Face Shape Scan</p>
            <p className="text-xs text-gray-400 mt-0.5">Processed on-device · not stored</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Video / Canvas area */}
        <div className="relative bg-black aspect-[4/3] overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${status === "detected" ? "opacity-30" : "opacity-100"}`}
          />
          {/* Hidden canvas used for capture + analysis */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Face guide oval */}
          {status === "live" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-white/60 rounded-full w-44 h-56" />
            </div>
          )}

          {/* Status overlay */}
          {(status === "loading-models" || status === "requesting-camera" || status === "capturing") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-sm text-white text-center px-6">{statusMsg}</p>
            </div>
          )}

          {/* Detected result overlay */}
          {status === "detected" && detected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="bg-white rounded-xl px-6 py-4 text-center shadow-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Detected shape</p>
                <p className="text-3xl font-semibold text-gray-900">{SHAPE_LABELS[detected]}</p>
              </div>
            </div>
          )}

          {/* No-face error */}
          {status === "no-face" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6">
              <p className="text-sm text-white text-center">{statusMsg}</p>
            </div>
          )}

          {/* Generic error */}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6">
              <p className="text-sm text-white text-center">{statusMsg}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-4 flex gap-3">
          {status === "live" && (
            <button
              onClick={() => { void capture(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Capture
            </button>
          )}

          {(status === "no-face" || status === "error") && (
            <button
              onClick={retry}
              className="flex-1 flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          )}

          {status === "detected" && (
            <>
              <button
                onClick={retry}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
              <button
                onClick={confirm}
                className="flex-1 flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
              >
                <Check className="w-4 h-4" />
                Use {SHAPE_LABELS[detected!]}
              </button>
            </>
          )}

          {(status === "loading-models" || status === "requesting-camera" || status === "capturing") && (
            <button disabled className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
