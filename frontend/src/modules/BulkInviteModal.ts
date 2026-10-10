import { ApiError } from '../services/authApi';
import { BulkInviteBatch, recruiterApi } from '../services/recruiterApi';

/** Drag-drop Excel/CSV bulk invite with preview + progress polling. */
export class BulkInviteModal {
  private host: HTMLElement;
  private assessmentId: string;
  private jobTitle: string;
  private batch: BulkInviteBatch | null = null;
  private forceResend = false;
  private pollTimer: number | null = null;
  private busy = false;
  private error = '';

  constructor(host: HTMLElement, assessmentId: string, jobTitle = '') {
    this.host = host;
    this.assessmentId = assessmentId;
    this.jobTitle = jobTitle;
  }

  public open() {
    this.batch = null;
    this.error = '';
    this.forceResend = false;
    this.paint();
  }

  public destroy() {
    if (this.pollTimer) window.clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.host.innerHTML = '';
  }

  private paint() {
    const b = this.batch;
    const processing = b && ['queued', 'processing'].includes(b.status);
    this.host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 class="text-lg font-extrabold text-white">Bulk Invite</h3>
              <p class="text-xs text-slate-400 mt-0.5">Upload .xlsx / .xls / .csv — Name + Email required${this.jobTitle ? ` · ${esc(this.jobTitle)}` : ''}</p>
            </div>
            <button id="bulk-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          ${!b ? `
            <label id="bulk-drop" class="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 cursor-pointer hover:border-blue-500/50 transition-colors">
              <span class="text-3xl">📤</span>
              <span class="text-sm font-bold text-white">Drop spreadsheet here or click to browse</span>
              <span class="text-[11px] text-slate-500">Columns: Name, Email, Phone, Organisation, Role, Source. Role is the open job. Source is Campus Hire, Regular, or Referral.</span>
              <input id="bulk-file" type="file" accept=".csv,.xlsx,.xls" class="hidden" />
            </label>
          ` : `
            <div class="flex flex-wrap gap-2 text-[11px] font-bold">
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Valid ${b.validRows}</span>
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20">File dupes ${b.duplicateInFile}</span>
              <span class="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/20">DB dupes ${b.duplicateInDb}</span>
              <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">Total ${b.totalRows}</span>
              ${b.sent != null ? `<span class="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20">Sent ${b.sent}</span>` : ''}
              ${b.failed != null ? `<span class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/20">Failed ${b.failed}</span>` : ''}
              <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 uppercase">${esc(b.status)}</span>
            </div>

            ${b.status === 'preview' ? `
              <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input id="bulk-force" type="checkbox" ${this.forceResend ? 'checked' : ''} class="rounded border-slate-600" />
                Resend to candidates who already have an active invite
              </label>
            ` : ''}

            ${processing || b.status === 'completed' ? `
              <div class="space-y-2">
                ${bar('Sent', b.sent || 0, b.totalRows, 'bg-blue-500')}
                ${bar('Failed', b.failed || 0, b.totalRows, 'bg-red-500')}
                ${bar('Skipped', b.skipped || 0, b.totalRows, 'bg-amber-500')}
              </div>
            ` : ''}

            <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-64">
              <table class="w-full text-[11px]">
                <thead class="bg-slate-900 text-slate-400 sticky top-0">
                  <tr>
                    <th class="text-left px-3 py-2">#</th>
                    <th class="text-left px-3 py-2">Name</th>
                    <th class="text-left px-3 py-2">Email</th>
                    <th class="text-left px-3 py-2">Status</th>
                    <th class="text-left px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${b.rows.map(r => `
                    <tr class="border-t border-slate-800/80">
                      <td class="px-3 py-1.5 text-slate-500 font-mono">${r.rowNumber}</td>
                      <td class="px-3 py-1.5 text-white">${esc(r.name)}</td>
                      <td class="px-3 py-1.5 text-slate-300">${esc(r.email)}</td>
                      <td class="px-3 py-1.5"><span class="px-1.5 py-0.5 rounded ${statusTone(r.deliveryStatus)}">${esc(r.deliveryStatus)}</span></td>
                      <td class="px-3 py-1.5 text-red-400">${esc((r.validationErrors || []).join('; ') || r.dedupeReason || r.errorMessage || '')}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          `}

          ${this.error ? `<p class="text-xs text-red-400 font-semibold">${esc(this.error)}</p>` : ''}

          <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <button type="button" id="bulk-sample" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 font-bold text-xs border border-slate-700">
              Download sample template
            </button>
            <div class="flex gap-3">
              <button id="bulk-close-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Close</button>
              ${b?.status === 'preview' ? `
                <button id="bulk-confirm" ${this.busy ? 'disabled' : ''} class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs">
                  ${this.busy ? 'Sending…' : 'Confirm & Dispatch'}
                </button>
              ` : ''}
              ${b && (b.failed || 0) > 0 && b.status === 'completed' ? `
                <button id="bulk-retry" class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs">Retry Failed</button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>`;

    this.bind();
  }

