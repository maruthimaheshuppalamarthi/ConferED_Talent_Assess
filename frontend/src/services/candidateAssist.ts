import { authApi } from './authApi';
import { store } from './store';

interface ChatMessage {
  from: 'proctor' | 'candidate';
  text: string;
  at: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function socketUrl(token: string): string {
  return `${authApi.apiBase.replace(/^http/, 'ws')}/ws/proctoring?token=${encodeURIComponent(token)}`;
}

/** Chat icon and one-way proctor audio for the signed-in candidate. */
class CandidateAssist {
  private root: HTMLElement | null = null;
  private ws: WebSocket | null = null;
  private open = false;
  private messages: ChatMessage[] = [];
  private speaking = false;
  private poll: number | null = null;
  private audioCtx: AudioContext | null = null;
  private playAt = 0;
  private publishTimer: number | null = null;
  private micBound: MediaStream | null = null;
  private micStop: (() => void) | null = null;

  mount() {
    if (!document.getElementById('candidate-assist')) {
      this.root = document.createElement('div');
      this.root.id = 'candidate-assist';
      document.body.appendChild(this.root);
      this.paint();
    }
    this.connect();
    this.watchGate();
  }

  hide() {
    this.root?.remove();
    this.root = null;
  }

  private connect() {
    const token = authApi.getCandidateToken();
    if (!token || (this.ws && this.ws.readyState <= WebSocket.OPEN)) return;
    this.ws = new WebSocket(socketUrl(token));
    this.ws.onopen = () => this.startPublisher();
    this.ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'history' && Array.isArray(data.messages)) {
        this.messages = data.messages.map((m: ChatMessage) => ({ from: m.from, text: m.text, at: m.at }));
        this.paint();
      } else if (data.type === 'chat' && data.from === 'proctor') {
        this.messages.push({ from: 'proctor', text: data.text, at: data.at });
        this.open = true;
        this.speaking = false;
        this.paint();
      } else if (data.type === 'audio' && typeof data.pcm === 'string') {
        this.speaking = true;
        this.paint();
        this.playPcm(data.pcm);
        window.setTimeout(() => {
          this.speaking = false;
          this.paint();
        }, 600);
      }
    };
    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  private watchGate() {
    if (this.poll) return;
    this.poll = window.setInterval(() => {
      const state = store.getState();
      if (!state.otpVerified || state.examStarted || state.examCompleted || state.candidateFeedback || !state.systemCheckCompleted || !state.activeCandidateId) return;
      authApi.fetchJson<{ admitted: boolean }>('/candidate/gate', 'GET', undefined, 'candidate').then(async gate => {
        const now = store.getState();
        if (!gate.admitted || now.examStarted || now.examCompleted || now.candidateFeedback || !state.activeCandidateId) return;
        store.approveCandidateIdentity(state.activeCandidateId);
        const { requestExamFullscreen } = await import('../modules/CandidatePortal');
        requestExamFullscreen();
      }).catch(() => undefined);
    }, 2000);
  }

