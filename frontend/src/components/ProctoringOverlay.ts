import { candidateAssist } from '../services/candidateAssist';
import { detectFaces, ensureFaceTracker, isFaceTrackerReady, lerpBox, FaceBox } from '../services/faceTracker';
import { store } from '../services/store';
import { ProctoringViolation } from '../types';

type MonitorStatus = 'loading' | 'in-frame' | 'out-of-frame' | 'multiple';

const DEFAULT_WIDTH = 168;
const MIN_WIDTH = 128;
const MAX_WIDTH = 420;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

class ProctoringOverlay {
  private root: HTMLElement | null = null;
  private stream: MediaStream | null = null;
  private ownStream = false;
  private raf = 0;
  private lastTick = 0;
  private missingMs = 0;
  private extraMs = 0;
  private lastStatus: MonitorStatus = 'loading';
  private box: FaceBox | null = null;
  private pos = { x: 0, y: 72 };
  private width = DEFAULT_WIDTH;
  private dragging = false;
  private resizing = false;
  private dragOffset = { x: 0, y: 0 };
  private resizeStart = { x: 0, width: DEFAULT_WIDTH };
  private blurBound = false;
  private shotAt = 0;
  private video: HTMLVideoElement | null = null;

  mount() {
    if (this.root) return;
    this.pos.x = Math.max(16, window.innerWidth - this.width - 16);
    this.pos.y = 72;
    this.root = document.createElement('div');
    this.root.id = 'exam-camera-overlay';
    document.body.appendChild(this.root);
    this.paintShell();
    this.bindDrag();
    this.bindResize();
    this.bindBlur();
    void ensureFaceTracker();
    this.initVideo().catch(err => console.error('Exam camera failed', err));
  }

