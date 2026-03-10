import React from 'react'

const h = React.createElement

// ---- AI Sparkle Icon ----
export function SparkleIcon({ size = 20 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z' }),
  )
}

// ---- Settings Icon ----
export function SettingsIcon({ size = 15 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('circle', { cx: '12', cy: '12', r: '3' }),
    h('path', { d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' }),
  )
}

// ---- Tools Icon ----
export function ToolsIcon({ size = 15 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' }),
  )
}

// ---- Send Arrow Icon ----
export function SendIcon({ size = 16 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M5 12h14M12 5l7 7-7 7' }),
  )
}

// ---- Stop Icon ----
export function StopIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor',
  },
    h('rect', { x: '4', y: '4', width: '16', height: '16', rx: '3' }),
  )
}

// ---- Attach Icon ----
export function AttachIcon({ size = 16 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48' }),
  )
}

// ---- Close Icon ----
export function CloseIcon({ size = 20 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M18 6L6 18M6 6l12 12' }),
  )
}

// ---- Chat Bubble Icon ----
export function ChatIcon({ size = 20 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' }),
  )
}

// ---- Thumbs Up Icon ----
export function ThumbsUpIcon({ size = 14, filled = false }: { size?: number; filled?: boolean }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3' }),
  )
}

// ---- Thumbs Down Icon ----
export function ThumbsDownIcon({ size = 14, filled = false }: { size?: number; filled?: boolean }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17' }),
  )
}

// ---- ChevronDown Icon ----
export function ChevronDownIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M6 9l6 6 6-6' }),
  )
}

// ---- Eye Icon ----
export function EyeIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
    h('circle', { cx: '12', cy: '12', r: '3' }),
  )
}

// ---- EyeOff Icon ----
export function EyeOffIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('path', { d: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24' }),
    h('line', { x1: '1', y1: '1', x2: '23', y2: '23' }),
  )
}

// ---- Copy Icon ----
export function CopyIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('rect', { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' }),
    h('path', { d: 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' }),
  )
}

// ---- Check Icon ----
export function CheckIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('polyline', { points: '20 6 9 17 4 12' }),
  )
}

// ---- Expand Icon ----
export function ExpandIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('polyline', { points: '6 9 12 15 18 9' }),
  )
}

// ---- Collapse Icon ----
export function CollapseIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('polyline', { points: '18 15 12 9 6 15' }),
  )
}

// ---- Reset Icon ----
export function ResetIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('polyline', { points: '1 4 1 10 7 10' }),
    h('path', { d: 'M3.51 15a9 9 0 102.13-9.36L1 10' }),
  )
}

// ---- Trace/Terminal Icon ----
export function TraceIcon({ size = 14 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    h('polyline', { points: '4 17 10 11 4 5' }),
    h('line', { x1: '12', y1: '19', x2: '20', y2: '19' }),
  )
}
