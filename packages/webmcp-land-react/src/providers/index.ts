import { OpenAIAdapter } from './OpenAIAdapter'
import { AnthropicAdapter } from './AnthropicAdapter'
import { GoogleAdapter } from './GoogleAdapter'
import type { ProviderAdapter } from './ProviderAdapter'
import type { ProviderDefinition, BuiltinProviderName, ProviderOption } from '../types'

export function createAdapter(name: string): ProviderAdapter {
  switch (name) {
    case 'openai':
      return new OpenAIAdapter()
    case 'anthropic':
      return new AnthropicAdapter()
    case 'google':
      return new GoogleAdapter()
    default:
      throw new Error(`Unknown provider: ${name}`)
  }
}

export function createAllAdapters(): ProviderAdapter[] {
  return [new OpenAIAdapter(), new AnthropicAdapter(), new GoogleAdapter()]
}

// --- Provider resolution (moved from core/providers) ---

function adapterToDefinition(adapter: ProviderAdapter): ProviderDefinition {
  return {
    name: adapter.name,
    displayName: adapter.displayName,
    models: adapter.models,
    defaultModel: adapter.defaultModel,
    async sendMessage(params) {
      return adapter.send({
        message: null,
        toolResponses: null,
        ...params,
      })
    },
  }
}

const builtinDefinitions: Record<BuiltinProviderName, ProviderDefinition> = {
  openai: adapterToDefinition(new OpenAIAdapter()),
  anthropic: adapterToDefinition(new AnthropicAdapter()),
  google: adapterToDefinition(new GoogleAdapter()),
}

export const builtinProviders = builtinDefinitions

export function resolveProvider(provider: ProviderOption): ProviderDefinition {
  if (typeof provider === 'string') {
    const p = builtinDefinitions[provider]
    if (!p) throw new Error(`Unknown provider: ${provider}`)
    return p
  }
  return provider
}

export function resolveProviders(providers: ProviderOption[]): ProviderDefinition[] {
  return providers.map(resolveProvider)
}

export function getBuiltinProvider(name: BuiltinProviderName): ProviderDefinition {
  return builtinDefinitions[name]
}

export { OpenAIAdapter } from './OpenAIAdapter'
export { AnthropicAdapter } from './AnthropicAdapter'
export { GoogleAdapter } from './GoogleAdapter'
export { ProviderAdapter } from './ProviderAdapter'
