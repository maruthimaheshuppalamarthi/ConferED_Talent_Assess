import { authApi } from './authApi';

export interface ChatMessage {
  from: 'proctor' | 'candidate';
  text: string;
  at: string;
}

export const threads: Record<string, ChatMessage[]> = {};
export const frames: Record<string, string> = {};
export const violationCounts: Record<string, number> = {};
export const unread: Record<string, number> = {};

let chatFocus = '';
let speakingTo = '';
let talkStop: (() => void) | null = null;

let socket: WebSocket | null = null;
let listeningId = '';
let playAt = 0;
let audioCtx: AudioContext | null = null;
const listeners = new Set<() => void>();

function socketUrl(token: string): string {
  return `${authApi.apiBase.replace(/^http/, 'ws')}/ws/proctoring?token=${encodeURIComponent(token)}`;
}

function notify() {
  listeners.forEach(fn => fn());
}

function playPcm(pcm: string) {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  if (!audioCtx) audioCtx = new Ctx({ sampleRate: 16000 });
  audioCtx.resume().catch(() => undefined);
  const raw = Uint8Array.from(atob(pcm), c => c.charCodeAt(0));
  const samples = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 2));
  const buffer = audioCtx.createBuffer(1, samples.length, 16000);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
  const node = audioCtx.createBufferSource();
  node.buffer = buffer;
  node.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  if (playAt < now) playAt = now + 0.02;
  node.start(playAt);
  playAt += buffer.duration;
}

export function ensureProctorSocket() {
  const token = authApi.getStaffToken();
  if (!token || (socket && socket.readyState <= WebSocket.OPEN)) return;
  socket = new WebSocket(socketUrl(token));
  socket.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    if (data.type === 'inbox' && data.threads) {
      Object.assign(threads, data.threads);
      notify();
    } else if (data.type === 'chat' && data.candidateId) {
      const list = threads[data.candidateId] || (threads[data.candidateId] = []);
      if (!list.some(m => m.at === data.at && m.text === data.text && m.from === data.from)) {
        list.push({ from: data.from, text: data.text, at: data.at });
        if (data.from === 'candidate' && chatFocus !== data.candidateId) {
          unread[data.candidateId] = (unread[data.candidateId] || 0) + 1;
        }
      }
      notify();
    } else if (data.type === 'session_ended') {
      notify();
    } else if (data.type === 'frame' && data.candidateId && typeof data.image === 'string') {
      frames[data.candidateId] = data.image;
      document.querySelectorAll<HTMLImageElement>(`[data-live-frame="${data.candidateId}"]`).forEach(img => {
        img.src = data.image;
        img.classList.remove('hidden');
      });
    } else if (data.type === 'mic' && data.candidateId === listeningId && typeof data.pcm === 'string') {
      playPcm(data.pcm);
    } else if (data.type === 'PROCTORING_EVENT' && data.candidateId) {
      violationCounts[data.candidateId] = Number(data.violations || 0);
      notify();
    }
  };
  socket.onclose = () => {
    socket = null;
  };
}

export function onProctorUpdate(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function sendProctor(payload: object) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

export function setListening(candidateId: string) {
  listeningId = candidateId;
  audioCtx?.resume().catch(() => undefined);
}

export function focusChat(candidateId: string) {
  chatFocus = candidateId;
  if (candidateId) unread[candidateId] = 0;
  notify();
}

export function isSpeakingTo(candidateId: string) {
  return speakingTo === candidateId;
}

export function stopSpeaking() {
  talkStop?.();
  talkStop = null;
  speakingTo = '';
  notify();
}

export async function startSpeaking(candidateId: string) {
  stopSpeaking();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const ctx = new AudioContext({ sampleRate: 16000 });
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(2048, 1, 1);
  const silent = ctx.createGain();
  silent.gain.value = 0;
  processor.onaudioprocess = (ev) => {
    const input = ev.inputBuffer.getChannelData(0);
    const pcm = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    const bytes = new Uint8Array(pcm.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    sendProctor({ type: 'audio', candidateId, pcm: btoa(binary) });
  };
  source.connect(processor);
  processor.connect(silent);
  silent.connect(ctx.destination);
  speakingTo = candidateId;
  talkStop = () => {
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach(track => track.stop());
    ctx.close().catch(() => undefined);
  };
  notify();
}

export function currentSocket() {
  return socket;
}
