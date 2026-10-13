import { ApiError, authApi } from '../services/authApi';
import { store } from '../services/store';

type GovtIdType = 'aadhaar' | 'pan' | 'voter_id';

interface CheckSnapshot {
  cameraPassed: boolean;
  microphonePassed: boolean;
  microphoneDb: number | null;
  networkPassed: boolean;
  pingMs: number | null;
  downloadMbps: number | null;
  browserPassed: boolean;
  screenWidth: number;
  screenHeight: number;
  singleMonitor: boolean | null;
}

interface IdentitySaveResult {
  candidateId: string;
  name: string;
  email: string;
  livePhotoStored: boolean;
  idProofStored: boolean;
  idDocumentType: string | null;
}

const GOVT_ID_LABELS: Record<GovtIdType, string> = {
  aadhaar: 'Aadhaar',
  pan: 'PAN card',
  voter_id: 'Voter ID',
};

export class SystemCheckComponent {
  private container: HTMLElement;
  private cameraStream: MediaStream | null = null;
  private isCameraPassed = false;
  private isMicPassed = false;
  private isNetworkPassed = false;
  private isBrowserPassed = false;
  private downloadMbps = 0;
  private previewTarget: 'face' | 'id' | 'exam' | 'off' = 'off';
  private singleMonitor: boolean | null = null;
  private screenWidth = 0;
  private screenHeight = 0;
  private isPhotoCaptured = false;
  private isIdUploaded = false;
  private photoJpeg = '';
  private idJpeg = '';
  private idType: GovtIdType | '' = '';
  private savingPhoto = false;
  private savingId = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async render() {
    this.container.innerHTML = `
      <div class="max-w-6xl mx-auto py-10 px-4">
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>STEP 4 OF 5</span> • System Pre-Flight Diagnostics
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Candidate System Hardware & Network Verification</h1>
          <p class="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Camera, microphone, and internet speed are measured on this device. Download speed must be at least 5 Mbps.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 class="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Hardware & Permission Diagnostics</span>
                <button id="recheck-btn" class="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-blue-400 hover:text-blue-300">
                  🔄 Re-test Hardware
                </button>
              </h2>

              <div id="cam-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">📷</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Webcam Access</h3>
                      <p class="text-xs text-slate-400">Live video frames from this device</p>
                    </div>
                  </div>
                  <div id="cam-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="cam-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="mic-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">🎙️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Microphone</h3>
                      <p id="mic-sub-text" class="text-xs text-slate-400">Checking that the microphone is on...</p>
                    </div>
                  </div>
                  <div id="mic-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="mic-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="net-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg">⚡</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Internet Speed</h3>
                      <p id="net-sub-text" class="text-xs text-slate-400">Measuring download speed. Minimum 5 Mbps.</p>
                    </div>
                  </div>
                  <div id="net-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="net-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="browser-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">🖥️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Browser & Screen</h3>
                      <p id="browser-sub-text" class="text-xs text-slate-400">Checking resolution and monitors...</p>
                    </div>
                  </div>
                  <div id="browser-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Checking...</span>
                  </div>
                </div>
                <p id="browser-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>
              <p id="checks-save-status" class="text-[11px] text-slate-500 hidden"></p>
            </div>

            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Exam Integrity Terms & Declaration</h3>
              <ul class="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                <li>I understand that tab switching or exiting fullscreen will log a violation.</li>
                <li>I confirm that I am sitting alone in a well-lit environment without unauthorized materials.</li>
                <li>I accept continuous webcam, microphone, and screen monitoring during the assessment.</li>
              </ul>
              <label class="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 cursor-pointer">
                <input id="declaration-check" type="checkbox" class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" />
                <span class="text-xs font-semibold text-slate-200">I have read, understood, and accept all exam proctoring guidelines.</span>
              </label>
            </div>
          </div>

          <div class="space-y-4">
            <div class="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-3">
              <h3 id="camera-feed-title" class="text-xs font-bold text-slate-300 uppercase tracking-wider">Candidate photo</h3>
              <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <video id="webcam-preview" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
                <img id="face-still" alt="Captured candidate photo" class="hidden absolute inset-0 w-full h-full object-cover" />
                <div id="cam-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                  <span class="text-3xl mb-1">📷</span>
                  <span class="text-xs font-medium">Initializing camera stream...</span>
                </div>
              </div>
              <p id="camera-mode-label" class="text-[11px] text-slate-400">Live camera. Capture your photo, then the camera turns off.</p>
              <button type="button" id="snap-photo-btn" class="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <span>📸</span> Snap Candidate Photo
              </button>
              <div id="photo-preview-box" class="hidden p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-2">
                <span id="photo-preview-label">Candidate photo</span>
                <img id="cand-photo-img" alt="Candidate photo" class="w-10 h-10 rounded-lg object-cover border border-emerald-500/40" />
              </div>
              <p id="photo-save-status" class="text-[11px] font-semibold text-left hidden"></p>
            </div>

            <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💳</span> Government ID Capture
              </h3>
              <p class="text-[11px] text-slate-400">Choose the ID type. The same camera starts here. After you capture the card, the camera stays on.</p>
              <label class="block text-[11px] font-semibold text-slate-300" for="govt-id-type">Government ID type</label>
              <select id="govt-id-type" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100">
                <option value="">Choose a government ID</option>
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN card</option>
                <option value="voter_id">Voter ID</option>
              </select>
              <div id="id-camera-box" class="hidden relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                <video id="id-webcam" autoplay playsinline muted class="w-full h-full object-cover"></video>
                <img id="id-still" alt="Captured government ID" class="hidden absolute inset-0 w-full h-full object-cover" />
                <div id="id-cam-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                  <span class="text-3xl mb-1">💳</span>
                  <span class="text-xs font-medium">Starting camera...</span>
                </div>
              </div>
              <p id="id-camera-hint" class="text-[11px] text-slate-500">Camera is off until you choose an ID type.</p>
              <button type="button" id="snap-id-live-btn" disabled class="w-full py-2 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 opacity-50 cursor-not-allowed">
                <span>📸</span> Capture ID
              </button>
              <div id="id-preview-box" class="hidden p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-between gap-2">
                <span id="id-preview-label">Government ID</span>
                <img id="id-card-img" alt="Government ID" class="w-10 h-10 rounded-lg object-cover border border-purple-500/40" />
              </div>
              <p id="id-save-status" class="text-[11px] font-semibold hidden"></p>
              <div id="stay-on-box" class="hidden space-y-2">
                <p class="text-[11px] font-semibold text-emerald-400">Camera is on and stays on.</p>
                <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-emerald-500/30 overflow-hidden">
                  <video id="stay-on-video" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
                </div>
              </div>
            </div>

            <button
              id="start-exam-btn"
              disabled
              class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 opacity-50 cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span>ENTER SECURE EXAM ENVIRONMENT</span>
              <span>➔</span>
            </button>
            <p id="gate-msg" class="text-xs font-semibold text-amber-400 text-center">Complete the checks, then save your photo and government ID.</p>
          </div>
        </div>
      </div>
    `;

    await this.runLiveDiagnostics();
    this.attachEvents();
  }

