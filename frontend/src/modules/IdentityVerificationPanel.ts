import { authApi } from '../services/authApi';
import { ensureProctorSocket, focusChat, frames, isSpeakingTo, onProctorUpdate, sendProctor, startSpeaking, stopSpeaking, threads, unread } from '../services/proctorSocket';

interface QueueItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  examTitle: string;
  idDocumentType: string | null;
  identityStatus: string;
  hasPhoto: boolean;
  hasId: boolean;
}

const ID_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar',
  pan: 'PAN card',
  voter_id: 'Voter ID',
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));


async function imageUrl(candidateId: string, kind: 'photo' | 'id'): Promise<string> {
  const token = authApi.getStaffToken();
  const res = await fetch(`${authApi.apiBase}/api/v1/proctor/identity/${candidateId}/${kind}.jpg`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('missing');
  return URL.createObjectURL(await res.blob());
}

/** Identity review: photos from the bucket, admit, one-way audio, and chat. */
export class IdentityVerificationPanel {
  private container: HTMLElement;
  private items: QueueItem[] = [];
  private photos: Record<string, { face?: string; id?: string }> = {};
  private error = '';
  private openChat = '';
  private tab: 'pending' | 'completed' = 'pending';
  private stopWatch: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.stopWatch = onProctorUpdate(() => {
      if (this.items.length) this.paint();
    });
  }

  public render() {
    ensureProctorSocket();
    if (!this.items.length && !this.error) {
      this.container.innerHTML = `<p class="text-xs text-slate-400">Loading candidates who uploaded a photo or ID...</p>`;
      this.load().catch(e => {
        this.error = e instanceof Error ? e.message : 'Could not load the identity queue.';
        this.paint();
      });
      return;
    }
    this.paint();
  }

  private async load() {
    const data = await authApi.fetchJson<{ items: QueueItem[] }>('/proctor/identity', 'GET', undefined, 'staff');
    this.items = data.items;
    await Promise.all(data.items.map(async item => {
      const slot = this.photos[item.id] || (this.photos[item.id] = {});
      if (item.hasPhoto && !slot.face) {
        slot.face = await imageUrl(item.id, 'photo').catch(() => '');
      }
      if (item.hasId && !slot.id) {
        slot.id = await imageUrl(item.id, 'id').catch(() => '');
      }
    }));
    this.paint();
  }

  private paint() {
    const shown = this.items.filter(item => this.tab === 'pending'
      ? item.identityStatus !== 'approved'
      : item.identityStatus === 'approved');
    this.container.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div class="border-b border-slate-800 pb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-white">Candidate photo and government ID</h2>
            <p class="text-xs text-slate-400 mt-1">Pending candidates can be admitted. Completed candidates move to live monitoring.</p>
          </div>
          <div class="flex gap-2">
            <button type="button" data-tab="pending" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tab === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}">Pending</button>
            <button type="button" data-tab="completed" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tab === 'completed' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}">Completed</button>
          </div>
        </div>
        ${this.error ? `<p class="text-xs text-red-400">${escapeHtml(this.error)}</p>` : ''}
        ${shown.length === 0 ? `<p class="text-xs text-slate-500">${this.tab === 'pending' ? 'No one is waiting.' : 'No one has been admitted yet.'}</p>` : ''}
        <div class="space-y-6">
          ${shown.map(item => this.tab === 'pending' ? this.pendingCard(item) : this.completedCard(item)).join('')}
        </div>
      </div>
    `;
    this.bind();
  }

  private pendingCard(item: QueueItem): string {
    const photos = this.photos[item.id] || {};
    const doc = item.idDocumentType ? (ID_LABELS[item.idDocumentType] || item.idDocumentType) : 'Government ID';
    const chat = threads[item.id] || [];
    return `
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-white">${escapeHtml(item.name)}</h3>
            <p class="text-xs text-slate-300">${escapeHtml(item.examTitle || 'Assessment')}</p>
            <p class="text-xs text-slate-400">${escapeHtml(item.email)}</p>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-amber-500/20 text-amber-400">Pending</span>
        </div>
        <div class="space-y-1">
          <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Live camera</span>
          <div class="relative w-full max-w-sm aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            ${frames[item.id]
              ? `<img data-live-frame="${item.id}" src="${frames[item.id]}" alt="" class="w-full h-full object-cover" />`
              : `<img data-live-frame="${item.id}" alt="" class="w-full h-full object-cover hidden" /><div class="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">Waiting for the candidate camera</div>`}
          </div>
        </div>
        <div class="flex flex-wrap gap-4">
          ${this.shot('Live photo', photos.face)}
          ${this.shot(doc, photos.id)}
        </div>
        <div class="flex flex-wrap gap-2">
          <button data-admit="${item.id}" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
            Approve and admit
          </button>
          <button data-talk="${item.id}" class="px-4 py-2 rounded-xl text-xs font-bold border ${isSpeakingTo(item.id) ? 'bg-red-600 text-white border-red-500' : 'bg-purple-600/20 text-purple-300 border-purple-500/40'}">
            ${isSpeakingTo(item.id) ? 'Stop speaking' : 'Speak to candidate'}
          </button>
          <button data-chat="${item.id}" class="relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
            Chat
            ${unread[item.id] ? `<span class="absolute -top-2 -right-2 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[1.15rem]">${unread[item.id]}</span>` : ''}
          </button>
        </div>
        ${this.openChat === item.id ? `
          <div class="rounded-xl border border-slate-800 bg-slate-950">
            <div class="h-40 overflow-y-auto p-3 space-y-2 text-xs" data-log="${item.id}">
              ${chat.map(m => `<div class="${m.from === 'proctor' ? 'text-right' : ''}"><span class="inline-block px-2 py-1 rounded-lg ${m.from === 'proctor' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-100'}">${escapeHtml(m.text)}</span></div>`).join('') || '<p class="text-slate-500">No messages yet.</p>'}
            </div>
            <form data-send="${item.id}" class="flex gap-2 p-2 border-t border-slate-800">
              <input data-input="${item.id}" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Message the candidate" />
              <button class="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold" type="submit">Send</button>
            </form>
          </div>
        ` : ''}
      </div>
    `;
  }

  private completedCard(item: QueueItem): string {
    const photos = this.photos[item.id] || {};
    const doc = item.idDocumentType ? (ID_LABELS[item.idDocumentType] || item.idDocumentType) : 'Government ID';
    return `
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div>
          <h3 class="text-sm font-bold text-white">${escapeHtml(item.name)}</h3>
          <p class="text-xs text-slate-400">${escapeHtml(item.examTitle || 'Assessment')}</p>
        </div>
        <div class="flex flex-wrap gap-4">
          ${this.shot('Live photo', photos.face)}
          ${this.shot(doc, photos.id)}
        </div>
      </div>
    `;
  }

  private shot(label: string, src?: string): string {
    return `
      <div class="space-y-1">
        <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</span>
        ${src ? `<img src="${src}" class="w-40 h-28 rounded-xl object-cover border border-slate-700 bg-slate-950" />` : `<div class="w-40 h-28 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-xs">No image</div>`}
      </div>
    `;
  }

  private bind() {
    this.container.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tab = (btn.getAttribute('data-tab') as 'pending' | 'completed') || 'pending';
        this.paint();
      });
    });
    this.container.querySelectorAll<HTMLButtonElement>('[data-admit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-admit');
        if (!id) return;
        authApi.fetchJson(`/proctor/identity/${id}/admit`, 'POST', {}, 'staff').then(() => this.load()).catch(e => {
          this.error = e instanceof Error ? e.message : 'Could not admit the candidate.';
          this.paint();
        });
      });
    });
    this.container.querySelectorAll<HTMLButtonElement>('[data-talk]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-talk') || '';
        if (isSpeakingTo(id)) stopSpeaking();
        else void startSpeaking(id);
      });
    });
    this.container.querySelectorAll<HTMLButtonElement>('[data-chat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-chat') || '';
        this.openChat = this.openChat === id ? '' : id;
        focusChat(this.openChat);
      });
    });
    this.container.querySelectorAll<HTMLFormElement>('[data-send]').forEach(form => {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const id = form.getAttribute('data-send') || '';
        const input = form.querySelector('input') as HTMLInputElement | null;
        const text = input?.value.trim() || '';
        if (!text) return;
        sendProctor({ type: 'chat', candidateId: id, text });
        if (input) input.value = '';
      });
    });
  }

}
