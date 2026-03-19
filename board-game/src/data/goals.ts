import type { LifeGoal } from "../types/game";

export const LIFE_GOALS: LifeGoal[] = [
  {
    id: "goal-car",
    name: "First Car",
    emoji: "🚗",
    targetNetWorth: 3000,
    description: "Save up for a reliable used car — your ticket to independence.",
    celebrationMessage: "You saved enough for your first car! Freedom on wheels!",
    realWorldTip:
      "Building a savings habit early is the foundation of wealth. Even small consistent steps compound over time.",
  },
  {
    id: "goal-vacation",
    name: "Dream Vacation",
    emoji: "✈️",
    targetNetWorth: 8000,
    description: "Time for the trip you always wanted. Experiences matter!",
    celebrationMessage: "Bon voyage! Your smart investing funded a proper adventure.",
    realWorldTip:
      "Notice how your investments grew while you slept? That's compound interest — the most powerful force in personal finance.",
  },
  {
    id: "goal-emergency",
    name: "Emergency Fund",
    emoji: "🛡️",
    targetNetWorth: 20000,
    description: "3–6 months of expenses, safe and liquid. Sleep better at night.",
    celebrationMessage:
      "You have a real financial safety net now. Unexpected costs can't derail you!",
    realWorldTip:
      "Financial experts recommend keeping 3–6 months of expenses in cash. This frees you to invest the rest without fear.",
  },
  {
    id: "goal-house",
    name: "Home Down Payment",
    emoji: "🏠",
    targetNetWorth: 60000,
    description: "20% down on your first property — the biggest purchase of your life.",
    celebrationMessage:
      "You're ready to own your own home! Years of disciplined investing made it possible.",
    realWorldTip:
      "A 20% down payment avoids expensive mortgage insurance. Patience and consistent investing is the proven path to homeownership.",
  },
  {
    id: "goal-freedom",
    name: "Financial Freedom",
    emoji: "🌍",
    targetNetWorth: 200000,
    description:
      "Your portfolio generates enough to live on. Work becomes a choice, not a necessity.",
    celebrationMessage:
      "You've achieved Financial Freedom! Your money works harder than you do.",
    realWorldTip:
      "The '4% rule': withdrawing 4% of your portfolio annually is statistically sustainable indefinitely. At $200k that's $8,000/year — and it grows!",
  },
];
