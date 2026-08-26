export const BET_PRESETS = [1, 2, 5, 10, 20, 50] as const;

export type BetPreset = (typeof BET_PRESETS)[number];

export function getAffordableBet(balance: number, requestedBet: number): BetPreset | null {
  if (!Number.isFinite(balance) || balance < BET_PRESETS[0]) return null;
  if (BET_PRESETS.includes(requestedBet as BetPreset) && requestedBet <= balance) {
    return requestedBet as BetPreset;
  }
  return [...BET_PRESETS].reverse().find((preset) => preset <= balance) || null;
}
