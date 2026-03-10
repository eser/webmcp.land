import { useState, useCallback, useMemo } from 'react'
import type { ProviderOption } from '../types'
import { resolveProviders } from '../providers'

export interface UseProviderOptions {
  providers?: ProviderOption[]
  onProviderChange?: (provider: string) => void
}

export function useProvider(options: UseProviderOptions = {}) {
  const {
    providers: providerOptions = ['google', 'openai', 'anthropic'],
    onProviderChange,
  } = options

  const resolvedProviders = useMemo(() => resolveProviders(providerOptions), [providerOptions])

  const [providerName, setProviderName] = useState<string>(resolvedProviders[0]?.name || 'google')
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})

  const currentProvider = useMemo(() => {
    return resolvedProviders.find((p) => p.name === providerName) || resolvedProviders[0]
  }, [providerName, resolvedProviders])

  const [model, setModel] = useState<string>(
    currentProvider.defaultModel
  )

  const setProvider = useCallback(
    (name: string) => {
      setProviderName(name)
      const p = resolvedProviders.find((pr) => pr.name === name)
      if (p) {
        setModel(p.defaultModel)
      }
      onProviderChange?.(name)
    },
    [resolvedProviders, onProviderChange]
  )

  const setApiKey = useCallback(
    (key: string) => {
      setApiKeys((prev) => ({ ...prev, [providerName]: key }))
    },
    [providerName]
  )

  const apiKey = apiKeys[providerName] || ''
  const hasApiKey = !!apiKey

  return {
    provider: currentProvider,
    providerName,
    model,
    apiKey,
    hasApiKey,
    availableProviders: resolvedProviders,
    setProvider,
    setModel,
    setApiKey,
  }
}
