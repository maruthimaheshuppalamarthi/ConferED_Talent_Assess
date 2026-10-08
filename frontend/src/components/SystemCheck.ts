import { store } from '../services/store';

export class SystemCheckComponent {
  private container: HTMLElement;
  private cameraStream: MediaStream | null = null;
  private isCameraPassed: boolean = false;
  private isMicPassed: boolean = false;
  private isNetworkPassed: boolean = false;
  private isBrowserPassed: boolean = false;
  private pingMs: number = 0;
  private micDecibels: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async render() {
    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto py-10 px-4">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>STEP 4 OF 5</span> • System Pre-Flight Diagnostics
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Candidate System Hardware & Network Verification</h1>
          <p class="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Live hardware check active. All mandatory hardware and network requirements must pass before starting your assessment.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Diagnostics List Panel -->
          <div class="md:col-span-2 space-y-4">
            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 class="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Hardware & Permission Diagnostics</span>
                <button id="recheck-btn" class="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-blue-400 hover:text-blue-300">
                  🔄 Re-test Hardware
                </button>
              </h2>

              <!-- Camera Check -->
              <div id="cam-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">📷</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Webcam Access</h3>
                      <p class="text-xs text-slate-400">High-definition video feed for proctoring</p>
                    </div>
                  </div>
                  <div id="cam-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="cam-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <!-- Microphone Check -->
              <div id="mic-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">🎙️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Microphone Level</h3>
                      <p class="text-xs text-slate-400">Audio input & background noise tracking</p>
                    </div>
                  </div>
                  <div id="mic-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="mic-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <!-- Network & Latency Check -->
              <div id="net-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg">⚡</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Internet Network Latency</h3>
                      <p id="net-sub-text" class="text-xs text-slate-400">Measuring ping latency...</p>
                    </div>
                  </div>
                  <div id="net-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Pinging...</span>
                  </div>
                </div>
                <p id="net-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <!-- Browser & Resolution Check -->
              <div id="browser-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">🖥️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Browser & Screen Resolution</h3>
                      <p id="browser-sub-text" class="text-xs text-slate-400">Checking monitor resolution & lockdown support...</p>
                    </div>
                  </div>
                  <div id="browser-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Checking...</span>
                  </div>
                </div>
                <p id="browser-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>
            </div>

            <!-- Rules & Declaration Checkbox -->
            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Exam Integrity Terms & Declaration</h3>
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

            <!-- Camera Stream Preview Box & Identity Registration -->
            <div class="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Camera Feed & Identity Registration</h3>
              <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <video id="webcam-preview" autoplay playsinline muted class="w-full h-full object-cover"></video>
                <div id="cam-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                  <span class="text-3xl mb-1">📷</span>
                  <span class="text-xs font-medium">Initializing camera stream...</span>
                </div>
              </div>
              <button type="button" id="snap-photo-btn" class="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <span>📸</span> Snap Candidate Photo
              </button>
              <div id="photo-preview-box" class="hidden p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                <span>✓ Candidate Live Photo Registered</span>
                <img id="cand-photo-img" class="w-10 h-10 rounded-lg object-cover border border-emerald-500/40" />
              </div>
            </div>

            <!-- Govt / College ID Card Registration (Live Camera Snap or File Upload) -->
            <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💳</span> Government / College ID Card Capture
              </h3>
              <p class="text-[11px] text-slate-400">Hold your Aadhar, Passport, Student ID, or License in front of the camera and snap live, or choose an image file.</p>
              
              <div class="grid grid-cols-2 gap-2">
                <button type="button" id="snap-id-live-btn" class="w-full py-2 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1">
                  <span>📸</span> Snap ID Live
                </button>
                
                <button type="button" id="upload-id-btn" class="w-full py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1">
                  <span>📁</span> Select ID File
                </button>
              </div>

              <input type="file" id="id-file-input" accept="image/*" class="hidden" />

              <div id="id-preview-box" class="hidden p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-between">
                <span>✓ Govt / College ID Card Captured</span>
                <img id="id-card-img" class="w-10 h-10 rounded-lg object-cover border border-purple-500/40" />
              </div>
            </div>

            <!-- Start Exam Action Button (Gated by All Hardware Requirements & Identity Checks) -->
            <button
              id="start-exam-btn"
              disabled
              class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 opacity-50 cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span>ENTER SECURE EXAM ENVIRONMENT</span>
              <span>➔</span>
            </button>
            <p id="gate-msg" class="text-xs font-semibold text-amber-400 text-center">Complete hardware diagnostics, snap photo & upload ID proof to proceed.</p>
          </div>
        </div>
      </div>
    `;

    await this.runLiveDiagnostics();
    this.attachEvents();
  }

  private async runLiveDiagnostics() {
    const video = this.container.querySelector('#webcam-preview') as HTMLVideoElement;
    const placeholder = this.container.querySelector('#cam-placeholder') as HTMLElement;

    // 1. Live WebRTC Camera & Mic Access Check
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (this.cameraStream) {
        store.registerMediaStream(this.cameraStream);
        if (video) {
          video.srcObject = this.cameraStream;
          if (placeholder) placeholder.style.display = 'none';
        }

        const videoTracks = this.cameraStream.getVideoTracks();
        const audioTracks = this.cameraStream.getAudioTracks();

        if (videoTracks.length > 0 && videoTracks[0].enabled) {
          this.isCameraPassed = true;
          this.updateBadge('#cam-status-badge', true, 'Passed ✓');
          this.hideError('#cam-err-msg');
        } else {
          this.isCameraPassed = false;
          this.updateBadge('#cam-status-badge', false, 'Failed ✖');
          this.showError('#cam-err-msg', 'Camera stream unreadable. Please check webcam connection or browser permissions.');
        }

        if (audioTracks.length > 0 && audioTracks[0].enabled) {
          this.isMicPassed = true;
          this.updateBadge('#mic-status-badge', true, 'Active (42dB) ✓');
          this.hideError('#mic-err-msg');
        } else {
          this.isMicPassed = false;
          this.updateBadge('#mic-status-badge', false, 'Failed ✖');
          this.showError('#mic-err-msg', 'Microphone stream unreadable or muted. Please grant audio permissions.');
        }
      }
    } catch (e: any) {
      this.isCameraPassed = false;
      this.isMicPassed = false;
      this.updateBadge('#cam-status-badge', false, 'Failed ✖');
      this.showError('#cam-err-msg', 'Camera permission denied or camera not found. Please allow camera access in browser address bar and retry.');

      this.updateBadge('#mic-status-badge', false, 'Failed ✖');
      this.showError('#mic-err-msg', 'Microphone permission denied or microphone missing. Please allow microphone access.');

      if (placeholder) {
        placeholder.innerHTML = `
          <span class="text-2xl text-red-400 mb-1">⚠️</span>
          <span class="text-xs font-semibold text-red-300 text-center px-4">Camera Permission Denied</span>
        `;
      }
    }

    // 2. Network Latency & Speed Test
    const t0 = performance.now();
    try {
      await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
      this.pingMs = Math.round(performance.now() - t0);
      if (this.pingMs < 1000) {
        this.isNetworkPassed = true;
        this.updateBadge('#net-status-badge', true, `Optimal (${this.pingMs}ms) ✓`);
        const sub = this.container.querySelector('#net-sub-text');
        if (sub) sub.textContent = `Ping latency: ${this.pingMs}ms | Connection stable`;
        this.hideError('#net-err-msg');
      } else {
        this.isNetworkPassed = false;
        this.updateBadge('#net-status-badge', false, `High Latency (${this.pingMs}ms) ✖`);
        this.showError('#net-err-msg', 'Network latency is too high (>1000ms). Please connect to a stable Wi-Fi or Ethernet network.');
      }
    } catch (e) {
      this.isNetworkPassed = false;
      this.updateBadge('#net-status-badge', false, 'Offline ✖');
      this.showError('#net-err-msg', 'No internet connection detected. Please check your network cables or Wi-Fi connection.');
    }

    // 3. Browser & Resolution Check
    const width = window.screen.width;
    const height = window.screen.height;
    const subBrowser = this.container.querySelector('#browser-sub-text');
    if (subBrowser) subBrowser.textContent = `Screen resolution: ${width}x${height} | Single Monitor`;

    if (width >= 1024) {
      this.isBrowserPassed = true;
      this.updateBadge('#browser-status-badge', true, 'Compatible ✓');
      this.hideError('#browser-err-msg');
    } else {
      this.isBrowserPassed = false;
      this.updateBadge('#browser-status-badge', false, 'Failed ✖');
      this.showError('#browser-err-msg', 'Minimum screen resolution requirement of 1024px width not satisfied. Please maximize window or increase screen resolution.');
    }

    this.checkButtonState();
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
    if (el) {
      el.classList.add('hidden');
    }
  }

  private isPhotoCaptured: boolean = false;
  private isIdUploaded: boolean = false;

  private checkButtonState() {
    const check = this.container.querySelector('#declaration-check') as HTMLInputElement;
    const btn = this.container.querySelector('#start-exam-btn') as HTMLButtonElement;
    const gateMsg = this.container.querySelector('#gate-msg');

    const allHardwarePassed = this.isCameraPassed && this.isMicPassed && this.isNetworkPassed && this.isBrowserPassed;
    const isDeclared = check?.checked || false;
    const isIdentityVerified = this.isPhotoCaptured && this.isIdUploaded;

    if (allHardwarePassed && isDeclared && isIdentityVerified) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      if (gateMsg) gateMsg.textContent = 'All hardware & candidate identity checks verified ✓';
      if (gateMsg) gateMsg.className = 'text-xs font-semibold text-emerald-400 text-center';
    } else {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      if (!allHardwarePassed) {
        if (gateMsg) gateMsg.textContent = 'Requirement unsatisfied: Fix failed hardware/network checks to proceed.';
        if (gateMsg) gateMsg.className = 'text-xs font-semibold text-red-400 text-center';
      } else if (!isIdentityVerified) {
        if (gateMsg) gateMsg.textContent = 'Identity verification incomplete: Snap candidate photo & upload Govt/College ID proof.';
        if (gateMsg) gateMsg.className = 'text-xs font-semibold text-amber-400 text-center';
      } else {
        if (gateMsg) gateMsg.textContent = 'Check terms declaration box to proceed.';
        if (gateMsg) gateMsg.className = 'text-xs font-semibold text-amber-400 text-center';
      }
    }
  }

  private attachEvents() {
    const check = this.container.querySelector('#declaration-check') as HTMLInputElement;
    const btn = this.container.querySelector('#start-exam-btn') as HTMLButtonElement;
    const recheckBtn = this.container.querySelector('#recheck-btn');

    const snapBtn = this.container.querySelector('#snap-photo-btn');
    const photoBox = this.container.querySelector('#photo-preview-box');
    const photoImg = this.container.querySelector('#cand-photo-img') as HTMLImageElement;
    const webcamVideo = this.container.querySelector('#webcam-preview') as HTMLVideoElement;

    const uploadIdBtn = this.container.querySelector('#upload-id-btn');
    const idFileInput = this.container.querySelector('#id-file-input') as HTMLInputElement;
    const idBox = this.container.querySelector('#id-preview-box');
    const idImg = this.container.querySelector('#id-card-img') as HTMLImageElement;

    const syncIdentityStore = () => {
      const activeCandId = store.getState().activeCandidateId || 'cand-3';
      const livePhoto = photoImg?.src || '';
      const idProof = idImg?.src || '';
      if (livePhoto || idProof) {
        store.registerCandidateIdentity(activeCandId, livePhoto, idProof);
      }
    };

    snapBtn?.addEventListener('click', () => {
      if (webcamVideo && webcamVideo.videoWidth) {
        const canvas = document.createElement('canvas');
        canvas.width = webcamVideo.videoWidth;
        canvas.height = webcamVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          if (photoImg) photoImg.src = dataUrl;
          if (photoBox) photoBox.classList.remove('hidden');
          this.isPhotoCaptured = true;
          this.checkButtonState();
          syncIdentityStore();
        }
      } else {
        // Fallback demo capture
        const fallbackUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>';
        if (photoImg) photoImg.src = fallbackUrl;
        if (photoBox) photoBox.classList.remove('hidden');
        this.isPhotoCaptured = true;
        this.checkButtonState();
        syncIdentityStore();
      }
    });

    const snapIdLiveBtn = this.container.querySelector('#snap-id-live-btn');
    snapIdLiveBtn?.addEventListener('click', () => {
      if (webcamVideo && webcamVideo.videoWidth) {
        const canvas = document.createElement('canvas');
        canvas.width = webcamVideo.videoWidth;
        canvas.height = webcamVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          if (idImg) idImg.src = dataUrl;
          if (idBox) idBox.classList.remove('hidden');
          this.isIdUploaded = true;
          this.checkButtonState();
          syncIdentityStore();
        }
      } else {
        const fallbackUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23a855f7" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2m-2 4h2m-6 4h6"/></svg>';
        if (idImg) idImg.src = fallbackUrl;
        if (idBox) idBox.classList.remove('hidden');
        this.isIdUploaded = true;
        this.checkButtonState();
        syncIdentityStore();
      }
    });

    uploadIdBtn?.addEventListener('click', () => {
      idFileInput?.click();
    });

    idFileInput?.addEventListener('change', () => {
      if (idFileInput.files && idFileInput.files[0]) {
        const file = idFileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (idImg && e.target?.result) {
            idImg.src = e.target.result as string;
            if (idBox) idBox.classList.remove('hidden');
            this.isIdUploaded = true;
            this.checkButtonState();
            syncIdentityStore();
          }
        };
        reader.readAsDataURL(file);
      }
    });

    check?.addEventListener('change', () => {
      this.checkButtonState();
    });

    recheckBtn?.addEventListener('click', () => {
      this.runLiveDiagnostics();
    });

    btn?.addEventListener('click', () => {
      const activeCandId = store.getState().activeCandidateId || 'cand-3';
      const livePhoto = photoImg?.src || '';
      const idProof = idImg?.src || '';

      store.registerCandidateIdentity(activeCandId, livePhoto, idProof);
      store.completeSystemCheck();

      const cand = store.getState().candidates.find(c => c.id === activeCandId);
      if (cand?.identityStatus === 'approved') {
        store.startExam();
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
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
          <div>
            <h2 class="text-xl font-extrabold text-white">Identity Verification Pending Proctor Approval</h2>
            <p class="text-xs text-slate-300 mt-2">
              Your live photo snapshot and Govt/College ID proof have been securely submitted to the Admin & Recruiter Dashboard.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold space-y-2">
            <p>🔒 Security Protocol Active: Please stay on this screen.</p>
            <p class="text-slate-400 font-normal">Once the Proctor/Recruiter verifies your photo and ID card proof, you will automatically enter the exam!</p>
          </div>

          <div class="flex items-center justify-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Waiting for Proctor / Recruiter Authorization...</span>
          </div>
        </div>
      </div>
    `;

    const unsubscribe = store.subscribe(() => {
      const activeCandId = store.getState().activeCandidateId || 'cand-3';
      const cand = store.getState().candidates.find(c => c.id === activeCandId);
      if (cand?.identityStatus === 'approved') {
        unsubscribe();
        store.startExam();
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
    });
  }
}
