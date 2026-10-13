/** ConferED brand tokens and public copy, aligned with https://www.confered.com/ */

export const BRAND = {
  name: 'ConferED',
  product: 'Talent Assess',
  tagline: 'Capture. Transform. Engage.',
  navy: '#0f2744',
  navyDark: '#0a1a2e',
  navyLight: '#183b63',
  orange: '#f97316',
  orangeHover: '#ea580c',
  cream: '#f9f7f4',
  ink: '#1f2937',
  phone: '+1 (415) 215-3527',
  phoneHref: 'tel:+14152153527',
  email: 'partnerships@confered.com',
  bookUrl:
    'https://outlook.office.com/book/MediaLearningTechnologyConsultationDigiVisionConferED@confered.com/?ismsaljsauthenabled',
  site: 'https://www.confered.com',
  locations: 'Aurora, CO · Huntersville, NC · Hayden, ID',
  copyright: 'Copyright 2026 ConferED LLC. All rights reserved.',
  since: 'Digital conference recording since 2006',
  stats: {
    uptime: '99.98%',
    compliance: 'SOC-2 Type II',
    encryption: '256-Bit AES',
    proctoring: 'AI + Live Proctor',
  },
};

/** Portal visual configuration for the 3 distinct workspaces */
export const PORTAL_THEMES = {
  admin: {
    key: 'admin',
    name: 'System Administrator',
    badge: 'Security & Governance',
    accentColor: '#3b82f6',
    accentLight: 'rgba(59, 130, 246, 0.12)',
    accentBorder: 'rgba(59, 130, 246, 0.35)',
    gradient: 'from-blue-600 to-indigo-600',
    hoverGradient: 'hover:from-blue-500 hover:to-indigo-500',
    shadowGlow: 'shadow-blue-600/25',
    icon: '🛡️',
    tagline: 'Staff accounts, role management, audit logs, and global security policies.',
    features: ['Staff IAM & Permissions', 'Audit Logs & IP Tracking', 'Global Proctoring Rules'],
  },
  recruiter: {
    key: 'recruiter',
    name: 'Recruiter & HR Workspace',
    badge: 'Talent Pipeline',
    accentColor: '#6366f1',
    accentLight: 'rgba(99, 102, 241, 0.12)',
    accentBorder: 'rgba(99, 102, 241, 0.35)',
    gradient: 'from-indigo-600 to-purple-600',
    hoverGradient: 'hover:from-indigo-500 hover:to-purple-500',
    shadowGlow: 'shadow-indigo-600/25',
    icon: '💼',
    tagline: 'Build multi-section exams, question banks, invite candidates, and evaluate scores.',
    features: ['Automated Coding IDE', 'Question Bank Manager', 'Candidate Pipeline Tracking'],
  },
  proctor: {
    key: 'proctor',
    name: 'Live Proctoring Monitor',
    badge: 'Real-Time Proctor Deck',
    accentColor: '#10b981',
    accentLight: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.35)',
    gradient: 'from-emerald-600 to-teal-600',
    hoverGradient: 'hover:from-emerald-500 hover:to-teal-500',
    shadowGlow: 'shadow-emerald-600/25',
    icon: '📹',
    tagline: 'Live multi-camera streaming, real-time AI violation alerts, and direct proctor intercom.',
    features: ['Zero-Latency Live Grid', 'Automated AI Violation Feed', 'Two-Way Audio Intercom'],
  },
} as const;

/** Official ConferED lockup using the user-uploaded brand logo. */
export const conferLogoImg = (_theme: 'onLight' | 'onDark' = 'onDark', className = 'h-11 sm:h-12 md:h-14 w-auto') => {
  return `<img src="/confered-logo.png" alt="ConferED — Capture. Transform. Engage." class="${className} object-contain transition-opacity hover:opacity-95 shrink-0" />`;
};
