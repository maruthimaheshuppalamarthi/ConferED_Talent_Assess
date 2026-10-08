import { store } from '../services/store';

export class ProctoringOverlayComponent {
  private container: HTMLElement;
  private mediaStream: MediaStream | null = null;
  private analysisInterval: any = null;
  private canvas: HTMLCanvasElement | null = null;
  private missingFaceCounter: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const state = store.getState();

    this.container.innerHTML = `
      <div class="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        <!-- Floating Violation Alert Toast Banner -->
        ${state.liveProctoringAlert ? `
          <div class="glass-panel p-3.5 rounded-2xl border border-red-500/40 bg-red-950/90 shadow-2xl animate-pulse-red max-w-sm flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-lg shrink-0">⚠️</div>
            <div>
              <h4 class="text-xs font-bold text-red-300 uppercase tracking-wider">Proctoring Warning</h4>
              <p class="text-xs text-white font-medium">${state.liveProctoringAlert}</p>
            </div>
          </div>
        ` : ''}

        <!-- Clean Candidate Live Camera Video PIP (NO TEXT, NO OVERLAYS) -->
        <div class="glass-panel p-1 rounded-2xl border border-slate-700/80 shadow-2xl w-48 bg-slate-950/90 overflow-hidden">
          <div class="relative w-full aspect-video rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
            <video id="proctor-pip-video" autoplay playsinline muted class="w-full h-full object-cover rounded-xl"></video>
            <div id="pip-fallback" class="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-600">
              <span class="text-2xl">📷</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Proctor Intercom / 360° Room Inspection Pitch Overlay Modal -->
      ${state.proctorIntercomMessage ? `
        <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="glass-panel p-6 rounded-3xl border border-purple-500/50 bg-slate-950/95 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div class="w-16 h-16 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-3xl mx-auto border border-purple-500/40 animate-pulse">
              🎙️
            </div>
            <div>
              <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">LIVE PROCTOR VOICE INTERCOM ACTIVE</span>
              <h3 class="text-lg font-extrabold text-white mt-2">Proctor Inspection Pitch Received</h3>
            </div>

            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-purple-200 font-medium space-y-2 text-left">
              <p class="text-[11px] text-slate-400 font-mono">From: Head Exam Proctor</p>
              <p class="text-sm font-bold text-white">"${state.proctorIntercomMessage}"</p>
            </div>

            <div class="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300 font-semibold">
              📹 Please rotate your laptop / camera 360° around your desk and room to complete the environment scan.
            </div>

            <button id="acknowledge-intercom-btn" class="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all">
              ✓ ACKNOWLEDGE & COMPLETE ROOM SCAN
            </button>
          </div>
        </div>
      ` : ''}
    `;

    this.initVideo();
    this.attachEvents();
  }

  private async initVideo() {
    const video = this.container.querySelector('#proctor-pip-video') as HTMLVideoElement;
    const fallback = this.container.querySelector('#pip-fallback') as HTMLElement;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (this.mediaStream) {
        store.registerMediaStream(this.mediaStream);
      }
      if (video) {
        video.srcObject = this.mediaStream;
        if (fallback) fallback.style.display = 'none';
        
        // Start face absence tracking immediately
        video.play().catch(() => {});
        this.startFaceTrackerLoop(video);
      }
    } catch (e) {
      // Fallback
    }
  }

  private startFaceTrackerLoop(video: HTMLVideoElement) {
    if (this.analysisInterval) clearInterval(this.analysisInterval);
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.analysisInterval = setInterval(() => {
      const state = store.getState();
      if (!state.examStarted || state.examCompleted || !video) {
        return;
      }

      if (!this.canvas || !ctx) return;
      this.canvas.width = 160;
      this.canvas.height = 120;

      try {
        ctx.drawImage(video, 0, 0, 160, 120);
        const imgData = ctx.getImageData(0, 0, 160, 120);
        const data = imgData.data;

        let skinPixelCount = 0;
        let totalBrightness = 0;

        // Sample center frame region (30px to 130px X, 20px to 100px Y)
        for (let y = 20; y < 100; y += 4) {
          for (let x = 30; x < 130; x += 4) {
            const idx = (y * 160 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += luminance;

            // Skin tone color distribution check
            if (r > 50 && g > 30 && b > 15 && r > g && g > b && (r - Math.min(g, b)) > 12) {
              skinPixelCount++;
            }
          }
        }

        const sampledCount = (20 * 25);
        const avgBrightness = totalBrightness / sampledCount;

        // Trigger warning if skin pixel density is low (candidate turned away or left frame) or light is blocked
        if (skinPixelCount < 12 || avgBrightness < 15) {
          store.logProctoringViolation('No Face Detected', 'Candidate face turned away or not visible in camera frame!', 'high');
        } else {
          // Immediately clear warning popup as soon as face is detected!
          if (state.liveProctoringAlert?.includes('No Face Detected')) {
            store.clearProctoringAlert();
          }
        }
      } catch (e) {
        // Ignore frame capture error
      }
    }, 1000);
  }

  private attachEvents() {
    this.container.querySelector('#acknowledge-intercom-btn')?.addEventListener('click', () => {
      store.clearProctorIntercom();
    });

    window.onblur = () => {
      const state = store.getState();
      if (state.examStarted && !state.examCompleted) {
        store.logProctoringViolation('Tab Switch', 'Window focus lost (Tab switch or window navigation detected).', 'high');
      }
    };
  }
}
