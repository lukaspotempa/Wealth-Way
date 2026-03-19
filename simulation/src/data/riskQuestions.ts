export interface RiskQuestion {
  id: string
  question: string
  description: string
  options: RiskOption[]
}

export interface RiskOption {
  label: string
  value: number // 1 = conservative, 4 = aggressive
  description: string
}

export type RiskProfile = 'conservative' | 'balanced' | 'growth' | 'aggressive'

export interface RiskProfileResult {
  profile: RiskProfile
  label: string
  description: string
  color: string
  suggestedAllocation: Record<string, number>
}

export const riskQuestions: RiskQuestion[] = [
  {
    id: 'horizon',
    question: 'What is your investment time horizon?',
    description: 'How long do you plan to keep your money invested?',
    options: [
      { label: 'Less than 3 years', value: 1, description: 'Short-term savings goal' },
      { label: '3-7 years', value: 2, description: 'Medium-term goal like buying a home' },
      { label: '7-15 years', value: 3, description: 'Long-term wealth building' },
      { label: 'More than 15 years', value: 4, description: 'Retirement or generational wealth' },
    ],
  },
  {
    id: 'loss-tolerance',
    question: 'How would you react if your portfolio dropped 20% in one month?',
    description: 'Market drops are normal. Your emotional response matters.',
    options: [
      { label: 'Sell everything immediately', value: 1, description: 'I cannot afford to lose money' },
      { label: 'Sell some to reduce risk', value: 2, description: 'I would be worried and want to limit losses' },
      { label: 'Do nothing and wait', value: 3, description: 'I trust the market will recover' },
      { label: 'Buy more at lower prices', value: 4, description: 'Drops are buying opportunities' },
    ],
  },
  {
    id: 'experience',
    question: 'What is your investing experience?',
    description: 'Your familiarity with financial markets.',
    options: [
      { label: 'Complete beginner', value: 1, description: 'I have never invested before' },
      { label: 'Some knowledge', value: 2, description: 'I understand basic concepts' },
      { label: 'Experienced', value: 3, description: 'I have actively invested for years' },
      { label: 'Expert', value: 4, description: 'I work in finance or trade actively' },
    ],
  },
  {
    id: 'goal',
    question: 'What is your primary investment goal?',
    description: 'This helps determine the right balance of risk and return.',
    options: [
      { label: 'Preserve my capital', value: 1, description: 'Protect what I have against inflation' },
      { label: 'Steady income', value: 2, description: 'Generate regular returns with low risk' },
      { label: 'Long-term growth', value: 3, description: 'Grow my wealth over many years' },
      { label: 'Maximum returns', value: 4, description: 'Willing to accept high risk for high reward' },
    ],
  },
  {
    id: 'income-stability',
    question: 'How stable is your income?',
    description: 'Stable income allows you to take more investment risk.',
    options: [
      { label: 'Unstable / variable', value: 1, description: 'Freelance, gig work, or uncertain' },
      { label: 'Somewhat stable', value: 2, description: 'Contract work or small business' },
      { label: 'Stable employment', value: 3, description: 'Full-time job with steady salary' },
      { label: 'Very stable + savings', value: 4, description: 'Secure job with emergency fund' },
    ],
  },
  {
    id: 'risk-return',
    question: 'Which portfolio would you prefer?',
    description: 'Higher potential returns come with higher potential losses.',
    options: [
      { label: 'Avg +2% / Worst -5%', value: 1, description: 'Very low risk, very low return' },
      { label: 'Avg +5% / Worst -15%', value: 2, description: 'Moderate risk, moderate return' },
      { label: 'Avg +8% / Worst -25%', value: 3, description: 'Higher risk, higher return' },
      { label: 'Avg +12% / Worst -40%', value: 4, description: 'High risk, high return potential' },
    ],
  },
]

export function calculateRiskProfile(answers: Record<string, number>): RiskProfileResult {
  const values = Object.values(answers)
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length

  if (avg <= 1.5) {
    return {
      profile: 'conservative',
      label: 'Conservative',
      description: 'You prefer safety and capital preservation. Your portfolio focuses on bonds and stable assets with minimal equity exposure.',
      color: '#3b82f6',
      suggestedAllocation: {
        'swiss-bond': 40,
        'global-bond': 25,
        'smi': 15,
        'gold': 15,
        'usdchf': 5,
      },
    }
  }

  if (avg <= 2.5) {
    return {
      profile: 'balanced',
      label: 'Balanced',
      description: 'You want a mix of growth and stability. Your portfolio balances equities with bonds and safe-haven assets.',
      color: '#eab308',
      suggestedAllocation: {
        'smi': 20,
        'sp500': 15,
        'swiss-bond': 25,
        'global-bond': 15,
        'gold': 10,
        'nestle': 10,
        'eurchf': 5,
      },
    }
  }

  if (avg <= 3.2) {
    return {
      profile: 'growth',
      label: 'Growth',
      description: 'You prioritize long-term wealth building and can handle significant volatility. Your portfolio is equity-heavy.',
      color: '#22c55e',
      suggestedAllocation: {
        'smi': 20,
        'sp500': 25,
        'eurostoxx': 15,
        'apple': 10,
        'swiss-bond': 10,
        'gold': 10,
        'nestle': 10,
      },
    }
  }

  return {
    profile: 'aggressive',
    label: 'Aggressive',
    description: 'You seek maximum returns and accept high volatility. Your portfolio is concentrated in high-growth assets including individual stocks and crypto.',
    color: '#ef4444',
    suggestedAllocation: {
      'sp500': 20,
      'apple': 15,
      'tesla': 15,
      'bitcoin': 10,
      'eurostoxx': 15,
      'smi': 10,
      'gold': 5,
      'ethereum': 5,
      'novartis': 5,
    },
  }
}
