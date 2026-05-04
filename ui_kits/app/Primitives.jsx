// BridgeCircle UI — Primitives (Button, Badge, StatusPill, Avatar, Card, Input, Icon)
// Loaded as a Babel script. Components attach to window for cross-file use.

// SVG icon set — small inline SVGs for the icons used in buttons/UI.
// Avoids all Material Symbols ligature / codepoint issues in button context.
const SVG_ICONS = {
  handshake: (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.5 2C9.56 2 8 3.56 8 5.5S9.56 9 11.5 9 15 7.44 15 5.5 13.44 2 11.5 2zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM3 13.5C3 11.57 6.13 11 8 11c.36 0 .77.04 1.2.1C8.46 11.7 8 12.56 8 13.5V16H3v-2.5zm10 0c0-.93-.46-1.8-1.2-2.4.43-.06.84-.1 1.2-.1 1.87 0 5 .57 5 2.5V16h-5v-2.5zM8 13.5c0-1.3 2.33-2 3.5-2s3.5.7 3.5 2V17H8v-3.5zM22 9h-2V7h-2v2h-2v2h2v2h2v-2h2V9z"/>
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
  ),
  bookmark_border: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z"/></svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
  ),
  more_horiz: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
  ),
  location_on: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
  ),
  verified: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg>
  ),
  arrow_forward: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
  ),
  connect_without_contact: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.88 13.56a8.01 8.01 0 000-3.12l1.68-1.29a.4.4 0 00.1-.51l-1.6-2.77a.4.4 0 00-.49-.17l-1.99.8a7.72 7.72 0 00-1.3-.75l-.3-2.12A.4.4 0 0012.6 3h-3.2a.4.4 0 00-.4.34l-.3 2.12a7.72 7.72 0 00-1.3.75l-1.99-.8a.4.4 0 00-.49.17L3.32 8.65a.39.39 0 00.1.51L5.1 10.44a7.99 7.99 0 000 3.12L3.42 14.85a.4.4 0 00-.1.51l1.6 2.77c.1.18.31.24.49.17l1.99-.8c.41.28.84.52 1.3.75l.3 2.12c.05.2.23.34.41.34h3.2c.18 0 .37-.14.4-.34l.3-2.12a7.72 7.72 0 001.3-.75l1.99.8c.18.07.39.01.49-.17l1.6-2.77a.4.4 0 00-.1-.51l-1.68-1.29zM12 15c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/></svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
  ),
  person: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
  ),
  chevron_right: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
  ),
  chevron_left: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
  ),
  calendar_today: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>
  ),
  filter_list: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
  ),
  add: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
  ),
  expand_more: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
  ),
  open_in_new: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.01 7.01 0 00-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.47.47 0 00-.59.22L2.74 8.87a.47.47 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 00-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
  ),
  event: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
  ),
  calendar_month: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
  ),
  tune: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>
  ),
  check_circle: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
  ),
  auto_awesome: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zm7.5 9.5l-1.25-2.75L15 15l2.75-1.25L19 11l1.25 2.75L23 15l-2.75 1.25L19 19z"/></svg>
  ),
  groups: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0020 14c-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>
  ),
  group: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
  ),
  campaign: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/></svg>
  ),
  thumb_up: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
  ),
  trending_up: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
  ),
  hub: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-4-8c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z"/></svg>
  ),
  school: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
  ),
  ios_share: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>
  ),
  person_add: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
  ),
  arrow_back: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
  ),
  work: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.98 16.02 1 13.64 1c-1.3 0-2.5.56-3.36 1.46l-.29.34-.29-.34C8.87 1.56 7.66 1 6.36 1 3.98 1 2 2.98 2 5.33c0 .38.07.72.14 1.07L2 6H2c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
  ),
  badge: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 7h-5V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-7 0h-2V4h2v3zm1 10H10v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1zm0-6c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-8-1H6v-2h-.01L8 8l2 2H8v2zm0 2H6v2h2v-2z"/></svg>
  ),
  event_available: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.53 11.06L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
  ),
  location_city: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>
  ),
  public: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
  ),
};

// Icon component — uses inline SVGs for reliability, falls back to Material Symbols ligature.
const Icon = ({ name, size = 20, fill = 0, weight = 400, style = {}, className = "" }) => {
  const svg = SVG_ICONS[name];
  if (svg) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: 0,
          verticalAlign: "middle",
          ...style,
        }}
        aria-hidden="true"
      >
        {React.cloneElement(svg, { width: size, height: size, style: { display: "block" } })}
      </span>
    );
  }
  // Fallback: Material Symbols ligature (works standalone, may fail in buttons)
  return (
    <span
      style={{
        fontFamily: "'Material Symbols Outlined', sans-serif",
        fontWeight: "normal",
        fontStyle: "normal",
        fontSize: `${size}px`,
        lineHeight: 1,
        letterSpacing: "normal",
        textTransform: "none",
        display: "inline-block",
        whiteSpace: "nowrap",
        direction: "ltr",
        WebkitFontSmoothing: "antialiased",
        fontFeatureSettings: '"liga" 1',
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        verticalAlign: "middle",
        userSelect: "none",
        ...style,
      }}
    >
      {name}
    </span>
  );
};

const bcButtonBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--bc-font-sans)",
  fontWeight: 600,
  fontSize: 14,
  lineHeight: 1.2,
  letterSpacing: ".01em",
  border: "1px solid transparent",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 200ms cubic-bezier(0.2,0,0,1)",
  whiteSpace: "nowrap",
  userSelect: "none",
};

