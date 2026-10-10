import { portalSectionPath, router } from '../../router';
import {
  EmailGroupValues, GroupValues, SettingField, SettingValue, SettingsGroupSchema, adminApi,
} from '../../services/adminApi';
import { store } from '../../services/store';
import { badge, confirmDialog, errorText, esc, formatDateTime, toast } from '../../services/ui';
import { presetAuditFilters } from './AuditPanel';

/**
 * "Global System Settings" screen. Each settings group (proctoring, assessment, security, email, general) is its own
 * card with its own Save button and its own endpoint, and every form is generated from the server's schema, so the
 * labels, ranges and allowed values here can never drift from what the server really enforces.
 *
 * Unsaved edits are kept at module level (the app re-creates the page on every store change).
 */
type Values = GroupValues & Partial<EmailGroupValues>;

const model = {
  schema: null as SettingsGroupSchema[] | null,
  values: {} as Record<string, Values>,
  drafts: {} as Record<string, Record<string, SettingValue>>,
  fieldErrors: {} as Record<string, Record<string, string>>,
  groupErrors: {} as Record<string, string>,
  savedAt: {} as Record<string, string>,
  saving: {} as Record<string, boolean>,
  loadError: '',
  loading: false,
  email: { busy: '' as '' | 'probe' | 'test' | 'clear', to: '', result: null as null | { ok: boolean; text: string } },
};