  private snapshot(): CheckSnapshot {
    return {
      cameraPassed: this.isCameraPassed,
      microphonePassed: this.isMicPassed,
      microphoneDb: null,
      networkPassed: this.isNetworkPassed,
      pingMs: null,
      downloadMbps: this.isNetworkPassed ? Math.round(this.downloadMbps * 10) / 10 : null,
      browserPassed: this.isBrowserPassed,
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      singleMonitor: this.singleMonitor,
    };
  }

  private async runLiveDiagnostics() {
    const video = this.container.querySelector('#webcam-preview') as HTMLVideoElement;
    const placeholder = this.container.querySelector('#cam-placeholder') as HTMLElement;

    if (this.previewTarget !== 'exam') this.stopCamera();
    if (this.isPhotoCaptured) {
      this.isCameraPassed = true;
      this.isMicPassed = true;
    } else try {
      await this.startPreview('face');
      const videoTrack = this.cameraStream?.getVideoTracks()[0];
      if (videoTrack && videoTrack.readyState === 'live' && video && video.videoWidth > 0) {
        this.isCameraPassed = true;
        this.updateBadge('#cam-status-badge', true, 'Live ✓');
        this.hideError('#cam-err-msg');
      } else {
        this.isCameraPassed = false;
        this.updateBadge('#cam-status-badge', false, 'No frames ✖');
        this.showError('#cam-err-msg', 'The webcam opened but no video frames arrived. Check that it is not in use by another app, then re-test.');
      }

      const audioTrack = this.cameraStream?.getAudioTracks()[0];
      if (audioTrack && audioTrack.readyState === 'live' && audioTrack.enabled) {
        this.isMicPassed = true;
        this.updateBadge('#mic-status-badge', true, 'Live ✓');
        const micSub = this.container.querySelector('#mic-sub-text');
        if (micSub) micSub.textContent = 'Microphone is on.';
        this.hideError('#mic-err-msg');
      } else {
        this.isMicPassed = false;
        this.updateBadge('#mic-status-badge', false, 'Failed ✖');
        this.showError('#mic-err-msg', 'No live microphone. Allow microphone access and re-test.');
      }
    } catch {
      this.isCameraPassed = false;
      this.isMicPassed = false;
      this.updateBadge('#cam-status-badge', false, 'Failed ✖');
      this.showError('#cam-err-msg', 'Camera permission denied or no camera found. Allow camera access in the address bar and re-test.');
      this.updateBadge('#mic-status-badge', false, 'Failed ✖');
      this.showError('#mic-err-msg', 'Microphone permission denied or no microphone found. Allow microphone access and re-test.');
      if (placeholder) {
        placeholder.innerHTML = `
          <span class="text-2xl text-red-400 mb-1">⚠️</span>
          <span class="text-xs font-semibold text-red-300 text-center px-4">Camera permission denied</span>
        `;
      }
    }

    try {
      if (navigator.onLine === false) throw new Error('This device reports that it is offline.');
      this.downloadMbps = await this.measureDownloadMbps();
      const shown = (Math.round(this.downloadMbps * 10) / 10).toFixed(1);
      const sub = this.container.querySelector('#net-sub-text');
      if (this.downloadMbps >= 5) {
        this.isNetworkPassed = true;
        this.updateBadge('#net-status-badge', true, `${shown} Mbps ✓`);
        if (sub) sub.textContent = `Download speed ${shown} Mbps. Minimum is 5 Mbps.`;
        this.hideError('#net-err-msg');
      } else {
        this.isNetworkPassed = false;
        this.updateBadge('#net-status-badge', false, `${shown} Mbps ✖`);
        if (sub) sub.textContent = `Download speed ${shown} Mbps.`;
        this.showError('#net-err-msg', 'Internet speed must be at least 5 Mbps. Move to a faster connection and re-test.');
      }
    } catch (e) {
      this.isNetworkPassed = false;
      this.downloadMbps = 0;
      this.updateBadge('#net-status-badge', false, 'Failed ✖');
      const reason = e instanceof Error ? e.message : 'The speed test did not finish.';
      this.showError('#net-err-msg', reason);
      const sub = this.container.querySelector('#net-sub-text');
      if (sub) sub.textContent = 'Could not measure download speed.';
    }

    this.screenWidth = window.screen.width;
    this.screenHeight = window.screen.height;
    const extended = (window.screen as Screen & { isExtended?: boolean }).isExtended;
    this.singleMonitor = typeof extended === 'boolean' ? !extended : null;
    const monitorText = this.singleMonitor === null
      ? 'monitor count not reported'
      : this.singleMonitor ? 'one monitor' : 'more than one monitor';
    const subBrowser = this.container.querySelector('#browser-sub-text');
    if (subBrowser) subBrowser.textContent = `Screen ${this.screenWidth}×${this.screenHeight} • ${monitorText}`;

    const fullscreenOk = typeof document.documentElement.requestFullscreen === 'function';
    if (this.screenWidth >= 1024 && fullscreenOk && this.singleMonitor !== false) {
      this.isBrowserPassed = true;
      this.updateBadge('#browser-status-badge', true, 'Compatible ✓');
      this.hideError('#browser-err-msg');
    } else {
      this.isBrowserPassed = false;
      this.updateBadge('#browser-status-badge', false, 'Failed ✖');
      const reasons = [];
      if (this.screenWidth < 1024) reasons.push('the screen must be at least 1024 px wide');
      if (!fullscreenOk) reasons.push('this browser cannot enter fullscreen');
      if (this.singleMonitor === false) reasons.push('disconnect extra monitors and use a single screen');
      this.showError('#browser-err-msg', reasons.join('; ') + '.');
    }

    this.checkButtonState();
    void this.recordChecks();
  }

