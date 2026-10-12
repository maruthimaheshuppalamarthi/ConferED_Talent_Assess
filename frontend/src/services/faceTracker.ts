import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

let detector: FaceDetector | null = null;
let load: Promise<FaceDetector | null> | null = null;
let lastTs = 0;

function padBox(box: FaceBox, pad = 0.16): FaceBox {
  const extraW = box.w * pad;
  const extraH = box.h * pad;
  const x = Math.max(0, box.x - extraW / 2);
  const y = Math.max(0, box.y - extraH / 2);
  return {
    x,
    y,
    w: Math.min(1 - x, box.w + extraW),
    h: Math.min(1 - y, box.h + extraH),
  };
}

/** BlazeFace boxes sit on the eyes; stretch them to cover forehead through chin. */
function fullFace(box: FaceBox): FaceBox {
  const w = box.w * 1.3;
  const h = box.h * 1.95;
  const x = Math.max(0, box.x - (w - box.w) / 2);
  const y = Math.max(0, box.y - box.h * 0.28);
  return {
    x,
    y,
    w: Math.min(1 - x, w),
    h: Math.min(1 - y, h),
  };
}

function fromDetection(detection: { boundingBox?: { originX: number; originY: number; width: number; height: number }; keypoints?: Array<{ x: number; y: number }> }, video: HTMLVideoElement): FaceBox | null {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const box = detection.boundingBox;
  if (box && box.width >= 8 && box.height >= 8) {
    return fullFace(padBox({
      x: box.originX / vw,
      y: box.originY / vh,
      w: box.width / vw,
      h: box.height / vh,
    }, 0.06));
  }
  const points = detection.keypoints || [];
  if (points.length < 4) return null;
  const pixel = points.some(p => p.x > 1.5 || p.y > 1.5);
  const xs = points.map(p => pixel ? p.x / vw : p.x);
  const ys = points.map(p => pixel ? p.y / vh : p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX;
  const h = maxY - minY;
  if (w < 0.04 || h < 0.05) return null;
  return fullFace(padBox({ x: minX, y: minY, w, h }, 0.2));
}

export function isFaceTrackerReady() {
  return !!detector;
}

export async function ensureFaceTracker(): Promise<boolean> {
  if (detector) return true;
  if (load) return !!(await load);
  load = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const options = {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' as const },
        runningMode: 'VIDEO' as const,
        minDetectionConfidence: 0.42,
        minSuppressionThreshold: 0.25,
      };
      try {
        detector = await FaceDetector.createFromOptions(vision, options);
      } catch {
        detector = await FaceDetector.createFromOptions(vision, {
          ...options,
          baseOptions: { ...options.baseOptions, delegate: 'CPU' },
        });
      }
      return detector;
    } catch (err) {
      console.error('Face tracker failed to load', err);
      load = null;
      return null;
    }
  })();
  return !!(await load);
}

export function detectFaces(video: HTMLVideoElement, timestamp: number): FaceBox[] {
  if (!detector || !video.videoWidth) return [];
  const ts = timestamp <= lastTs ? lastTs + 1 : timestamp;
  lastTs = ts;
  try {
    const result = detector.detectForVideo(video, ts);
    return (result.detections || [])
      .map(item => fromDetection(item, video))
      .filter((box): box is FaceBox => !!box)
      .sort((a, b) => b.w * b.h - a.w * a.h);
  } catch {
    return [];
  }
}

export function lerpBox(from: FaceBox | null, to: FaceBox, amount = 0.5): FaceBox {
  if (!from) return to;
  return {
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount,
    w: from.w + (to.w - from.w) * amount,
    h: from.h + (to.h - from.h) * amount,
  };
}
