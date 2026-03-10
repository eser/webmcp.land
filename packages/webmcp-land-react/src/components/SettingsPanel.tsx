import React, { useState, useCallback } from 'react'
import type { SettingsPanelProps } from '../types'
import { EyeIcon, EyeOffIcon } from './icons'

export function SettingsPanel({
  provider,
  model,
  providers,
  onProviderChange,
  onModelChange,
  onApiKeySave,
  hasApiKey,
  availableModels,
  credentialMode = 'byok',
}: SettingsPanelProps) {
  const isManaged = credentialMode === 'managed'

  const [apiKeyValue, setApiKeyValue] = useState(hasApiKey ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : '')
  const [showMasked, setShowMasked] = useState(hasApiKey)
  const [showPassword, setShowPassword] = useState(false)

  const handleSaveKey = useCallback((value: string) => {
    if (value && !value.startsWith('\u2022')) {
      onApiKeySave(value)
      setApiKeyValue('\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022')
      setShowMasked(true)
    }
  }, [onApiKeySave])

  const handleFocus = useCallback(() => {
    if (showMasked) {
      setApiKeyValue('')
      setShowMasked(false)
    }
  }, [showMasked])

  const handleBlur = useCallback(() => {
    if (!apiKeyValue && hasApiKey) {
      setApiKeyValue('\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022')
      setShowMasked(true)
    } else if (apiKeyValue && !apiKeyValue.startsWith('\u2022')) {
      handleSaveKey(apiKeyValue)
    }
  }, [apiKeyValue, hasApiKey, handleSaveKey])

  return (
    <div className="wmcp-panel-inner">
      <div className="wmcp-panel-title">Configuration</div>

      {isManaged && (
        <div className="wmcp-managed-info">
          AI is configured by the site owner. No API key required.
        </div>
      )}

      {!isManaged && (
        <>
          <div className="wmcp-settings-grid">
            <div className="wmcp-settings-row">
              <label>Provider</label>
              <select value={provider} onChange={(e) => onProviderChange(e.target.value)}>
                {providers.map((p) => {
                  const name = typeof p === 'string' ? p : p.name
                  const display = typeof p === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : p.displayName
                  return (
                    <option key={name} value={name}>
                      {display}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="wmcp-settings-row">
              <label>Model</label>
              <select value={model} onChange={(e) => onModelChange(e.target.value)}>
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="wmcp-settings-row">
            <label>API Key</label>
            <div className="wmcp-api-key-row">
              <input
                type={showPassword ? 'text' : 'password'}
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="sk-..."
              />
              <button
                className="wmcp-icon-btn"
                onClick={() => setShowPassword((p) => !p)}
                title={showPassword ? 'Hide' : 'Show'}
                aria-label={showPassword ? 'Hide API key' : 'Show API key'}
                type="button"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
