// src/utils/gameEngine.ts

/**
 * Aviator uses a player-independent inverse-CDF crash curve.
 * For a fixed cashout target m, P(crash >= m) is approximately 0.90 / m.
 * This gives a transparent 90% theoretical RTP while preserving a hard 8x cap.
 */
export const TARGET_RTP_MIN = 0.90;
export const TARGET_RTP_MAX = 0.90;
export const TARGET_GLOBAL_RTP = 0.90;
export const HOUSE_MARGIN = 0.10;

interface AviatorEngineState {
  totalRounds: number;
  lastCrashPoint: number;
}

const engineState: AviatorEngineState = {
  totalRounds: 0,
  lastCrashPoint: 1.00,
};

/**
 * Notify the engine of player round outcome to adjust drain & reward cycles
 */
export function recordPlayerRoundOutcome(didWin: boolean, betAmount: number = 0, winAmount: number = 0) {
  void didWin;
  void betAmount;
  void winAmount;
}

/**
 * Calculate the crash multiplier for the upcoming round based on 92%-94% RTP rules
 * @param totalBetsInRound - Sum of all active bets (fake + real)
 * @param playerHasActiveBet - Whether the human player has bet in this round
 * @param playerBetAmount - Human player's current bet amount
 */
export function calculateCrashPoint(
  totalBetsInRound: number = 0,
  playerHasActiveBet: boolean = false,
  playerBetAmount: number = 0
): number {
  engineState.totalRounds += 1;
  void totalBetsInRound;
  void playerHasActiveBet;
  void playerBetAmount;

  // Inverse-CDF sampling: low flights are common, while 4x-8x spikes are rare.
  const random = Math.random();
  const uncappedCrash = TARGET_GLOBAL_RTP / Math.max(Number.EPSILON, 1 - random);
  const crashPoint = Math.min(8.00, Math.max(1.00, parseFloat(uncappedCrash.toFixed(2))));
  engineState.lastCrashPoint = crashPoint;

  return crashPoint;
}

export function getEngineDiagnostics() {
  return { ...engineState };
}
