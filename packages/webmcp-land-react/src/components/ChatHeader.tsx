import React from 'react'
import type { ChatHeaderProps } from '../types'
import { SettingsIcon, ToolsIcon, SparkleIcon } from './icons'

function AvatarContent({ logo, isLoading }: { logo?: string | React.ReactNode; isLoading: boolean }) {
  if (logo) {
    if (typeof logo === 'string') {
      return (
        <img
          src={logo}
          alt=""
          style={{ width: 24, height: 24, borderRadius: '8px', objectFit: 'cover' }}
        />
      )
    }
    return <>{logo}</>
  }

  return <SparkleIcon size={18} />
}

export function ChatHeader({
  title,
  subtitle,
  isLoading,
  onSettingsClick,
  onToolsClick,
  settingsOpen,
  toolsOpen,
  logo,
  showSettingsButton = true,
  showToolsButton = true,
}: ChatHeaderProps) {
  const hasActions = showSettingsButton || showToolsButton

  return (
    <div className="wmcp-chat-header" role="banner" aria-label="Chat header">
      <div className="wmcp-header-bg" />
      <div className="wmcp-header-content">
        <div className="wmcp-header-left">
          <div className="wmcp-header-avatar">
            <AvatarContent logo={logo} isLoading={isLoading} />
          </div>
          <div className="wmcp-header-brand">
            <span className="wmcp-header-title">{title}</span>
            <span className="wmcp-header-sub">
              <span className="wmcp-status-dot" />
              {subtitle}
            </span>
          </div>
        </div>
        {hasActions && (
          <div className="wmcp-header-actions">
            {showSettingsButton && (
              <button
                className={`wmcp-icon-btn ${settingsOpen ? 'wmcp-active' : ''}`}
                onClick={onSettingsClick}
                title="Settings"
                aria-label="Settings"
              >
                <SettingsIcon />
              </button>
            )}
            {showToolsButton && (
              <button
                className={`wmcp-icon-btn ${toolsOpen ? 'wmcp-active' : ''}`}
                onClick={onToolsClick}
                title="Tools"
                aria-label="Tools"
              >
                <ToolsIcon />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="wmcp-status-line" />
    </div>
  )
}