const EMAIL_RE = /^[^@\s<>"',;]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
const HOST_RE = /^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
const BAD_TEXT_RE = /[\u0000-\u001f\u007f<>"]/;
/** SMTP host and port are owned by the server environment and cannot be changed in this form. */
const LOCKED_KEYS = new Set(['smtpHost', 'smtpPort']);
const SOURCE_TEXT = {
  database: 'A password is saved in the platform (encrypted).',
  environment: "Using the password from the server's .env file. Saving one here replaces it.",
  none: 'No password is configured: emails cannot be sent.',
};

let current: SettingsPanel | null = null;

// ------------------------------------------------------------------ model helpers
const serverValue = (group: string, key: string): SettingValue | undefined => model.values[group]?.[key] as SettingValue | undefined;
const shown = (group: string, key: string): SettingValue | undefined =>
  key in (model.drafts[group] || {}) ? model.drafts[group][key] : serverValue(group, key);

function dirtyKeys(group: string): string[] {
  const draft = model.drafts[group] || {};
  const fields = model.schema?.find(g => g.group === group)?.fields || [];
  return fields.filter(f => {
    if (LOCKED_KEYS.has(f.key)) return false;
    if (!(f.key in draft)) return false;
    if (f.secret) return String(draft[f.key]).length > 0;      // an empty password box means "leave unchanged"
    return draft[f.key] !== serverValue(group, f.key);
  }).map(f => f.key);
}

/** The same rules the server applies, so mistakes are shown next to the field before anything is sent. */
function validate(field: SettingField, raw: SettingValue | undefined): { value?: SettingValue; error?: string } {
  if (field.type === 'bool') return { value: Boolean(raw) };
  if (field.type === 'enum') {
    return field.choices?.includes(String(raw)) ? { value: String(raw) } : { error: 'Choose one of the listed options.' };
  }
  if (field.type === 'int') {
    const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (String(raw).trim() === '' || !Number.isInteger(n)) return { error: 'Enter a whole number.' };
    if (field.min != null && n < field.min) return { error: `Must be at least ${field.min}.` };
    if (field.max != null && n > field.max) return { error: `Must be at most ${field.max}.` };
    return { value: n };
  }
  const text = field.secret ? String(raw ?? '') : String(raw ?? '').trim();
  if (!text) return field.allowEmpty ? { value: '' } : { error: 'This cannot be empty.' };
  if (text.length > field.maxLength) return { error: `At most ${field.maxLength} characters.` };
  if (field.fmt === 'email' && !EMAIL_RE.test(text)) return { error: 'Enter a valid email address.' };
  if (field.fmt === 'hostname' && !HOST_RE.test(text)) return { error: 'Enter a host name such as smtp.gmail.com.' };
  if (field.fmt === 'text' && BAD_TEXT_RE.test(text)) return { error: 'Remove special characters such as < > ".' };
  return { value: text };
}

export class SettingsPanel {
  constructor(private root: HTMLElement) {}

  public mount(): void {
    current = this;
    this.paint();
    void load();
  }

  // ------------------------------------------------------------------ rendering
  public paint(): void {
    if (!this.root.isConnected) return;
    const scroll = window.scrollY;
    if (!model.schema) {
      this.root.innerHTML = `<div class="glass-panel p-6 rounded-3xl border border-slate-800">${
        model.loadError
          ? `<p class="text-xs text-red-400">${esc(model.loadError)}</p><button id="se-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`
          : '<p class="text-xs text-slate-500 font-mono">Loading settings…</p>'}</div>`;
      this.root.querySelector('#se-retry')?.addEventListener('click', () => void load());
      return;
    }
    this.root.innerHTML = `
      <div class="space-y-6">
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-white">Global Policy & System Settings</h2>
            <p class="text-xs text-slate-400 mt-0.5">Each section saves on its own and applies immediately. Every change is recorded in the audit log.</p>
          </div>
          <button id="se-history" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs whitespace-nowrap">📜 Settings history</button>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          ${model.schema.map(g => `<div id="set-card-${g.group}" class="scroll-mt-24 ${g.group === 'email' ? 'xl:col-span-2' : ''}">${this.cardHtml(g)}</div>`).join('')}
        </div>
      </div>`;
    this.root.querySelector('#se-history')?.addEventListener('click', () => {
      presetAuditFilters({ category: 'settings' });
      router.navigate(portalSectionPath('admin', 'audit'));
    });
    model.schema.forEach(g => this.bindCard(g));
    if (window.location.hash) this.focusHash();
    else window.scrollTo({ top: scroll });
  }

  /** Dashboard "Email settings →" / "Edit policy →" land on `#email` / `#proctoring`. */
  private focusHash(): void {
    const id = window.location.hash.replace(/^#/, '');
    if (!id) return;
    const el = this.root.querySelector<HTMLElement>(`#set-card-${id}`) || this.root.querySelector<HTMLElement>(`#${id}`);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-2', 'ring-blue-500/50');
      window.setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500/50'), 1800);
    });
  }

  private paintCard(group: string): void {
    const g = model.schema?.find(s => s.group === group);
    const host = this.root.querySelector<HTMLElement>(`#set-card-${group}`);
    if (!g || !host || !host.isConnected) return;
    host.innerHTML = this.cardHtml(g);
    this.bindCard(g);
  }

  private cardHtml(g: SettingsGroupSchema): string {
    const dirty = dirtyKeys(g.group).length;
    const saving = !!model.saving[g.group];
    const fields = g.fields.map(f => this.fieldHtml(g.group, f)).join('');
    const split = g.fields.filter(f => f.type === 'bool').length >= 3;
    return `
      <form data-group="${g.group}" novalidate class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 h-full">
        <div class="border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white">${esc(g.title)}</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">${esc(g.description)}</p>
        </div>
        <div class="${split || g.group === 'email' ? 'grid grid-cols-1 md:grid-cols-2 gap-x-5' : ''} gap-y-4 space-y-4 md:space-y-0 text-xs">${fields}</div>
        ${g.group === 'email' ? this.emailExtrasHtml() : ''}
        ${model.groupErrors[g.group] ? `<p class="text-xs font-semibold text-red-400 break-words" role="alert">${esc(model.groupErrors[g.group])}</p>` : ''}
        <div class="flex items-center justify-end gap-3 pt-1">
          <span data-status class="mr-auto text-[11px] ${dirty ? 'text-amber-400' : 'text-slate-500'}">${
            dirty ? `${dirty} unsaved change${dirty === 1 ? '' : 's'}` : model.savedAt[g.group] ? `Saved ${esc(formatDateTime(model.savedAt[g.group]))}` : ''}</span>
          <button type="button" data-discard ${dirty && !saving ? '' : 'disabled'} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs disabled:opacity-40">Discard</button>
          <button type="submit" data-save ${dirty && !saving ? '' : 'disabled'} class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md disabled:opacity-40">${saving ? 'SAVING…' : 'SAVE'}</button>
        </div>
      </form>`;
  }

  private fieldHtml(group: string, f: SettingField): string {
    const id = `set-${group}-${f.key}`;
    const value = shown(group, f.key);
    const error = model.fieldErrors[group]?.[f.key];
    const locked = LOCKED_KEYS.has(f.key);
    const range = f.type === 'int' && f.min != null && f.max != null ? ` (${f.min}–${f.max})` : '';
    const errorHtml = `<p data-error="${f.key}" class="text-[10px] text-red-400 mt-1 ${error ? '' : 'hidden'}">${esc(error || '')}</p>`;
    const control = `glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white${locked ? ' opacity-70 cursor-not-allowed' : ''}`;
    const lockAttr = locked ? ' readonly disabled tabindex="-1"' : '';

    if (f.type === 'bool') {
      return `
        <label class="flex items-start justify-between gap-4 cursor-pointer py-1" for="${id}">
          <span><span class="block font-semibold text-slate-300">${esc(f.label)}</span><span class="block text-[10px] text-slate-500">${esc(f.description)}</span></span>
          <input id="${id}" data-key="${f.key}" type="checkbox" ${value ? 'checked' : ''} class="mt-1 w-4 h-4 shrink-0 text-blue-600 bg-slate-950 border-slate-700 rounded" />
        </label>`;
    }
    let input: string;
    if (f.type === 'enum') {
      input = `<select id="${id}" data-key="${f.key}" class="${control} font-semibold">${(f.choices || []).map(c =>
        `<option value="${esc(c)}" ${String(value) === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>`;
    } else if (f.type === 'int') {
      input = `<input id="${id}" data-key="${f.key}" type="number" step="1" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} value="${esc(value ?? '')}" class="${control}"${lockAttr} />`;
    } else if (f.secret) {
      const set = model.values.email?.smtpPasswordSet;
      input = `<input id="${id}" data-key="${f.key}" type="password" autocomplete="new-password" value="${esc(value ?? '')}" placeholder="${set ? '•••••••• (leave empty to keep the current password)' : '16-character app password'}" class="${control} font-mono" />`;
    } else {
      input = `<input id="${id}" data-key="${f.key}" type="${f.fmt === 'email' ? 'email' : 'text'}" maxlength="${f.maxLength}" value="${esc(value ?? '')}" class="${control} ${f.fmt ? 'font-mono' : ''}"${lockAttr} />`;
    }
    return `
      <div>
        <label class="block font-semibold text-slate-300 mb-1" for="${id}">${esc(f.label)}</label>
        ${input}
        <p class="text-[10px] text-slate-500 mt-1">${esc(f.description)}${range}${locked ? ' Locked — this cannot be changed here.' : ''}</p>
        ${errorHtml}
      </div>`;
  }

  private emailExtrasHtml(): string {
    const v = model.values.email || ({} as Values);
    const source = (v.smtpPasswordSource || 'none') as keyof typeof SOURCE_TEXT;
    const busy = model.email.busy;
    const unsaved = dirtyKeys('email').length > 0;
    const result = model.email.result;
    return `
      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          ${badge(source === 'none' ? 'No password' : source === 'database' ? 'Password saved' : 'Password from .env', source === 'none' ? 'amber' : 'green')}
          <span class="text-slate-400">${SOURCE_TEXT[source]}</span>
        </div>
        ${unsaved ? '<p class="text-[11px] text-amber-400">Save your email changes first: the checks below use the saved settings.</p>' : ''}
        <div class="flex flex-wrap items-end gap-2">
          <button type="button" data-email="probe" ${busy ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-[11px] disabled:opacity-50">${busy === 'probe' ? 'Checking…' : '🔌 Check connection'}</button>
          <div class="flex items-end gap-2">
            <input id="se-test-to" type="email" value="${esc(model.email.to)}" placeholder="Send to (default: your 2FA email)" class="glass-input px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[11px] w-56" />
            <button type="button" data-email="test" ${busy ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 font-bold text-[11px] disabled:opacity-50">${busy === 'test' ? 'Sending…' : '✉ Send test email'}</button>
          </div>
          ${source === 'database' ? `<button type="button" data-email="clear" ${busy ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-[11px] disabled:opacity-50">Remove saved password</button>` : ''}
        </div>
        ${result ? `<p class="${result.ok ? 'text-emerald-400' : 'text-red-400'} font-semibold break-words" role="status">${result.ok ? '✓' : '✗'} ${esc(result.text)}</p>` : ''}
      </div>`;
  }

  // ------------------------------------------------------------------ events
  private bindCard(g: SettingsGroupSchema): void {
    const form = this.root.querySelector<HTMLFormElement>(`form[data-group="${g.group}"]`);
    if (!form) return;
    const fieldOf = (key: string) => g.fields.find(f => f.key === key)!;

    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key') as string;
      if (LOCKED_KEYS.has(key) || el.disabled) return;
      const onEdit = () => {
        const f = fieldOf(key);
        const raw = f.type === 'bool' ? (el as HTMLInputElement).checked : f.type === 'int' ? (el.value === '' ? '' : Number(el.value)) : el.value;
        (model.drafts[g.group] ||= {})[key] = raw as SettingValue;
        if (model.fieldErrors[g.group]) delete model.fieldErrors[g.group][key];
        form.querySelector(`[data-error="${key}"]`)?.classList.add('hidden');
        model.groupErrors[g.group] = '';
        this.refreshFooter(g.group, form);
      };
      el.addEventListener(el instanceof HTMLSelectElement || (el as HTMLInputElement).type === 'checkbox' ? 'change' : 'input', onEdit);
    });
    form.addEventListener('submit', e => { e.preventDefault(); void save(g); });
    form.querySelector('[data-discard]')?.addEventListener('click', () => {
      model.drafts[g.group] = {};
      model.fieldErrors[g.group] = {};
      model.groupErrors[g.group] = '';
      this.paintCard(g.group);
    });
    if (g.group === 'email') {
      const testTo = form.querySelector<HTMLInputElement>('#se-test-to');
      testTo?.addEventListener('input', e => { model.email.to = (e.target as HTMLInputElement).value; });
      testTo?.addEventListener('keydown', e => {   // Enter sends the test email, it must not submit (save) the form
        if (e.key === 'Enter') { e.preventDefault(); void emailAction('test'); }
      });
      form.querySelectorAll<HTMLElement>('[data-email]').forEach(b => b.addEventListener('click', () => void emailAction(b.getAttribute('data-email') as 'probe' | 'test' | 'clear')));
    }
  }

  /** Update only the Save / Discard buttons and the "n unsaved changes" text, so typing is never interrupted. */
  private refreshFooter(group: string, form: HTMLElement): void {
    const dirty = dirtyKeys(group).length;
    form.querySelectorAll<HTMLButtonElement>('[data-save],[data-discard]').forEach(b => { b.disabled = dirty === 0 || !!model.saving[group]; });
    const status = form.querySelector('[data-status]');
    if (status) {
      status.textContent = dirty ? `${dirty} unsaved change${dirty === 1 ? '' : 's'}` : (model.savedAt[group] ? `Saved ${formatDateTime(model.savedAt[group])}` : '');
      status.className = `mr-auto text-[11px] ${dirty ? 'text-amber-400' : 'text-slate-500'}`;
    }
  }

  public paintGroup(group: string): void { this.paintCard(group); }
}

// ------------------------------------------------------------------ data
async function load(): Promise<void> {
  model.loading = true;
  try {
    const [schema, values] = await Promise.all([adminApi.settings.schema(), adminApi.settings.all()]);
    model.schema = schema.groups;
    model.values = values as Record<string, Values>;
    model.loadError = '';
  } catch (e) {
    model.loadError = errorText(e);
  } finally {
    model.loading = false;
    current?.paint();
  }
}

async function save(g: SettingsGroupSchema): Promise<void> {
  const keys = dirtyKeys(g.group);
  if (!keys.length || model.saving[g.group]) return;

  const changes: Record<string, SettingValue> = {};
  const errors: Record<string, string> = {};
  keys.forEach(key => {
    if (LOCKED_KEYS.has(key)) return;
    const field = g.fields.find(f => f.key === key)!;
    const result = validate(field, model.drafts[g.group][key]);
    if (result.error) errors[key] = result.error;
    else changes[key] = result.value as SettingValue;
  });
  model.fieldErrors[g.group] = errors;
  if (Object.keys(errors).length) {
    model.groupErrors[g.group] = 'Fix the highlighted fields first.';
    current?.paintGroup(g.group);
    return;
  }

  model.saving[g.group] = true;
  model.groupErrors[g.group] = '';
  current?.paintGroup(g.group);
  try {
    model.values[g.group] = await adminApi.settings.update<Values>(g.group, changes);
    model.drafts[g.group] = {};
    model.savedAt[g.group] = new Date().toISOString();
    toast(`${g.title} saved. It applies immediately.`, 'success');
    if (g.group === 'proctoring' || g.group === 'assessment') void store.loadPolicy('staff');
  } catch (e) {
    model.groupErrors[g.group] = errorText(e);
  } finally {
    model.saving[g.group] = false;
    current?.paintGroup(g.group);
  }
}

async function emailAction(kind: 'probe' | 'test' | 'clear'): Promise<void> {
  if (model.email.busy) return;
  if (kind === 'clear' && !await confirmDialog({
    title: 'Remove the saved password?', confirmLabel: 'Remove', danger: true,
    message: "The platform will fall back to the password in the server's .env file (if there is one). Emails stop if there is none.",
  })) return;

  model.email.busy = kind;
  model.email.result = null;
  current?.paintGroup('email');
  try {
    if (kind === 'probe') {
      const r = await adminApi.dashboard.probeEmail();
      model.email.result = { ok: r.ok, text: r.message };
    } else if (kind === 'test') {
      const r = await adminApi.settings.testEmail(model.email.to.trim() || undefined);
      model.email.result = { ok: r.ok, text: r.ok ? `Test email sent to ${r.sentTo} through ${r.host}:${r.port}.` : r.message };
    } else {
      model.values.email = await adminApi.settings.clearEmailPassword() as Values;
      model.email.result = { ok: true, text: 'The saved password was removed.' };
      toast('Saved password removed.', 'success');
    }
  } catch (e) {
    model.email.result = { ok: false, text: errorText(e) };
  } finally {
    model.email.busy = '';
    current?.paintGroup('email');
  }
}