  teardown() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.ownStream) this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.ownStream = false;
    this.video = null;
    this.root?.remove();
    this.root = null;
    this.missingMs = 0;
    this.extraMs = 0;
    this.box = null;
  }

  private paintShell() {
    if (!this.root) return;
    const state = store.getState();
    const max = state.settings.maxViolationsBeforeTerminate;
    this.root.innerHTML = `
      <div id="exam-cam-card" class="fixed z-[60] select-none" style="left:${this.pos.x}px;top:${this.pos.y}px;width:${this.width}px">
        <div class="relative rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-2xl overflow-hidden">
          <div id="exam-cam-handle" role="button" aria-label="Drag camera" class="cursor-grab active:cursor-grabbing px-1.5 py-1 flex items-center justify-between gap-1 bg-slate-900/95 border-b border-slate-800">
            <div class="flex items-center gap-1 min-w-0">
              <span class="text-slate-500 text-[10px] tracking-widest">⠿</span>
              <span class="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-red-500/15 border border-red-500/40">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span class="text-[9px] font-black tracking-wider text-red-400">REC</span>
              </span>
            </div>
            <span id="exam-cam-warns" class="text-[9px] font-bold text-slate-300 whitespace-nowrap">${state.violationCount}/${max}</span>
          </div>
          <div class="relative aspect-video bg-slate-900 overflow-hidden">
            <video id="proctor-pip-video" autoplay playsinline muted class="w-full h-full object-cover" style="transform:scaleX(-1)"></video>
            <div id="exam-face-box" class="absolute rounded-md border-[3px] pointer-events-none" style="display:none"></div>
            <div id="exam-cam-fallback" class="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500 text-lg">📷</div>
            <div id="exam-shot-flash" class="absolute inset-0 bg-white/70 opacity-0 pointer-events-none transition-opacity duration-150"></div>
            <div id="exam-cam-badge" class="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-700 text-white">Finding face</div>
          </div>
          <button type="button" id="exam-cam-resize" aria-label="Resize camera" title="Drag corner to resize" class="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize text-slate-200 hover:text-white bg-slate-800/90 hover:bg-blue-600 rounded-tl-md flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M11 5V11H5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 8.5L8.5 11M11 6L6 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div id="exam-cam-toast" class="hidden mt-2 max-w-full rounded-xl border border-red-500/40 bg-red-950/95 px-3 py-2 shadow-xl">
          <p class="text-[10px] font-bold uppercase tracking-wider text-red-300">Warning</p>
          <p id="exam-cam-toast-copy" class="text-xs font-medium text-white"></p>
        </div>
      </div>
    `;
  }

  private card() {
    return this.root?.querySelector('#exam-cam-card') as HTMLElement | null;
  }

  private bindDrag() {
    const handle = this.root?.querySelector('#exam-cam-handle') as HTMLElement | null;
    if (!handle) return;
    const move = (ev: MouseEvent) => {
      if (!this.dragging) return;
      this.pos.x = clamp(ev.clientX - this.dragOffset.x, 8, window.innerWidth - 80);
      this.pos.y = clamp(ev.clientY - this.dragOffset.y, 8, window.innerHeight - 80);
      const card = this.card();
      if (card) {
        card.style.left = `${this.pos.x}px`;
        card.style.top = `${this.pos.y}px`;
      }
    };
    const stop = () => {
      if (!this.dragging) return;
      this.dragging = false;
      handle.classList.replace('cursor-grabbing', 'cursor-grab');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('mouseup', stop);
    };
    const start = (ev: MouseEvent) => {
      if (ev.button !== 0) return;
      this.dragging = true;
      this.dragOffset.x = ev.clientX - this.pos.x;
      this.dragOffset.y = ev.clientY - this.pos.y;
      handle.classList.replace('cursor-grab', 'cursor-grabbing');
      window.addEventListener('pointermove', move);
      window.addEventListener('mousemove', move);
      window.addEventListener('pointerup', stop);
      window.addEventListener('mouseup', stop);
    };
    handle.addEventListener('pointerdown', start);
    handle.addEventListener('mousedown', start);
  }

  private bindResize() {
    const grip = this.root?.querySelector('#exam-cam-resize') as HTMLElement | null;
    if (!grip) return;
    const move = (ev: MouseEvent) => {
      if (!this.resizing) return;
      this.setWidth(this.resizeStart.width + (ev.clientX - this.resizeStart.x));
    };
    const stop = () => {
      this.resizing = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('mouseup', stop);
    };
    const start = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.resizing = true;
      this.resizeStart = { x: ev.clientX, width: this.width };
      window.addEventListener('pointermove', move);
      window.addEventListener('mousemove', move);
      window.addEventListener('pointerup', stop);
      window.addEventListener('mouseup', stop);
    };
    grip.addEventListener('pointerdown', start);
    grip.addEventListener('mousedown', start);
  }

  private setWidth(next: number) {
    const width = clamp(next, MIN_WIDTH, MAX_WIDTH);
    const overflow = this.pos.x + width - (window.innerWidth - 8);
    if (overflow > 0) this.pos.x = Math.max(8, this.pos.x - overflow);
    this.width = width;
    const card = this.card();
    if (card) {
      card.style.width = `${this.width}px`;
      card.style.left = `${this.pos.x}px`;
    }
  }

  private bindBlur() {
    if (this.blurBound) return;
    this.blurBound = true;
    window.addEventListener('blur', () => {
      const state = store.getState();
      if (state.examStarted && !state.examCompleted) {
        this.warn('Tab Switch', 'Window focus lost (tab switch or another window).', 'high');
      }
    });
  }

  private async initVideo() {
    const video = this.root?.querySelector('#proctor-pip-video') as HTMLVideoElement | null;
    const fallback = this.root?.querySelector('#exam-cam-fallback') as HTMLElement | null;
    const existing = store.getLiveCameraStream();
    try {
      this.stream = existing || await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      this.ownStream = !existing;
      if (this.stream) store.registerMediaStream(this.stream);
      if (video && this.stream) {
        this.video = video;
        video.srcObject = this.stream;
        if (fallback) fallback.style.display = 'none';
        await video.play().catch(() => undefined);
        this.startMonitor();
      }
    } catch {
      if (fallback) fallback.textContent = 'Camera blocked';
    }
  }

  private startMonitor() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.lastTick = performance.now();
    const step = (now: number) => {
      this.raf = requestAnimationFrame(step);
      this.tick(now);
    };
    this.raf = requestAnimationFrame(step);
  }

  private tick(now: number) {
    const video = this.video;
    if (!video || !video.videoWidth || !this.root) return;
    const dt = Math.min(80, now - this.lastTick);
    this.lastTick = now;
    const state = store.getState();

    if (!isFaceTrackerReady()) {
      this.paintFrame('loading', this.box, false);
      this.paintChrome(state.violationCount, state.settings.maxViolationsBeforeTerminate);
      return;
    }

    const faces = detectFaces(video, now);
    const primary = faces[0] || null;
    const inFrame = !!primary;
    let status: MonitorStatus = inFrame ? 'in-frame' : 'out-of-frame';
    if (state.settings.detectMultipleFaces && faces.length >= 2) status = 'multiple';

    if (primary) this.box = lerpBox(this.box, primary, 0.55);
    this.paintFrame(status, this.box || primary, !inFrame);
    this.paintChrome(state.violationCount, state.settings.maxViolationsBeforeTerminate);

    const examLive = state.examStarted && !state.examCompleted;
    if (!examLive) return;

    if (!inFrame) {
      this.missingMs += dt;
      this.extraMs = 0;
      if (this.missingMs >= 900) {
        this.warn('No Face Detected', 'No face recognized. Look at the camera and stay in frame.', 'high');
        this.missingMs = 0;
      }
    } else if (status === 'multiple') {
      this.extraMs += dt;
      this.missingMs = 0;
      if (this.extraMs >= 800) {
        this.captureShot(video, 'Another person was detected in the camera.');
        this.warn('Multiple Faces', 'Another face was recognized. Only the candidate may be in view.', 'high');
        this.extraMs = 0;
      }
    } else {
      this.missingMs = 0;
      this.extraMs = 0;
      if (this.lastStatus !== 'in-frame') this.hideToast();
    }
    this.lastStatus = status;
  }

  private paintFrame(status: MonitorStatus, box: FaceBox | null, outOfFrame: boolean) {
    const frame = this.root?.querySelector('#exam-face-box') as HTMLElement | null;
    const badge = this.root?.querySelector('#exam-cam-badge') as HTMLElement | null;
    if (!frame || !badge) return;

    const labels: Record<MonitorStatus, string> = {
      loading: 'Finding face',
      'in-frame': 'Face locked',
      'out-of-frame': 'No face',
      multiple: 'Other face',
    };
    const badgeClass: Record<MonitorStatus, string> = {
      loading: 'bg-slate-700 text-white',
      'in-frame': 'bg-emerald-500 text-white',
      'out-of-frame': 'bg-red-600 text-white',
      multiple: 'bg-amber-500 text-slate-950',
    };
    badge.className = `absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${badgeClass[status]}`;
    badge.textContent = labels[status];

    const draw = outOfFrame || !box ? { x: 0.06, y: 0.06, w: 0.88, h: 0.88 } : box;
    const host = frame.parentElement;
    const vw = this.video?.videoWidth || 640;
    const vh = this.video?.videoHeight || 480;
    const ew = host?.clientWidth || this.width;
    const eh = host?.clientHeight || Math.round(this.width * 9 / 16);
    const videoAspect = vw / vh;
    const viewAspect = ew / Math.max(eh, 1);
    let scale = ew / vw;
    let ox = 0;
    let oy = 0;
    if (viewAspect > videoAspect) {
      scale = ew / vw;
      oy = (eh - vh * scale) / 2;
    } else {
      scale = eh / vh;
      ox = (ew - vw * scale) / 2;
    }
    const mirroredX = 1 - draw.x - draw.w;
    frame.style.display = 'block';
    frame.style.left = `${ox + mirroredX * vw * scale}px`;
    frame.style.top = `${oy + draw.y * vh * scale}px`;
    frame.style.width = `${draw.w * vw * scale}px`;
    frame.style.height = `${draw.h * vh * scale}px`;
    const red = outOfFrame || status === 'out-of-frame';
    frame.style.borderColor = red ? '#ef4444' : status === 'multiple' ? '#f59e0b' : '#22c55e';
    frame.style.boxShadow = red
      ? '0 0 0 999px rgba(239,68,68,0.16) inset'
      : '0 0 0 1px rgba(34,197,94,0.35)';
  }

  private paintChrome(count: number, max: number) {
    const warns = this.root?.querySelector('#exam-cam-warns');
    if (warns) warns.textContent = `${count}/${max}`;
  }

  private showToast(copy: string) {
    const toast = this.root?.querySelector('#exam-cam-toast') as HTMLElement | null;
    const text = this.root?.querySelector('#exam-cam-toast-copy');
    if (!toast || !text) return;
    text.textContent = copy;
    toast.classList.remove('hidden');
  }

  private hideToast() {
    this.root?.querySelector('#exam-cam-toast')?.classList.add('hidden');
  }

  private warn(type: ProctoringViolation['type'], description: string, severity: 'low' | 'medium' | 'high') {
    this.showToast(description);
    store.logProctoringViolation(type, description, severity);
  }

  private captureShot(video: HTMLVideoElement, reason: string) {
    const now = Date.now();
    if (now - this.shotAt < 8000 || !video.videoWidth) return;
    this.shotAt = now;
    const shot = document.createElement('canvas');
    const width = 480;
    const height = Math.round((video.videoHeight / video.videoWidth) * width) || 270;
    shot.width = width;
    shot.height = height;
    const ctx = shot.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const image = shot.toDataURL('image/jpeg', 0.55);
    candidateAssist.sendSnapshot(image, reason);
    const flash = this.root?.querySelector('#exam-shot-flash') as HTMLElement | null;
    if (flash) {
      flash.style.opacity = '1';
      window.setTimeout(() => { flash.style.opacity = '0'; }, 140);
    }
  }
}

const overlay = new ProctoringOverlay();

export function ensureProctoringOverlay() {
  overlay.mount();
}

export function teardownProctoringOverlay() {
  overlay.teardown();
}

export class ProctoringOverlayComponent {
  constructor(private container: HTMLElement) {}

  public render() {
    ensureProctoringOverlay();
    this.container.innerHTML = '';
  }
}
