import type { WebMCPPlugin } from './types'

export interface RateLimiterOptions {
  maxPerMinute: number
}

export function createRateLimiterPlugin(options: RateLimiterOptions): WebMCPPlugin {
  const { maxPerMinute } = options
  const timestamps: number[] = []

  return {
    name: 'rate-limiter',

    async onBeforeSend() {
      const now = Date.now()
      const windowStart = now - 60_000

      // Remove timestamps outside the window
      while (timestamps.length > 0 && timestamps[0] < windowStart) {
        timestamps.shift()
      }

      if (timestamps.length >= maxPerMinute) {
        return false
      }

      timestamps.push(now)
    },
  }
}
