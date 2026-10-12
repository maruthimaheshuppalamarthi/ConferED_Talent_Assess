/** ConferED brand tokens and public copy, aligned with https://www.confered.com/ */

export const BRAND = {
  name: 'ConferED',
  product: 'Talent Assess',
  tagline: 'Capture. Transform. Engage.',
  navy: '#0f2744',
  orange: '#f97316',
  cream: '#f9f7f4',
  ink: '#1f2937',
  phone: '(415) 215-3527',
  phoneHref: 'tel:+14152153527',
  email: 'partnerships@confered.com',
  bookUrl:
    'https://outlook.office.com/book/MediaLearningTechnologyConsultationDigiVisionConferED@confered.com/?ismsaljsauthenabled',
  site: 'https://www.confered.com',
  locations: 'Aurora, CO · Huntersville, NC · Hayden, ID',
  copyright: 'Copyright 2026 ConferED LLC. All rights reserved.',
  since: 'Digital conference recording since 2006',
};

/** Official ConferED lockup. onLight = navy mark on white; onDark = white mark on navy. */
export const conferLogoImg = (theme: 'onLight' | 'onDark' = 'onDark', className = 'h-11 w-auto') => {
  const style = theme === 'onDark' ? 'filter:brightness(0) invert(1)' : '';
  return `<img src="/confered-logo.png" alt="ConferED — Capture. Transform. Engage." class="${className}" style="${style}" />`;
};
