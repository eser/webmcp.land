import React, { useRef, useCallback } from 'react'
import type { ChatInputProps } from '../types'
import { SendIcon, StopIcon, AttachIcon, ResetIcon, TraceIcon } from './icons'

export function ChatInput({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  isLoading,
  onReset,
  onTrace,
  showResetButton = true,
  showTraceButton = true,
  attachments = [],
  onAttach,
  onRemoveAttachment,
  enableAttachments = false,
  onStop,
  isStreaming = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
      const el = e.target
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        onSend()
      }
    },
    [onSend]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || !onAttach) return

      for (const file of Array.from(files)) {
        const reader = new FileReader()
        reader.onload = () => {
          onAttach({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: reader.result as string,
            name: file.name,
            mimeType: file.type,
          })
        }
        reader.readAsDataURL(file)
      }

      e.target.value = ''
    },
    [onAttach]
  )

  const hasActions = showResetButton || showTraceButton
  const hasText = value.trim().length > 0

  return (
    <div className="wmcp-chat-input-area" role="form" aria-label="Message input">
      {attachments.length > 0 && (
        <div className="wmcp-attachment-previews">
          {attachments.map((att, i) => (
            <div key={i} className="wmcp-attachment-preview">
              {att.type === 'image' ? (
                <img src={att.url} alt={att.name || 'attachment'} className="wmcp-attachment-thumb" />
              ) : (
                <span className="wmcp-attachment-file">{att.name || 'File'}</span>
              )}
              {onRemoveAttachment && (
                <button
                  className="wmcp-attachment-remove"
                  onClick={() => onRemoveAttachment(i)}
                  title="Remove"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="wmcp-chat-input-card">
        <div className="wmcp-chat-input-row">
          {enableAttachments && onAttach && (
            <>
              <button
                className="wmcp-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                title="Attach file"
                aria-label="Attach file"
              >
                <AttachIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </>
          )}
          <textarea
            ref={textareaRef}
            className="wmcp-chat-textarea"
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled || isLoading}
            aria-label="Type a message"
          />
          {isStreaming && onStop ? (
            <button
              className="wmcp-send-btn wmcp-stop-btn"
              onClick={onStop}
              title="Stop"
              aria-label="Stop"
            >
              <StopIcon />
            </button>
          ) : (
            <button
              className={`wmcp-send-btn${hasText ? ' wmcp-has-text' : ''}`}
              onClick={onSend}
              disabled={disabled || isLoading || !hasText}
              title="Send"
              aria-label="Send"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>
      {hasActions && (
        <div className="wmcp-chat-actions">
          {showResetButton && (
            <button className="wmcp-action-btn" onClick={onReset} disabled={disabled} aria-label="Reset conversation">
              <ResetIcon size={12} />
              Reset
            </button>
          )}
          {showTraceButton && (
            <button className="wmcp-action-btn" onClick={onTrace} aria-label="Copy conversation trace">
              <TraceIcon size={12} />
              Trace
            </button>
          )}
        </div>
      )}
    </div>
  )
}