  private waitForVideo(video: HTMLVideoElement): Promise<void> {
    if (video.videoWidth > 0) return Promise.resolve();
    return new Promise(resolve => {
      const done = () => resolve();
      video.addEventListener('loadeddata', done, { once: true });
      window.setTimeout(done, 2000);
    });
  }

  private stopCamera() {
    this.cameraStream?.getTracks().forEach(track => track.stop());
    this.cameraStream = null;
    this.previewTarget = 'off';
    for (const id of ['#webcam-preview', '#id-webcam']) {
      const video = this.container.querySelector(id) as HTMLVideoElement | null;
      if (video) video.srcObject = null;
    }
  }

  private async startPreview(target: 'face' | 'id') {
    this.stopCamera();
    const video = this.container.querySelector(target === 'face' ? '#webcam-preview' : '#id-webcam') as HTMLVideoElement | null;
    const placeholder = this.container.querySelector(target === 'face' ? '#cam-placeholder' : '#id-cam-placeholder') as HTMLElement | null;
    if (!video) throw new Error('Camera preview is not on the page.');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true,
    });
    this.cameraStream = stream;
    this.previewTarget = target;
    store.registerMediaStream(stream);
    video.classList.remove('hidden');
    video.srcObject = stream;
    await this.waitForVideo(video);
    if (placeholder && video.videoWidth > 0) placeholder.style.display = 'none';
  }

  private async measureDownloadMbps(): Promise<number> {
    const token = authApi.getCandidateToken();
    const started = performance.now();
    const res = await fetch(`${authApi.apiBase}/api/v1/candidate/speed-sample`, {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`The speed test failed (${res.status}).`);
    const bytes = await res.arrayBuffer();
    const seconds = (performance.now() - started) / 1000;
    if (seconds <= 0 || bytes.byteLength < 100000) throw new Error('The speed test did not return enough data.');
    return (bytes.byteLength * 8) / (seconds * 1_000_000);
  }

  private async recordChecks() {
    const status = this.container.querySelector('#checks-save-status');
    try {
      const saved = await this.postIdentity('checks');
      if (status) {
        status.textContent = `Checks saved for ${saved.name} (${saved.email}).`;
        status.className = 'text-[11px] font-semibold text-emerald-400';
      }
    } catch (e) {
      if (status) {
        status.textContent = this.errorText(e);
        status.className = 'text-[11px] font-semibold text-red-400';
      }
    }
  }

  private updateBadge(selector: string, passed: boolean, text: string) {
    const badge = this.container.querySelector(selector);
    if (badge) {
      badge.innerHTML = `
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${
          passed
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }">${text}</span>
      `;
    }
  }

  private showError(selector: string, msg: string) {
    const el = this.container.querySelector(selector);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  private hideError(selector: string) {
    const el = this.container.querySelector(selector);
    if (el) el.classList.add('hidden');
  }

  private checkButtonState() {
    const check = this.container.querySelector('#declaration-check') as HTMLInputElement | null;
    const btn = this.container.querySelector('#start-exam-btn') as HTMLButtonElement | null;
    const gateMsg = this.container.querySelector('#gate-msg');
    if (!btn || !gateMsg) return;

    const allHardwarePassed = this.isCameraPassed && this.isMicPassed && this.isNetworkPassed && this.isBrowserPassed;
    const isDeclared = Boolean(check?.checked);
    const identityReady = this.isPhotoCaptured && this.isIdUploaded && !this.savingPhoto && !this.savingId;

    if (allHardwarePassed && isDeclared && identityReady) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      gateMsg.textContent = 'Checks passed. Photo and government ID are saved as JPEG.';
      gateMsg.className = 'text-xs font-semibold text-emerald-400 text-center';
    } else {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      if (!allHardwarePassed) {
        gateMsg.textContent = 'Fix the failed camera, microphone, network, or screen check, then re-test.';
        gateMsg.className = 'text-xs font-semibold text-red-400 text-center';
      } else if (!identityReady) {
        gateMsg.textContent = 'Snap your photo and a government ID. Each one is saved as a JPEG when you click it.';
        gateMsg.className = 'text-xs font-semibold text-amber-400 text-center';
      } else {
        gateMsg.textContent = 'Accept the exam terms to continue.';
        gateMsg.className = 'text-xs font-semibold text-amber-400 text-center';
      }
    }
  }

  private errorText(e: unknown): string {
    return e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not save. Please try again.';
  }

  private setStatus(selector: string, message: string, ok: boolean) {
    const el = this.container.querySelector(selector);
    if (!el) return;
    el.textContent = message;
    el.className = `text-[11px] font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`;
    el.classList.remove('hidden');
  }

  private frameToJpeg(source: CanvasImageSource, width: number, height: number): string {
    const maxWidth = 960;
    const scale = width > maxWidth ? maxWidth / width : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser could not create the JPEG.');
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const jpeg = canvas.toDataURL('image/jpeg', 0.82);
    if (!jpeg.startsWith('data:image/jpeg')) throw new Error('This browser could not encode a JPEG.');
    return jpeg;
  }

  private captureVideoJpeg(video: HTMLVideoElement): string {
    if (!video.videoWidth) throw new Error('The camera has no picture yet. Allow the webcam and re-test.');
    return this.frameToJpeg(video, video.videoWidth, video.videoHeight);
  }

  private async postIdentity(kind: 'photo' | 'id' | 'checks', image?: string): Promise<IdentitySaveResult> {
    const body: Record<string, unknown> = { kind, systemCheck: this.snapshot() };
    if (image) body.image = image;
    if (kind === 'id') body.idDocumentType = this.idType;
    return authApi.fetchJson<IdentitySaveResult>('/candidate/identity', 'POST', body, 'candidate');
  }

  private remember(saved: IdentitySaveResult) {
    store.registerCandidateIdentity(
      saved.candidateId,
      saved.livePhotoStored ? this.photoJpeg : '',
      saved.idProofStored ? this.idJpeg : '',
      { name: saved.name, email: saved.email },
    );
  }

  private selectedIdType(): GovtIdType | '' {
    const select = this.container.querySelector('#govt-id-type') as HTMLSelectElement | null;
    const value = select?.value || '';
    return value in GOVT_ID_LABELS ? value as GovtIdType : '';
  }

  private freezeFace(jpeg: string) {
    this.stopCamera();
    const video = this.container.querySelector('#webcam-preview') as HTMLVideoElement | null;
    const still = this.container.querySelector('#face-still') as HTMLImageElement | null;
    const note = this.container.querySelector('#camera-mode-label');
    const btn = this.container.querySelector('#snap-photo-btn') as HTMLButtonElement | null;
    if (video) video.classList.add('hidden');
    if (still) {
      still.src = jpeg;
      still.classList.remove('hidden');
    }
    if (note) note.textContent = 'Camera off. Your photo is saved.';
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  private keepCameraOn(jpeg: string) {
    const video = this.container.querySelector('#id-webcam') as HTMLVideoElement | null;
    const still = this.container.querySelector('#id-still') as HTMLImageElement | null;
    const box = this.container.querySelector('#id-camera-box');
    const hint = this.container.querySelector('#id-camera-hint');
    const btn = this.container.querySelector('#snap-id-live-btn') as HTMLButtonElement | null;
    const stayBox = this.container.querySelector('#stay-on-box');
    const stayVideo = this.container.querySelector('#stay-on-video') as HTMLVideoElement | null;
    box?.classList.remove('hidden');
    if (video) {
      video.classList.add('hidden');
      video.srcObject = null;
    }
    if (still) {
      still.src = jpeg;
      still.classList.remove('hidden');
    }
    stayBox?.classList.remove('hidden');
    if (stayVideo && this.cameraStream) stayVideo.srcObject = this.cameraStream;
    this.previewTarget = 'exam';
    if (hint) hint.textContent = 'ID saved. The camera is on and stays on.';
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  private async startIdCamera() {
    if (!this.isPhotoCaptured) {
      this.setStatus('#id-save-status', 'Capture your photo first. The camera starts here after that.', false);
      const select = this.container.querySelector('#govt-id-type') as HTMLSelectElement | null;
      if (select) select.value = '';
      this.idType = '';
      return;
    }
    const box = this.container.querySelector('#id-camera-box');
    const hint = this.container.querySelector('#id-camera-hint');
    const btn = this.container.querySelector('#snap-id-live-btn') as HTMLButtonElement | null;
    box?.classList.remove('hidden');
    if (hint) hint.textContent = 'Starting the camera...';
    await this.startPreview('id');
    if (hint) hint.textContent = 'Camera is on. Hold the ID up to this camera, then capture it.';
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  private async savePhoto(jpeg: string) {
    const img = this.container.querySelector('#cand-photo-img') as HTMLImageElement | null;
    const box = this.container.querySelector('#photo-preview-box');
    const label = this.container.querySelector('#photo-preview-label');
    this.photoJpeg = jpeg;
    if (img) img.src = jpeg;
    if (box) box.classList.remove('hidden');
    if (label) label.textContent = 'Saving JPEG...';
    this.savingPhoto = true;
    this.isPhotoCaptured = false;
    this.checkButtonState();
    try {
      const saved = await this.postIdentity('photo', jpeg);
      this.remember(saved);
      this.isPhotoCaptured = saved.livePhotoStored;
      if (this.isPhotoCaptured) this.freezeFace(jpeg);
      if (label) label.textContent = 'Saved as JPEG';
      this.setStatus('#photo-save-status', `Photo saved for ${saved.name} (${saved.email}). Camera off.`, true);
    } catch (e) {
      this.isPhotoCaptured = false;
      if (label) label.textContent = 'Not saved';
      this.setStatus('#photo-save-status', this.errorText(e), false);
    } finally {
      this.savingPhoto = false;
      this.checkButtonState();
    }
  }

  private async saveId(jpeg: string) {
    this.idType = this.selectedIdType();
    if (!this.idType) {
      this.setStatus('#id-save-status', 'Choose Aadhaar, PAN card, or Voter ID first.', false);
      return;
    }
    const img = this.container.querySelector('#id-card-img') as HTMLImageElement | null;
    const box = this.container.querySelector('#id-preview-box');
    const label = this.container.querySelector('#id-preview-label');
    this.idJpeg = jpeg;
    if (img) img.src = jpeg;
    if (box) box.classList.remove('hidden');
    if (label) label.textContent = 'Saving JPEG...';
    this.savingId = true;
    this.isIdUploaded = false;
    this.checkButtonState();
    try {
      const saved = await this.postIdentity('id', jpeg);
      this.remember(saved);
      this.isIdUploaded = saved.idProofStored;
      const docName = GOVT_ID_LABELS[this.idType];
      if (this.isIdUploaded && this.previewTarget === 'id') this.keepCameraOn(jpeg);
      if (label) label.textContent = `${docName} saved as JPEG`;
      this.setStatus('#id-save-status', `${docName} saved for ${saved.name} (${saved.email}). Camera is on.`, true);
    } catch (e) {
      this.isIdUploaded = false;
      if (label) label.textContent = 'Not saved';
      this.setStatus('#id-save-status', this.errorText(e), false);
    } finally {
      this.savingId = false;
      this.checkButtonState();
    }
  }

  private attachEvents() {
    const check = this.container.querySelector('#declaration-check') as HTMLInputElement | null;
    const btn = this.container.querySelector('#start-exam-btn') as HTMLButtonElement | null;
    const recheckBtn = this.container.querySelector('#recheck-btn');
    const snapBtn = this.container.querySelector('#snap-photo-btn');
    const webcamVideo = this.container.querySelector('#webcam-preview') as HTMLVideoElement | null;
    const snapIdLiveBtn = this.container.querySelector('#snap-id-live-btn');
    const idType = this.container.querySelector('#govt-id-type') as HTMLSelectElement | null;

    snapBtn?.addEventListener('click', () => {
      void (async () => {
        if (!webcamVideo || this.previewTarget !== 'face') return;
        try {
          const jpeg = this.captureVideoJpeg(webcamVideo);
          await this.savePhoto(jpeg);
        } catch (e) {
          this.setStatus('#photo-save-status', this.errorText(e), false);
        }
      })();
    });

    snapIdLiveBtn?.addEventListener('click', () => {
      void (async () => {
        const idVideo = this.container.querySelector('#id-webcam') as HTMLVideoElement | null;
        if (!this.selectedIdType()) {
          this.setStatus('#id-save-status', 'Choose Aadhaar, PAN card, or Voter ID first.', false);
          return;
        }
        if (!idVideo || this.previewTarget !== 'id') {
          this.setStatus('#id-save-status', 'Choose the ID type so the camera starts in this section.', false);
          return;
        }
        try {
          const jpeg = this.captureVideoJpeg(idVideo);
          await this.saveId(jpeg);
        } catch (e) {
          this.setStatus('#id-save-status', this.errorText(e), false);
        }
      })();
    });

    idType?.addEventListener('change', () => {
      this.idType = this.selectedIdType();
      if (!this.idType) return;
      if (this.isIdUploaded && this.idJpeg) {
        void this.saveId(this.idJpeg);
        return;
      }
      this.startIdCamera().catch(e => this.setStatus('#id-save-status', this.errorText(e), false));
    });

    check?.addEventListener('change', () => this.checkButtonState());

    recheckBtn?.addEventListener('click', () => {
      this.runLiveDiagnostics().catch(e => console.error('Hardware diagnostics failed', e));
    });

    btn?.addEventListener('click', () => {
      if (!this.isPhotoCaptured || !this.isIdUploaded) return;
      const activeCandId = store.getState().activeCandidateId;
      if (!activeCandId) return;
      store.completeSystemCheck();

      const cand = store.getState().candidates.find(c => c.id === activeCandId);
      if (cand?.identityStatus === 'approved') {
        store.startExam();
        document.documentElement.requestFullscreen?.().catch(() => undefined);
      } else {
        this.renderWaitingForApprovalScreen();
      }
    });
  }

  private renderWaitingForApprovalScreen() {
    this.container.innerHTML = `
      <div class="max-w-xl mx-auto py-16 px-4 text-center">
        <div class="glass-panel p-8 rounded-3xl border border-amber-500/30 bg-slate-950/90 space-y-6 shadow-2xl">
          <div class="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-4xl mx-auto animate-pulse">
            ⏳
          </div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mx-auto mb-1">
            <span>✓ Check-in Verification Completed</span>
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-white">Identity & Hardware Verification Confirmed</h2>
            <p class="text-xs text-slate-300 mt-2">
              Your live photo, government ID, and hardware diagnostics have been verified.
            </p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold space-y-2">
            <p class="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
              <span>⏱️ Check-in window active (up to 30 min prior)</span>
            </p>
            <p class="text-slate-300 font-normal">Security protocol active: please stay on this screen. Your assessment will begin promptly at the scheduled start time once admitted by the proctor.</p>
          </div>
          <div class="flex items-center justify-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Waiting for proctor authorization...</span>
          </div>
          <div class="text-left space-y-2">
            <p class="text-[11px] font-semibold text-emerald-400">Camera is on and stays on.</p>
            <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-emerald-500/30 overflow-hidden">
              <video id="wait-cam" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
            </div>
          </div>
        </div>
      </div>
    `;

    const waitVideo = this.container.querySelector('#wait-cam') as HTMLVideoElement | null;
    const live = this.cameraStream?.getVideoTracks().some(track => track.readyState === 'live')
      ? this.cameraStream
      : null;
    if (waitVideo && live) {
      waitVideo.srcObject = live;
    } else if (waitVideo) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }).then(stream => {
        this.cameraStream = stream;
        store.registerMediaStream(stream);
        waitVideo.srcObject = stream;
      }).catch(() => undefined);
    }

    const unsubscribe = store.subscribe(() => {
      const activeCandId = store.getState().activeCandidateId;
      const cand = store.getState().candidates.find(c => c.id === activeCandId);
      if (cand?.identityStatus === 'approved') {
        unsubscribe();
        store.startExam();
        document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
    });
  }
}
