import { store } from '../services/store';

/** Identity & ID Verification (Proctor portal): approve candidates and start room-scan intercom calls. */
export class IdentityVerificationPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const state = store.getState();
    this.container.innerHTML = `
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span>📸</span> Candidate Live Photo & Govt/College ID Verification Hub
              </h2>
              <p class="text-xs text-slate-400">Review live snapped candidate photos, uploaded Govt/College ID card proofs, authorize exam entry, or launch 360° room inspection intercom calls.</p>
            </div>
          </div>

          <div class="space-y-6">
            ${state.candidates.map(c => {
              const safeLivePhoto = c.livePhotoUrl ? c.livePhotoUrl.replace(/"/g, "'") : '';
              const safeIdProof = c.idProofUrl ? c.idProofUrl.replace(/"/g, "'") : '';
              return `
                <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-bold text-white">${c.name}</h3>
                      <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        c.identityStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }">
                        ${c.identityStatus === 'approved' ? '✓ APPROVED & ALLOWED' : '⏳ PENDING VERIFICATION'}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400">${c.email} • ${c.phone}</p>
                    <p class="text-[11px] text-slate-500 font-mono">Candidate ID: ${c.id} • Registered: ${c.invitedAt}</p>
                  </div>

                  <div class="flex flex-wrap items-center gap-4">
                    <!-- Live Photo Thumbnail -->
                    <div class="space-y-1 text-center">
                      <span class="block text-[10px] font-bold text-blue-400 uppercase tracking-wider">📸 Live Snapped Photo</span>
                      ${safeLivePhoto ? `
                        <img src="${safeLivePhoto}" class="w-32 h-24 rounded-xl border border-slate-700 object-cover bg-slate-950 shadow-md" />
                      ` : `
                        <div class="w-32 h-24 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 text-xs">
                          <span>📷</span> No Photo
                        </div>
                      `}
                    </div>

                    <!-- Govt / College ID Card Thumbnail -->
                    <div class="space-y-1 text-center">
                      <span class="block text-[10px] font-bold text-purple-400 uppercase tracking-wider">💳 Govt / College ID Proof</span>
                      ${safeIdProof ? `
                        <img src="${safeIdProof}" class="w-32 h-24 rounded-xl border border-slate-700 object-cover bg-slate-950 shadow-md" />
                      ` : `
                        <div class="w-32 h-24 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 text-xs">
                          <span>💳</span> No ID Proof
                        </div>
                      `}
                    </div>
                  </div>

                  <!-- Action Buttons: Approve & Intercom Pitch -->
                  <div class="flex flex-col gap-2.5 min-w-[220px]">
                    <button data-approve-id="${c.id}" class="w-full py-2.5 px-4 rounded-xl ${
                      c.identityStatus === 'approved' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md font-extrabold animate-pulse'
                    } text-xs transition-all flex items-center justify-center gap-1.5">
                      <span>${c.identityStatus === 'approved' ? '✓ EXAM ENTRY ALLOWED' : '✅ ALLOW & ENTER EXAM'}</span>
                    </button>

                    <button data-intercom-cand="${c.id}" class="w-full py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                      <span>🎙️</span> Proctor Intercom / 360° Scan Call
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
    `;
    this.attachEvents();
  }

  private attachEvents() {
    // Identity Verification Approval Actions
    this.container.querySelectorAll('[data-approve-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const candId = (e.currentTarget as HTMLElement).getAttribute('data-approve-id');
        if (candId) {
          store.approveCandidateIdentity(candId);
          this.render();
        }
      });
    });

    // Proctor Intercom / 360° Room Inspection Pitch Actions
    this.container.querySelectorAll('[data-intercom-cand]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const candId = (e.currentTarget as HTMLElement).getAttribute('data-intercom-cand');
        if (candId) {
          const defaultMsg = 'PROCTOR ALERT: Please un-mute your audio and rotate your camera 360 degrees to scan your room environment.';
          const customMsg = prompt('Enter Proctor Voice Intercom Message / Room Inspection Instructions for candidate:', defaultMsg);
          if (customMsg) {
            store.triggerProctorIntercom(candId, customMsg);
            alert(`✅ Proctor Intercom Pitch & Room Inspection Broadcasted to Candidate (ID: ${candId})!`);
          }
        }
      });
    });
  }
}