import React from 'react'
import type { FloatingButtonProps } from '../types'
import { CloseIcon, SparkleIcon } from './icons'

function ButtonContent({ icon, isOpen }: { icon?: string | React.ReactNode; isOpen: boolean }) {
  if (isOpen) return <CloseIcon />

  if (icon) {
    if (typeof icon === 'string') {
      return (
        <img
          src={icon}
          alt=""
          style={{ width: 24, height: 24, borderRadius: '8px', objectFit: 'cover' }}
        />
      )
    }
    return <>{icon}</>
  }

  return <SparkleIcon size={22} />
}

export function FloatingButton({ onClick, isOpen, isLoading, icon, unreadCount = 0 }: FloatingButtonProps) {
  return (
    <button
      className={`wmcp-floating-btn ${isOpen ? 'wmcp-open' : ''} ${isLoading ? 'wmcp-loading' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : `Open chat${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
    >
      <ButtonContent icon={icon} isOpen={isOpen} />
      {!isOpen && unreadCount > 0 && (
        <span className="wmcp-unread-badge" aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
