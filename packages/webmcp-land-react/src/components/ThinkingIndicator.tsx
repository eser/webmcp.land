import React from 'react'

export function ThinkingIndicator() {
  return (
    <div className="wmcp-message wmcp-message-assistant wmcp-message-thinking">
      <div className="wmcp-thinking-shimmer">
        <div className="wmcp-shimmer-bar" />
        <div className="wmcp-shimmer-bar" />
        <div className="wmcp-shimmer-bar" />
      </div>
    </div>
  )
}
