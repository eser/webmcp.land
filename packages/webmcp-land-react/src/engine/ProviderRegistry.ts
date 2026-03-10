import type { ProviderAdapter } from '../providers/ProviderAdapter'

export class ProviderRegistry {
  private adapters = new Map<string, ProviderAdapter>()
  private activeProvider: string | null = null

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.name, adapter)
    if (!this.activeProvider) {
      this.activeProvider = adapter.name
    }
  }

  get(name: string): ProviderAdapter | undefined {
    return this.adapters.get(name)
  }

  getActive(): ProviderAdapter | undefined {
    if (!this.activeProvider) return undefined
    return this.adapters.get(this.activeProvider)
  }

  setActive(name: string): void {
    if (!this.adapters.has(name)) {
      throw new Error(`Provider "${name}" not registered`)
    }
    this.activeProvider = name
  }

  getActiveName(): string | null {
    return this.activeProvider
  }

  getAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values())
  }
}