  private playPcm(pcm: string) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!this.audioCtx) this.audioCtx = new Ctx({ sampleRate: 16000 });
    const ctx = this.audioCtx;
    ctx.resume().catch(() => undefined);
    const raw = Uint8Array.from(atob(pcm), c => c.charCodeAt(0));
    const samples = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 2));
    const buffer = ctx.createBuffer(1, samples.length, 16000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(ctx.destination);
    const now = ctx.currentTime;
    if (this.playAt < now) this.playAt = now + 0.02;
    node.start(this.playAt);
    this.playAt += buffer.duration;
  }

  reportFinished() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'finished' }));
  }

  reportViolation(event: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ event, severity, timestamp: new Date().toISOString() }));
  }

  sendSnapshot(image: string, reason: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!image.startsWith('data:image/jpeg') || image.length > 400000) return;
    this.ws.send(JSON.stringify({ type: 'snapshot', image, reason }));
  }

  private startPublisher() {
    if (this.publishTimer) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    this.publishTimer = window.setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !ctx) return;
      const video = ['#proctor-pip-video', '#stay-on-video', '#wait-cam', '#id-webcam']
        .map(sel => document.querySelector(sel) as HTMLVideoElement | null)
        .find(el => el && el.videoWidth > 0 && !el.classList.contains('hidden'));
      if (!video) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL('image/jpeg', 0.45);
      if (image.length < 140000) this.ws.send(JSON.stringify({ type: 'frame', image }));
      const stream = video.srcObject as MediaStream | null;
      if (stream) this.bindMic(stream);
    }, 800);
  }

  private bindMic(stream: MediaStream) {
    if (this.micBound === stream || !stream.getAudioTracks().length) return;
    this.micStop?.();
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx({ sampleRate: 16000 });
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(2048, 1, 1);
    const silent = ctx.createGain();
    silent.gain.value = 0;
    processor.onaudioprocess = (ev) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const input = ev.inputBuffer.getChannelData(0);
      const pcm = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const sample = Math.max(-1, Math.min(1, input[i]));
        pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }
      const bytes = new Uint8Array(pcm.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      this.ws.send(JSON.stringify({ type: 'mic', pcm: btoa(binary) }));
    };
    source.connect(processor);
    processor.connect(silent);
    silent.connect(ctx.destination);
    this.micBound = stream;
    this.micStop = () => {
      processor.disconnect();
      source.disconnect();
      ctx.close().catch(() => undefined);
      this.micBound = null;
    };
  }

  private send(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'chat', text }));
    this.messages.push({ from: 'candidate', text, at: new Date().toISOString() });
    this.paint('');
  }

  private paint(draft?: string) {
    if (!this.root) return;
    if (draft === undefined) {
      draft = (this.root.querySelector('#cand-chat-input') as HTMLInputElement | null)?.value || '';
    }
    this.root.innerHTML = `
      <button id="cand-chat-toggle" class="fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xl shadow-lg shadow-blue-600/30" title="Chat with the proctor">💬</button>
      ${this.speaking ? `<div class="fixed bottom-20 left-4 z-40 px-3 py-1.5 rounded-full bg-purple-600 text-white text-[11px] font-bold">Proctor is speaking</div>` : ''}
      ${this.open ? `
        <div class="fixed bottom-20 left-4 z-40 w-80 max-w-[calc(100vw-2rem)] glass-panel rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
          <div class="px-3 py-2 border-b border-slate-800 text-xs font-bold text-white">Proctor chat</div>
          <div id="cand-chat-log" class="h-56 overflow-y-auto p-3 space-y-2 text-xs">
            ${this.messages.map(m => `
              <div class="${m.from === 'candidate' ? 'text-right' : 'text-left'}">
                <span class="inline-block px-2.5 py-1.5 rounded-xl ${m.from === 'candidate' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100'}">${escapeHtml(m.text)}</span>
              </div>
            `).join('') || '<p class="text-slate-500">Message the proctor if you need help.</p>'}
          </div>
          <form id="cand-chat-form" class="flex gap-2 p-2 border-t border-slate-800">
            <input id="cand-chat-input" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Write a message" value="${escapeHtml(draft)}" />
            <button class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold" type="submit">Send</button>
          </form>
        </div>
      ` : ''}
    `;
    this.root.querySelector('#cand-chat-toggle')?.addEventListener('click', () => {
      this.open = !this.open;
      this.audioCtx?.resume().catch(() => undefined);
      this.paint();
    });
    this.root.querySelector('#cand-chat-form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = this.root?.querySelector('#cand-chat-input') as HTMLInputElement | null;
      const text = input?.value.trim() || '';
      if (!text) return;
      this.send(text);
    });
    const log = this.root.querySelector('#cand-chat-log');
    if (log) log.scrollTop = log.scrollHeight;
  }
}

export const candidateAssist = new CandidateAssist();