const Button = ({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  children,
  style = {},
  ...rest
}) => {
  const sizes = {
    sm: { padding: "7px 14px", fontSize: 13 },
    md: { padding: "10px 18px", fontSize: 14 },
    lg: { padding: "13px 22px", fontSize: 15 },
  };
  const variants = {
    primary: { background: "#0051d5", color: "#fff" },
    outline: { background: "#fff", color: "#0b1220", borderColor: "#c6c6cd" },
    ghost: { background: "transparent", color: "#0b1220" },
    "ghost-light": { background: "transparent", color: "#cbd5e1" },
    destructive: { background: "rgba(186,26,26,.10)", color: "#ba1a1a" },
    "primary-on-dark": { background: "#316bf3", color: "#fff" },
  };
  const [hover, setHover] = React.useState(false);
  const hovers = {
    primary: { background: "#003ea8" },
    outline: { background: "#f2f4f6" },
    ghost: { background: "#f2f4f6" },
    "ghost-light": { color: "#fff" },
    destructive: { background: "rgba(186,26,26,.18)" },
    "primary-on-dark": { background: "#0051d5" },
  };
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...bcButtonBase,
        ...sizes[size],
        ...variants[variant],
        ...(hover ? hovers[variant] : {}),
        ...style,
      }}
      {...rest}
    >
      {iconLeft ? <Icon name={iconLeft} size={size === "sm" ? 16 : 18} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 16 : 18} /> : null}
    </button>
  );
};

const Avatar = ({ initials, size = 40, color = "#dbe1ff", textColor = "#00174b", style = {} }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      color: textColor,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--bc-font-sans)",
      fontWeight: 700,
      fontSize: size * 0.36,
      letterSpacing: ".02em",
      flexShrink: 0,
      ...style,
    }}
  >
    {initials}
  </div>
);

// ProfileTile — uses a "career background" gradient placeholder (since stock photos are off-brand)
const ProfileBanner = ({ seed = 0, children }) => {
  const palettes = [
    "linear-gradient(135deg,#131b2e 0%,#0051d5 100%)",
    "linear-gradient(135deg,#1e293b 0%,#316bf3 100%)",
    "linear-gradient(135deg,#0b1220 0%,#3f465c 100%)",
    "linear-gradient(135deg,#003ea8 0%,#b4c5ff 100%)",
  ];
  return (
    <div
      style={{
        height: 88,
        background: palettes[seed % palettes.length],
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* subtle dot grid texture so it isn't a flat gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          opacity: 0.5,
        }}
      />
      {children}
    </div>
  );
};

const Chip = ({ children, style = {} }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 9px",
      borderRadius: 4,
      background: "#eceef0",
      color: "#45464d",
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

const StatusPill = ({ tone = "info", dot = true, children }) => {
  const tones = {
    open: { bg: "#d1fae5", fg: "#047857", dot: "#10b981" },
    warn: { bg: "#fef3c7", fg: "#92400e", dot: "#f59e0b" },
    info: { bg: "rgba(0,81,213,.10)", fg: "#0051d5", dot: "#0051d5" },
    alert: { bg: "#ffdad6", fg: "#ba1a1a", dot: "#ba1a1a" },
    muted: { bg: "#eceef0", fg: "#45464d", dot: "#76777d" },
    year: { bg: "#dbe1ff", fg: "#00174b", dot: "#0051d5" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 9999,
        background: t.bg,
        color: t.fg,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {dot ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: t.dot,
          }}
        />
      ) : null}
      {children}
    </span>
  );
};

const Card = ({ dark = false, hover = false, padding = 24, style = {}, children, ...rest }) => {
  const [h, setH] = React.useState(false);
  const isHov = hover && h;
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: dark ? "#131b2e" : "#fff",
        border: `1px solid ${dark ? "#1e293b" : isHov ? "#0051d5" : "#c6c6cd"}`,
        borderRadius: 12,
        padding,
        boxShadow: isHov ? "0 4px 20px -4px rgba(19,27,46,.08)" : "none",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        color: dark ? "#fff" : "#191c1e",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

const Eyebrow = ({ children, style = {} }) => (
  <p
    style={{
      fontFamily: "var(--bc-font-sans)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".06em",
      textTransform: "uppercase",
      color: "#76777d",
      margin: 0,
      ...style,
    }}
  >
    {children}
  </p>
);

const Wordmark = ({ size = 22, dark = false, mark = false }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
    {mark ? (
      <svg width={size + 6} height={size + 6} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
        <rect width="64" height="64" rx="14" fill={dark ? "#fff" : "#0b1220"} />
        <circle cx="25" cy="32" r="13" fill="none" stroke={dark ? "#0b1220" : "#fff"} strokeWidth="2.5" />
        <circle cx="39" cy="32" r="13" fill="none" stroke="#0051d5" strokeWidth="2.5" />
      </svg>
    ) : null}
    {/* bc-fraunces picks up SOFT/WONK/opsz/weight CSS vars set by the tweaks panel */}
    <span
      className="bc-fraunces"
      style={{
        fontSize: size,
        letterSpacing: "-.025em",
      }}
    >
      <span style={{ color: dark ? "#fff" : "#0b1220" }}>Bridge</span>
      <span style={{ color: dark ? "#b4c5ff" : "var(--bc-secondary, #0051d5)" }}>Circle</span>
    </span>
  </span>
);

Object.assign(window, { Icon, Button, Avatar, Chip, StatusPill, Card, Eyebrow, Wordmark, ProfileBanner });
