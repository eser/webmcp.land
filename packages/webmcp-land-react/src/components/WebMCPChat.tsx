import React, { useState, useCallback, useEffect, useRef } from 'react'
import type { WebMCPChatProps, MessageAttachment, MessageFeedback } from '../types'
import { useWebMCP } from '../hooks/useWebMCP'
import { useThemeFromOptions } from '../hooks/useTheme'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { SettingsPanel } from './SettingsPanel'
import { ToolsPanel } from './ToolsPanel'
import { FloatingButton } from './FloatingButton'
import { STYLES } from './styles'

export function WebMCPChat({
  // Provider
  providers,
  systemInstruction,
  proxyUrl,

  // Tools
  tools,

  // UI
  displayMode = 'bottom-right',
  defaultOpen = false,
  showToolsPanel: showToolsPanelProp = true,
  showSettingsPanel: showSettingsPanelProp = true,
  showFloatingButton: showFloatingButtonProp,
  showSettingsButton: showSettingsButtonProp,
  showToolsButton: showToolsButtonProp,
  showResetButton: showResetButtonProp,
  showTraceButton: showTraceButtonProp,
  headerTitle = 'WebMCP',
  headerSubtitle = 'Online',
  placeholder = 'Message WebMCP...',
  welcomeMessage,
  logo,
  floatingIcon,

  // Theme
  theme: themeOption,
  accentColor,
  borderRadius,
  fontFamily,

  // Dimensions
  width = 400,
  height = 600,

  // Events
  onMessage,
  onToolCall,
  onToolResult,
  onError,
  onOpen,
  onClose,
  onProviderChange,
  onStreamToken,
  onFeedback: onFeedbackProp,

  // Advanced
  maxTokens,
  temperature,
  initialMessages,
  persistMessages,
  storageKey,

  // Streaming
  streaming,

  // Context management
  maxContextMessages,

  // Attachments
  enableAttachments = false,
  acceptedFileTypes,

  // New features
  enableFeedback = false,
  enableCodeCopy = true,
  showTimestamps = false,
  groupMessages = true,
  showUnreadBadge = true,
  enableKeyboardShortcuts = true,

  // Suggestions
  suggestions,

  // Plugins
  plugins,

  // Component slots
  components = {},
}: WebMCPChatProps) {
  const webmcp = useWebMCP({
    providers,
    tools,
    systemInstruction,
    maxTokens,
    proxyUrl,
    streaming,
    maxContextMessages,
    plugins,
    initialMessages,
    persistMessages,
    storageKey,
    onMessage,
    onToolCall,
    onToolResult,
    onError,
    onProviderChange,
    onStreamToken,
  })

  // In managed mode, hide settings panel and settings button by default
  const isManaged = webmcp.isManaged
  const showSettingsPanel = isManaged ? false : showSettingsPanelProp
  const showSettingsButton = showSettingsButtonProp ?? !isManaged
  const showToolsButton = showToolsButtonProp ?? true
  const showResetButton = showResetButtonProp ?? true
  const showTraceButton = showTraceButtonProp ?? !isManaged

  const isInline = displayMode === 'inline'
  const showFloatingButton = isInline ? false : (showFloatingButtonProp ?? true)

  const [isOpen, setIsOpen] = useState(isInline ? true : defaultOpen)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [feedbackMap, setFeedbackMap] = useState<Record<string, MessageFeedback>>({})
  const prevMessageCountRef = useRef(webmcp.messages.length)

  const { cssVars } = useThemeFromOptions({ theme: themeOption, accentColor, borderRadius, fontFamily })

  // Track unread messages when chat is closed
  useEffect(() => {
    const currentCount = webmcp.messages.length
    if (!isOpen && currentCount > prevMessageCountRef.current) {
      const newMessages = webmcp.messages.slice(prevMessageCountRef.current)
      const assistantCount = newMessages.filter(m => m.type === 'assistant').length
      if (assistantCount > 0) {
        setUnreadCount(prev => prev + assistantCount)
      }
    }
    prevMessageCountRef.current = currentCount
  }, [webmcp.messages.length, isOpen])

  useEffect(() => {
    if (welcomeMessage && webmcp.messages.length === 0) {
      // Don't add as system message anymore — the empty state handles it
    }
  }, [])

  useEffect(() => {
    const id = 'wmcp-styles'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = STYLES
      document.head.appendChild(style)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts || isInline) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Cmd/Ctrl+K — toggle chat
      if (mod && e.key === 'k') {
        e.preventDefault()
        toggleOpen()
      }

      // Escape — close chat
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
        onClose?.()
      }

      // Cmd/Ctrl+Shift+Backspace — reset chat
      if (mod && e.shiftKey && e.key === 'Backspace' && isOpen) {
        e.preventDefault()
        handleReset()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, isInline, isOpen])

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        onOpen?.()
        setUnreadCount(0)
      } else {
        onClose?.()
      }
      return next
    })
  }, [onOpen, onClose])

  const handleSettingsClick = useCallback(() => {
    if (!showSettingsPanel) return
    setSettingsOpen((prev) => !prev)
    setToolsOpen(false)
  }, [showSettingsPanel])

  const handleToolsClick = useCallback(() => {
    setToolsOpen((prev) => !prev)
    setSettingsOpen(false)
  }, [])

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    const atts = pendingAttachments.length > 0 ? [...pendingAttachments] : undefined
    setPendingAttachments([])
    webmcp.send(text, atts)
  }, [inputValue, pendingAttachments, webmcp.send])

  const handleSuggestionClick = useCallback((text: string) => {
    setInputValue(text)
    // Auto-send the suggestion
    setTimeout(() => {
      webmcp.send(text)
    }, 0)
  }, [webmcp.send])

  const handleReset = useCallback(() => {
    webmcp.reset()
    setInputValue('')
    setPendingAttachments([])
    setFeedbackMap({})
  }, [webmcp.reset])

  const handleTrace = useCallback(async () => {
    const trace = webmcp.getTrace()
    try {
      await navigator.clipboard.writeText(JSON.stringify(trace, null, 2))
      webmcp.addMessage('system', 'Trace copied to clipboard.')
    } catch {
      webmcp.addMessage('error', 'Failed to copy trace.')
    }
  }, [webmcp.getTrace, webmcp.addMessage])

  const handleExecuteTool = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      const tool = webmcp.tools.find((t) => t.name === name)
      if (!tool) throw new Error(`Tool "${name}" not found`)
      return tool.execute(args)
    },
    [webmcp.tools]
  )

  const handleAttach = useCallback((attachment: MessageAttachment) => {
    setPendingAttachments((prev) => [...prev, attachment])
  }, [])

  const handleRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleFeedback = useCallback(
    (messageId: string, feedback: MessageFeedback) => {
      setFeedbackMap((prev) => ({ ...prev, [messageId]: feedback }))
      onFeedbackProp?.(messageId, feedback)
    },
    [onFeedbackProp]
  )

  // Apply feedback map onto messages
  const messagesWithFeedback = webmcp.messages.map((msg) => {
    const fb = feedbackMap[msg.id]
    return fb !== undefined ? { ...msg, feedback: fb } : msg
  })

  // Resolve component slots
  const HeaderComp = components.Header === null ? null : (components.Header || ChatHeader)
  const InputComp = components.Input === null ? null : (components.Input || ChatInput)
  const SettingsPanelComp =
    !showSettingsPanel || components.SettingsPanel === null
      ? null
      : (components.SettingsPanel || SettingsPanel)
  const ToolsPanelComp =
    !showToolsPanelProp || components.ToolsPanel === null
      ? null
      : (components.ToolsPanel || ToolsPanel)
  const FloatingBtnComp =
    !showFloatingButton || components.FloatingButton === null
      ? null
      : (components.FloatingButton || FloatingButton)

  const positionClass = isInline ? 'wmcp-inline' : `wmcp-floating wmcp-${displayMode}`

  const containerStyle: React.CSSProperties = {
    ...cssVars as React.CSSProperties,
    ...(isInline ? {} : { width, height }),
  }

  return (
    <div className={`wmcp-root ${positionClass}`} role="complementary" aria-label="AI Chat">
      {!isInline && FloatingBtnComp && (
        <FloatingBtnComp
          onClick={toggleOpen}
          isOpen={isOpen}
          isLoading={webmcp.isLoading}
          icon={floatingIcon}
          unreadCount={showUnreadBadge ? unreadCount : 0}
        />
      )}

      {(isOpen || isInline) && (
        <div className="wmcp-chatbox" style={containerStyle} role="dialog" aria-label="Chat window" aria-modal={!isInline}>
          {HeaderComp && (
            <HeaderComp
              title={headerTitle}
              subtitle={headerSubtitle}
              isLoading={webmcp.isLoading}
              onSettingsClick={handleSettingsClick}
              onToolsClick={handleToolsClick}
              settingsOpen={settingsOpen}
              toolsOpen={toolsOpen}
              logo={logo}
              showSettingsButton={showSettingsButton}
              showToolsButton={showToolsButton}
            />
          )}

          {settingsOpen && SettingsPanelComp && (
            <div className="wmcp-panel" role="region" aria-label="Settings">
              <SettingsPanelComp
                provider={webmcp.provider}
                model={webmcp.model}
                providers={providers || ['google', 'openai', 'anthropic']}
                onProviderChange={webmcp.setProvider}
                onModelChange={webmcp.setModel}
                onApiKeySave={webmcp.setApiKey}
                hasApiKey={webmcp.hasApiKey}
                availableModels={
                  webmcp.availableProviders.find((p) => p.name === webmcp.provider)?.models || []
                }
                credentialMode="byok"
              />
            </div>
          )}

          {toolsOpen && ToolsPanelComp && (
            <div className="wmcp-panel" role="region" aria-label="Tools">
              <ToolsPanelComp tools={webmcp.tools} onExecute={handleExecuteTool} />
            </div>
          )}

          <ChatMessages
            messages={messagesWithFeedback}
            isLoading={webmcp.isLoading && !webmcp.isStreaming}
            MessageComponent={components.Message}
            ThinkingComponent={components.ThinkingIndicator}
            showTimestamps={showTimestamps}
            groupMessages={groupMessages}
            enableFeedback={enableFeedback}
            onFeedback={handleFeedback}
            enableCodeCopy={enableCodeCopy}
            welcomeMessage={welcomeMessage}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />

          {InputComp && (
            <InputComp
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              placeholder={placeholder}
              disabled={!webmcp.hasApiKey}
              isLoading={webmcp.isLoading}
              onReset={handleReset}
              onTrace={handleTrace}
              showResetButton={showResetButton}
              showTraceButton={showTraceButton}
              attachments={pendingAttachments}
              onAttach={handleAttach}
              onRemoveAttachment={handleRemoveAttachment}
              enableAttachments={enableAttachments}
              onStop={webmcp.stop}
              isStreaming={webmcp.isStreaming}
            />
          )}
        </div>
      )}
    </div>
  )
}
