export const STYLES = `
/* ============ WebMCP React SDK Styles — v2 Professional Redesign ============ */

/* ============ FONT LOADING ============ */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* ============ ROOT ============ */
.wmcp-root {
  --wmcp-bg-0: #0a0a0b;
  --wmcp-bg-1: #0f0f11;
  --wmcp-bg-2: #161618;
  --wmcp-bg-3: #1e1e22;
  --wmcp-accent: #6366f1;
  --wmcp-accent-text: #818cf8;
  --wmcp-accent-soft: rgba(99, 102, 241, 0.08);
  --wmcp-accent-mid: rgba(99, 102, 241, 0.15);
  --wmcp-accent-border: rgba(99, 102, 241, 0.25);
  --wmcp-text-0: #ededf0;
  --wmcp-text-1: #a8a8b3;
  --wmcp-text-2: #62626d;
  --wmcp-text-3: #3e3e47;
  --wmcp-border: rgba(255, 255, 255, 0.07);
  --wmcp-border-focus: rgba(99, 102, 241, 0.45);
  --wmcp-red: #ef4444;
  --wmcp-red-soft: rgba(239, 68, 68, 0.09);
  --wmcp-red-border: rgba(239, 68, 68, 0.2);
  --wmcp-font: 'Inter', system-ui, -apple-system, sans-serif;
  --wmcp-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --wmcp-radius: 12px;
  --wmcp-radius-sm: 8px;
  --wmcp-shadow-chatbox: 0 8px 30px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2);
  --wmcp-shadow-button: 0 4px 16px rgba(0, 0, 0, 0.3);

  font-family: var(--wmcp-font);
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

.wmcp-root *, .wmcp-root *::before, .wmcp-root *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ============ POSITIONING ============ */
.wmcp-floating {
  position: fixed;
  z-index: 99999;
}

.wmcp-bottom-right {
  bottom: 20px;
  right: 20px;
}

.wmcp-bottom-left {
  bottom: 20px;
  left: 20px;
}

.wmcp-inline .wmcp-chatbox {
  position: relative;
  width: 100%;
  height: 100%;
}

.wmcp-floating .wmcp-chatbox {
  position: absolute;
  bottom: 64px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--wmcp-shadow-chatbox);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  animation: wmcp-chatbox-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes wmcp-chatbox-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.wmcp-bottom-right .wmcp-chatbox {
  right: 0;
}

.wmcp-bottom-left .wmcp-chatbox {
  left: 0;
}

/* ============ CHATBOX ============ */
.wmcp-chatbox {
  display: flex;
  flex-direction: column;
  background: var(--wmcp-bg-0);
  color: var(--wmcp-text-0);
  font-family: var(--wmcp-font);
  overflow: hidden;
}

/* ============ HEADER ============ */
.wmcp-chat-header {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.wmcp-header-bg {
  position: absolute;
  inset: 0;
  background: var(--wmcp-bg-1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 0;
}

.wmcp-header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
}

.wmcp-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wmcp-header-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--wmcp-accent-soft);
  border: 1px solid var(--wmcp-accent-border);
  color: var(--wmcp-accent);
}

.wmcp-header-brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wmcp-header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--wmcp-text-0);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.wmcp-header-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--wmcp-text-2);
  line-height: 1;
}

.wmcp-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--wmcp-accent);
  display: inline-block;
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.4);
  animation: wmcp-status-pulse 3s ease-in-out infinite;
}

@keyframes wmcp-status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.wmcp-header-actions {
  display: flex;
  gap: 4px;
}

.wmcp-status-line {
  height: 1px;
  background: linear-gradient(90deg, var(--wmcp-accent), rgba(99, 102, 241, 0.1) 50%, transparent 100%);
  flex-shrink: 0;
  animation: wmcp-status-gradient 4s ease-in-out infinite;
}

@keyframes wmcp-status-gradient {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ============ ICON BUTTONS ============ */
.wmcp-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--wmcp-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  position: relative;
}

.wmcp-icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--wmcp-text-0);
}

.wmcp-icon-btn.wmcp-active {
  background: var(--wmcp-accent-soft);
  color: var(--wmcp-accent);
  border-color: var(--wmcp-accent-border);
}

/* ============ PANELS ============ */
.wmcp-panel {
  flex-shrink: 0;
  background: var(--wmcp-bg-1);
  border-bottom: 1px solid var(--wmcp-border);
  overflow-y: auto;
  max-height: 300px;
}

.wmcp-panel-inner {
  padding: 16px;
}

.wmcp-panel-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--wmcp-text-2);
  margin-bottom: 12px;
}

/* ============ SETTINGS ============ */
.wmcp-settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.wmcp-settings-row label {
  display: block;
  font-size: 10px;
  font-weight: 500;
  color: var(--wmcp-text-2);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
}

.wmcp-api-key-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.wmcp-api-key-row input {
  flex: 1;
  min-width: 0;
}

.wmcp-managed-info {
  padding: 10px 12px;
  border-radius: var(--wmcp-radius-sm);
  background: var(--wmcp-accent-soft);
  border: 1px solid var(--wmcp-accent-border);
  font-size: 12px;
  color: var(--wmcp-text-1);
  margin-bottom: 8px;
}

/* ============ FORM CONTROLS ============ */
.wmcp-root select,
.wmcp-root textarea,
.wmcp-root input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--wmcp-border);
  border-radius: var(--wmcp-radius-sm);
  background: var(--wmcp-bg-2);
  color: var(--wmcp-text-0);
  font-size: 12px;
  font-family: var(--wmcp-font);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}

.wmcp-root select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2362626d' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
  cursor: pointer;
}

.wmcp-root select:focus,
.wmcp-root textarea:focus,
.wmcp-root input:focus {
  border-color: var(--wmcp-border-focus);
  box-shadow: 0 0 0 3px var(--wmcp-accent-soft);
}

.wmcp-root ::placeholder {
  color: var(--wmcp-text-3);
}

.wmcp-root select:disabled,
.wmcp-root textarea:disabled,
.wmcp-root button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.wmcp-root option {
  background: var(--wmcp-bg-2);
  color: var(--wmcp-text-0);
}

/* ============ BUTTONS ============ */
.wmcp-btn-accent {
  padding: 8px 14px;
  border-radius: var(--wmcp-radius-sm);
  border: 1px solid var(--wmcp-accent-border);
  background: var(--wmcp-accent-soft);
  color: var(--wmcp-accent);
  font-family: var(--wmcp-font);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.wmcp-btn-accent:hover {
  background: var(--wmcp-accent-mid);
  border-color: var(--wmcp-accent);
}

.wmcp-btn-full {
  width: 100%;
  margin-top: 10px;
  padding: 9px;
}

/* ============ TOOLS PANEL ============ */
.wmcp-tools-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.wmcp-tool-card {
  padding: 10px 12px;
  border-radius: var(--wmcp-radius-sm);
  border: 1px solid var(--wmcp-border);
  background: var(--wmcp-bg-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.wmcp-tool-card:hover {
  border-color: var(--wmcp-accent-border);
  background: rgba(99, 102, 241, 0.04);
}

.wmcp-tool-card.wmcp-active {
  border-color: var(--wmcp-accent-border);
  background: var(--wmcp-accent-soft);
}

.wmcp-tool-card-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--wmcp-text-0);
  font-family: var(--wmcp-mono);
  margin-bottom: 2px;
}

.wmcp-tool-card-desc {
  font-size: 11px;
  color: var(--wmcp-text-2);
  line-height: 1.4;
}

.wmcp-manual-tool-section label {
  display: block;
  font-size: 10px;
  font-weight: 500;
  color: var(--wmcp-text-2);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
  margin-top: 10px;
}

.wmcp-tool-args {
  font-family: var(--wmcp-mono) !important;
  font-size: 11px !important;
  min-height: 50px;
  resize: vertical;
}

.wmcp-tool-results {
  background: var(--wmcp-bg-0);
  color: var(--wmcp-text-1);
  font-family: var(--wmcp-mono);
  font-size: 11px;
  padding: 10px 12px;
  border-radius: var(--wmcp-radius-sm);
  border: 1px solid var(--wmcp-border);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
  margin-top: 10px;
  line-height: 1.6;
  position: relative;
}

/* ============ CHAT MESSAGES ============ */
.wmcp-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--wmcp-bg-0);
}

.wmcp-message {
  display: flex;
  animation: wmcp-msg-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes wmcp-msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.wmcp-message-bubble {
  max-width: 85%;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.wmcp-message:not(.wmcp-message-assistant) .wmcp-message-bubble {
  white-space: pre-wrap;
}

/* ---- Message Avatar ---- */
.wmcp-msg-avatar {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  margin-top: 2px;
}

.wmcp-msg-avatar-ai {
  background: var(--wmcp-accent-soft);
  color: var(--wmcp-accent);
  border: 1px solid var(--wmcp-accent-border);
}

.wmcp-msg-avatar-user {
  background: var(--wmcp-bg-3);
  color: var(--wmcp-text-1);
  border: 1px solid var(--wmcp-border);
}

.wmcp-msg-with-avatar {
  gap: 8px;
}

/* User */
.wmcp-message-user {
  justify-content: flex-end;
}

.wmcp-message-user .wmcp-message-bubble {
  background: var(--wmcp-accent);
  color: #ffffff;
  border-radius: 18px 18px 4px 18px;
}

/* Assistant */
.wmcp-message-assistant {
  justify-content: flex-start;
}

.wmcp-message-assistant .wmcp-message-bubble {
  background: var(--wmcp-bg-1);
  color: var(--wmcp-text-0);
  border: 1px solid var(--wmcp-border);
  border-left: 2px solid var(--wmcp-accent);
  border-radius: 4px 18px 18px 18px;
}

/* System */
.wmcp-message-system {
  justify-content: center;
}

.wmcp-message-system .wmcp-message-bubble {
  background: transparent;
  color: var(--wmcp-text-3);
  font-size: 11px;
  padding: 4px 12px;
  max-width: 100%;
  text-align: center;
  border-radius: 20px;
  background: var(--wmcp-bg-1);
  border: 1px solid var(--wmcp-border);
}

/* Tool call */
.wmcp-message-tool-call {
  justify-content: flex-start;
}

.wmcp-message-tool-call .wmcp-message-bubble {
  background: var(--wmcp-bg-1);
  border: 1px solid var(--wmcp-border);
  border-left: 2px solid var(--wmcp-accent);
  color: var(--wmcp-text-1);
  font-size: 11px;
  font-family: var(--wmcp-mono);
  border-radius: 4px 12px 12px 4px;
  padding: 8px 12px;
  max-width: 92%;
  cursor: pointer;
  transition: background 0.15s ease;
}

.wmcp-message-tool-call .wmcp-message-bubble:hover {
  background: var(--wmcp-bg-2);
}

/* Tool result */
.wmcp-message-tool-result {
  justify-content: flex-start;
  margin-top: -4px;
}

.wmcp-message-tool-result .wmcp-message-bubble {
  background: var(--wmcp-bg-1);
  border: 1px solid var(--wmcp-border);
  border-left: 2px solid var(--wmcp-text-3);
  color: var(--wmcp-text-2);
  font-size: 10px;
  font-family: var(--wmcp-mono);
  border-radius: 4px 12px 12px 4px;
  padding: 8px 12px;
  max-width: 92%;
  max-height: 120px;
  overflow-y: auto;
  margin-left: 32px;
}

/* Error */
.wmcp-message-error {
  justify-content: flex-start;
}

.wmcp-message-error .wmcp-message-bubble {
  background: var(--wmcp-red-soft);
  border: 1px solid var(--wmcp-red-border);
  border-left: 2px solid var(--wmcp-red);
  color: var(--wmcp-red);
  font-size: 12px;
  border-radius: 4px 12px 12px 4px;
  padding: 10px 14px;
}

/* ============ THINKING / SHIMMER ============ */
.wmcp-thinking-shimmer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--wmcp-bg-1);
  border: 1px solid var(--wmcp-border);
  border-left: 2px solid var(--wmcp-accent);
  border-radius: 4px 18px 18px 18px;
  max-width: 200px;
}

.wmcp-shimmer-bar {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--wmcp-bg-3) 25%,
    var(--wmcp-accent-soft) 50%,
    var(--wmcp-bg-3) 75%
  );
  background-size: 200% 100%;
  animation: wmcp-shimmer 1.5s ease-in-out infinite;
}

.wmcp-shimmer-bar:nth-child(1) { width: 60px; }
.wmcp-shimmer-bar:nth-child(2) { width: 40px; }
.wmcp-shimmer-bar:nth-child(3) { width: 50px; }

@keyframes wmcp-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============ MARKDOWN ============ */
.wmcp-message-bubble strong {
  font-weight: 600;
  color: var(--wmcp-text-0);
}

.wmcp-message-user .wmcp-message-bubble strong {
  color: #ffffff;
}

.wmcp-message-bubble em {
  font-style: italic;
  color: var(--wmcp-text-1);
}

.wmcp-message-user .wmcp-message-bubble em {
  color: rgba(255, 255, 255, 0.85);
}

.wmcp-message-bubble del {
  text-decoration: line-through;
  opacity: 0.5;
}

.wmcp-message-bubble .wmcp-heading {
  font-weight: 600;
  margin: 8px 0 3px;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.wmcp-message-bubble h1.wmcp-heading { font-size: 15px; }
.wmcp-message-bubble h2.wmcp-heading { font-size: 14px; }
.wmcp-message-bubble h3.wmcp-heading { font-size: 13px; color: var(--wmcp-text-1); }

.wmcp-message-bubble .wmcp-heading:first-child { margin-top: 0; }

.wmcp-message-bubble .wmcp-inline-code {
  font-family: var(--wmcp-mono);
  font-size: 0.85em;
  background: var(--wmcp-accent-soft);
  border: 1px solid var(--wmcp-accent-border);
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--wmcp-accent-text);
}

.wmcp-message-user .wmcp-message-bubble .wmcp-inline-code {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.wmcp-message-bubble .wmcp-codeblock {
  font-family: var(--wmcp-mono);
  font-size: 11px;
  line-height: 1.6;
  background: var(--wmcp-bg-0);
  border: 1px solid var(--wmcp-border);
  border-left: 2px solid var(--wmcp-accent);
  border-radius: 2px var(--wmcp-radius-sm) var(--wmcp-radius-sm) 2px;
  padding: 10px 12px;
  margin: 8px 0;
  overflow-x: auto;
  white-space: pre;
  color: var(--wmcp-text-0);
}

.wmcp-message-bubble .wmcp-codeblock code {
  font-family: inherit;
  font-size: inherit;
  background: none;
  border: none;
  padding: 0;
}

.wmcp-message-bubble .wmcp-list {
  margin: 4px 0;
  padding-left: 16px;
  list-style: none;
}

.wmcp-message-bubble .wmcp-list li {
  position: relative;
  margin-bottom: 2px;
}

.wmcp-message-bubble .wmcp-list li::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 8px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--wmcp-accent);
}

.wmcp-message-bubble .wmcp-link {
  color: var(--wmcp-accent-text);
  text-decoration: none;
  border-bottom: 1px solid var(--wmcp-accent-border);
  transition: border-color 0.15s ease;
}

.wmcp-message-bubble .wmcp-link:hover {
  border-color: var(--wmcp-accent);
}

.wmcp-message-user .wmcp-message-bubble .wmcp-link {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.3);
}

.wmcp-message-bubble p { margin: 0; }
.wmcp-message-bubble p + p { margin-top: 6px; }

/* ============ EMPTY STATE ============ */
.wmcp-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  gap: 16px;
}

.wmcp-empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--wmcp-accent-soft);
  border: 1px solid var(--wmcp-accent-border);
  color: var(--wmcp-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: wmcp-empty-float 3s ease-in-out infinite;
}

@keyframes wmcp-empty-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.wmcp-empty-text {
  font-size: 13px;
  color: var(--wmcp-text-2);
  line-height: 1.5;
  max-width: 260px;
}

.wmcp-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 4px;
}

.wmcp-suggestion-chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--wmcp-border);
  background: var(--wmcp-bg-1);
  color: var(--wmcp-text-1);
  font-family: var(--wmcp-font);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.wmcp-suggestion-chip:hover {
  border-color: var(--wmcp-accent-border);
  background: var(--wmcp-accent-soft);
  color: var(--wmcp-accent);
}

/* ============ CHAT INPUT ============ */
.wmcp-chat-input-area {
  flex-shrink: 0;
  padding: 12px 16px 14px;
  background: var(--wmcp-bg-1);
  border-top: 1px solid var(--wmcp-border);
}

.wmcp-chat-input-card {
  border-radius: 14px;
  border: 1px solid var(--wmcp-border);
  background: var(--wmcp-bg-2);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
}

.wmcp-chat-input-card:focus-within {
  border-color: var(--wmcp-border-focus);
  box-shadow: 0 0 0 3px var(--wmcp-accent-soft);
}

.wmcp-chat-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 8px 10px;
}

.wmcp-chat-textarea {
  flex: 1;
  min-height: 36px;
  max-height: 120px;
  resize: none;
  padding: 6px 8px !important;
  border-radius: 8px !important;
  background: transparent !important;
  border: none !important;
  font-size: 13px;
  line-height: 1.5;
  overflow-y: hidden;
  color: var(--wmcp-text-0);
}

.wmcp-chat-textarea:focus {
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

.wmcp-send-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: var(--wmcp-bg-3);
  color: var(--wmcp-text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.wmcp-send-btn.wmcp-has-text {
  background: var(--wmcp-accent);
  color: #ffffff;
}

.wmcp-send-btn.wmcp-has-text:hover {
  opacity: 0.9;
  transform: scale(1.04);
}

.wmcp-send-btn:active:not(:disabled) {
  transform: scale(0.93);
}

.wmcp-send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ---- Stop Button ---- */
.wmcp-stop-btn {
  background: var(--wmcp-red) !important;
  color: #fff !important;
  animation: wmcp-stop-pulse 1.5s ease-in-out infinite;
}

.wmcp-stop-btn:hover {
  opacity: 0.9 !important;
}

@keyframes wmcp-stop-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}

.wmcp-chat-actions {
  display: flex;
  gap: 6px;
  padding: 6px 12px 2px;
}

.wmcp-action-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--wmcp-text-2);
  font-family: var(--wmcp-font);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.wmcp-action-btn:hover:not(:disabled) {
  background: var(--wmcp-bg-2);
  color: var(--wmcp-text-1);
}

.wmcp-action-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.wmcp-action-btn svg {
  opacity: 0.7;
}

/* ============ FLOATING BUTTON ============ */
.wmcp-floating-btn {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: 1px solid var(--wmcp-border);
  background: var(--wmcp-bg-1);
  color: var(--wmcp-accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--wmcp-shadow-button);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: visible;
  animation: wmcp-fab-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes wmcp-fab-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.wmcp-floating-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  border-color: var(--wmcp-accent-border);
}

.wmcp-floating-btn:active {
  transform: scale(0.95);
}

.wmcp-floating-btn.wmcp-loading::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 19px;
  border: 2px solid transparent;
  border-top-color: var(--wmcp-accent);
  animation: wmcp-fab-glow 1.5s ease-in-out infinite;
  opacity: 0.5;
}

@keyframes wmcp-fab-glow {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; }
}

.wmcp-floating-btn .wmcp-fab-orb {
  display: none;
}

/* ============ SCROLLBAR ============ */
.wmcp-root ::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.wmcp-root ::-webkit-scrollbar-track {
  background: transparent;
}

.wmcp-root ::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 4px;
  transition: background 0.2s;
}

.wmcp-chat-messages:hover::-webkit-scrollbar-thumb {
  background: var(--wmcp-bg-3);
}

.wmcp-root ::-webkit-scrollbar-thumb:hover {
  background: var(--wmcp-text-3);
}

/* ============ STREAMING CURSOR ============ */
.wmcp-streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: var(--wmcp-accent);
  margin-left: 2px;
  vertical-align: text-bottom;
  border-radius: 1px;
  animation: wmcp-cursor-blink 1s ease-in-out infinite;
}

@keyframes wmcp-cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

/* ============ ATTACHMENTS ============ */
.wmcp-attachment-previews {
  display: flex;
  gap: 8px;
  padding: 8px 12px 0;
  overflow-x: auto;
}

.wmcp-attachment-preview {
  position: relative;
  flex-shrink: 0;
}

.wmcp-attachment-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--wmcp-radius-sm);
  border: 1px solid var(--wmcp-border);
}

.wmcp-attachment-file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--wmcp-radius-sm);
  border: 1px solid var(--wmcp-border);
  background: var(--wmcp-bg-2);
  font-size: 9px;
  color: var(--wmcp-text-2);
  text-align: center;
  padding: 4px;
  word-break: break-all;
  overflow: hidden;
}

.wmcp-attachment-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: var(--wmcp-red);
  color: #fff;
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.wmcp-attachment-remove:hover {
  transform: scale(1.1);
}

.wmcp-attach-btn {
  background: none;
  border: none;
  color: var(--wmcp-text-2);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: color 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.wmcp-attach-btn:hover {
  color: var(--wmcp-text-0);
  background: rgba(255, 255, 255, 0.06);
}

.wmcp-attach-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Message image attachments */
.wmcp-message-attachments {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.wmcp-message-image {
  max-width: 200px;
  max-height: 160px;
  border-radius: var(--wmcp-radius-sm);
  border: 1px solid var(--wmcp-border);
  object-fit: contain;
}

.wmcp-message-file {
  padding: 4px 8px;
  border-radius: var(--wmcp-radius-sm);
  border: 1px solid var(--wmcp-border);
  background: var(--wmcp-bg-2);
  font-size: 11px;
  color: var(--wmcp-text-2);
}

/* ============ MESSAGE GROUPING ============ */
.wmcp-message-grouped {
  margin-top: -4px;
}

.wmcp-message-user.wmcp-message-grouped .wmcp-message-bubble {
  border-radius: 18px 4px 4px 18px;
}

.wmcp-message-assistant.wmcp-message-grouped .wmcp-message-bubble {
  border-radius: 4px 18px 18px 4px;
}

/* last in group */
.wmcp-message-user.wmcp-message-grouped:not(.wmcp-message-grouped + .wmcp-message-grouped) .wmcp-message-bubble {
  border-bottom-right-radius: 4px;
}

/* ============ TIMESTAMPS ============ */
.wmcp-message-timestamp {
  display: none;
  font-size: 10px;
  color: var(--wmcp-text-3);
  padding: 0 4px;
  flex-shrink: 0;
  align-self: center;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.wmcp-message:hover .wmcp-message-timestamp {
  display: block;
  opacity: 1;
}

/* ============ FEEDBACK BUTTONS ============ */
.wmcp-message-feedback {
  display: flex;
  gap: 2px;
  align-self: flex-end;
  opacity: 0;
  transition: opacity 0.15s ease;
  margin-top: -2px;
}

.wmcp-message:hover .wmcp-message-feedback,
.wmcp-message-feedback:focus-within {
  opacity: 1;
}

.wmcp-message-feedback:has(.wmcp-active) {
  opacity: 1;
}

.wmcp-feedback-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--wmcp-text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;
}

.wmcp-feedback-btn:hover {
  background: var(--wmcp-bg-3);
  color: var(--wmcp-text-1);
  transform: scale(1.1);
}

.wmcp-feedback-btn.wmcp-active {
  color: var(--wmcp-accent);
  transform: scale(1.1);
}

/* ============ NOTIFICATION BADGE ============ */
.wmcp-unread-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--wmcp-red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--wmcp-font);
  line-height: 18px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: wmcp-badge-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

@keyframes wmcp-badge-in {
  from { transform: scale(0); }
  60% { transform: scale(1.2); }
  to { transform: scale(1); }
}

/* ============ CODE BLOCK COPY BUTTON ============ */
.wmcp-codeblock-wrapper {
  position: relative;
  margin: 8px 0;
}

.wmcp-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px 6px 12px;
  background: var(--wmcp-bg-2);
  border: 1px solid var(--wmcp-border);
  border-bottom: none;
  border-left: 2px solid var(--wmcp-accent);
  border-radius: 2px var(--wmcp-radius-sm) 0 0;
  min-height: 30px;
}

.wmcp-code-lang {
  font-family: var(--wmcp-mono);
  font-size: 10px;
  color: var(--wmcp-text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.wmcp-code-copy-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--wmcp-text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;
}

.wmcp-code-copy-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--wmcp-text-0);
}

.wmcp-code-copy-btn.wmcp-copied {
  color: var(--wmcp-accent);
}

.wmcp-codeblock-wrapper .wmcp-codeblock {
  margin: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* ============ FOCUS VISIBLE ============ */
.wmcp-root button:focus-visible,
.wmcp-root textarea:focus-visible,
.wmcp-root select:focus-visible,
.wmcp-root input:focus-visible {
  outline: 2px solid var(--wmcp-accent);
  outline-offset: 2px;
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .wmcp-root *,
  .wmcp-root *::before,
  .wmcp-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ============ MOBILE RESPONSIVE ============ */
@media (max-width: 640px) {
  .wmcp-floating .wmcp-chatbox {
    position: fixed !important;
    inset: 0 !important;
    bottom: 0 !important;
    right: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    border-radius: 0 !important;
    border: none !important;
  }

  .wmcp-floating-btn {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .wmcp-message-bubble {
    max-width: 95%;
  }

  .wmcp-send-btn,
  .wmcp-action-btn,
  .wmcp-attach-btn {
    min-height: 44px;
    min-width: 44px;
  }

  .wmcp-chat-textarea {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  .wmcp-icon-btn {
    width: 36px;
    height: 36px;
  }
}

/* ============ SCREEN READER ONLY ============ */
.wmcp-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
`
