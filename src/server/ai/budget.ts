/**
 * Token budget + cost control (docs/09 §9.5). Per-session usage tracking
 * with request gates and warning thresholds.
 */

export interface TokenBudget {
  maxPerRequest: number
  maxPerSession: number
  maxPerDay: number
  warningThreshold: number
}

export const DEFAULT_BUDGET: TokenBudget = {
  maxPerRequest: 8000,
  maxPerSession: 128000,
  maxPerDay: 512000,
  warningThreshold: 96000,
}

/** Rough estimate: ~4 characters per token. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function estimateMessagesTokens(messages: Array<{ content: string }>): number {
  return estimateTokens(messages.map((m) => m.content).join('\n'))
}

export class BudgetManager {
  private readonly usage = new Map<string, number>()

  used(sessionId: string): number {
    return this.usage.get(sessionId) ?? 0
  }

  canProceed(sessionId: string, estimatedTokens: number, budget: TokenBudget): boolean {
    if (estimatedTokens > budget.maxPerRequest) return false
    return this.used(sessionId) + estimatedTokens <= budget.maxPerSession
  }

  track(sessionId: string, tokens: number): void {
    this.usage.set(sessionId, this.used(sessionId) + tokens)
  }

  shouldWarn(sessionId: string, budget: TokenBudget): boolean {
    return this.used(sessionId) >= budget.warningThreshold
  }

  reset(sessionId: string): void {
    this.usage.delete(sessionId)
  }
}