  private bind() {
    const close = () => this.destroy();
    this.host.querySelector('#bulk-close')?.addEventListener('click', close);
    this.host.querySelector('#bulk-close-2')?.addEventListener('click', close);
    this.host.querySelector('#bulk-sample')?.addEventListener('click', () => downloadSampleTemplate());

    const fileInput = this.host.querySelector('#bulk-file') as HTMLInputElement | null;
    const drop = this.host.querySelector('#bulk-drop');
    fileInput?.addEventListener('change', () => {
      const f = fileInput.files?.[0];
      if (f) void this.preview(f);
    });
    drop?.addEventListener('dragover', e => { e.preventDefault(); });
    drop?.addEventListener('drop', e => {
      e.preventDefault();
      const f = (e as DragEvent).dataTransfer?.files?.[0];
      if (f) void this.preview(f);
    });

    this.host.querySelector('#bulk-force')?.addEventListener('change', e => {
      this.forceResend = (e.target as HTMLInputElement).checked;
    });
    this.host.querySelector('#bulk-confirm')?.addEventListener('click', () => void this.confirm());
    this.host.querySelector('#bulk-retry')?.addEventListener('click', () => void this.retry());
  }

  private async preview(file: File) {
    this.error = '';
    this.busy = true;
    this.paint();
    try {
      this.batch = await recruiterApi.bulkPreview(this.assessmentId, file);
    } catch (e) {
      this.error = e instanceof ApiError ? e.message : 'Upload failed.';
    } finally {
      this.busy = false;
      this.paint();
    }
  }

  private async confirm() {
    if (!this.batch) return;
    this.busy = true;
    this.error = '';
    this.paint();
    try {
      this.batch = await recruiterApi.bulkConfirm(this.batch.batchId, {
        forceResend: this.forceResend,
        expiresInHours: 48,
      });
      this.startPoll();
    } catch (e) {
      this.error = e instanceof ApiError ? e.message : 'Confirm failed.';
    } finally {
      this.busy = false;
      this.paint();
    }
  }

  private async retry() {
    if (!this.batch) return;
    try {
      this.batch = await recruiterApi.bulkRetryFailed(this.batch.batchId);
      this.startPoll();
      this.paint();
    } catch (e) {
      this.error = e instanceof ApiError ? e.message : 'Retry failed.';
      this.paint();
    }
  }

  private startPoll() {
    if (this.pollTimer) window.clearInterval(this.pollTimer);
    this.pollTimer = window.setInterval(async () => {
      if (!this.batch) return;
      try {
        this.batch = await recruiterApi.bulkStatus(this.batch.batchId);
        this.paint();
        if (this.batch.status === 'completed' || this.batch.status === 'failed') {
          if (this.pollTimer) window.clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
      } catch {
        // keep polling
      }
    }, 2000);
  }
}

const downloadSampleTemplate = () => {
  const csv = [
    'Name,Email,Phone,Organisation,Role,Source',
    'Jane Doe,jane.doe@example.com,+1-555-0100,State University,DevOps Engineer,Campus Hire',
    'Alex Chen,alex.chen@example.com,+1-555-0101,Tech Corp,Senior Software Engineer,Referral',
    'Priya Shah,priya.shah@example.com,+1-555-0102,City College,DevOps Engineer,Regular',
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bulk_invite_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const statusTone = (s: string) => {
  if (s === 'SENT') return 'bg-blue-500/20 text-blue-300';
  if (s === 'FAILED') return 'bg-red-500/20 text-red-300';
  if (s === 'DUPLICATE_SKIPPED') return 'bg-amber-500/20 text-amber-300';
  if (s === 'COMPLETED' || s === 'STARTED') return 'bg-emerald-500/20 text-emerald-300';
  return 'bg-slate-800 text-slate-400';
};

const bar = (label: string, n: number, total: number, color: string) => {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return `
    <div class="flex items-center gap-3 text-[11px]">
      <span class="w-14 text-slate-400 font-bold">${label}</span>
      <div class="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden">
        <div class="h-full ${color}" style="width:${pct}%"></div>
      </div>
      <span class="w-10 text-right font-mono text-slate-300">${n}</span>
    </div>`;
};
