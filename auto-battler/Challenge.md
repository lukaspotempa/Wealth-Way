# PostFinance Case Development Framework

## 1. Topic of the Case
**Investment education**

## 2. Title of the Case
**Wealth Manager Arena: The Investing Game (Bull vs Bear Edition)**

## 3. Case Summary

### A. What is the current problem?
Around 50% of adults do not invest in securities, even though long-term investing is key to building wealth. The main barriers are:

- lack of knowledge / never having done it before,
- fear of making mistakes or losing money,
- perceived lack of money, despite the possibility to invest small amounts via monthly savings plans.

Investing is also hard to “try out” safely: beginners do not want to risk real money, and classic stock market games typically run for only a few weeks or months, failing to reflect realistic long-term investment cycles.

Existing investment education is often passive, time-intensive, and not engaging, and many beginners wrongly associate investing with speculation or short-term trading.

### B. What is the expected final product?
A gamified investment education prototype, **“Wealth Manager Arena: The Investing Game”**, for beginners and non-experts.

The game should teach core principles such as:

- risk profiling,
- diversification,
- long-term investing,
- different asset classes,
- dealing with volatility.

The user interface should include two key functions/features:

#### a) Self-learning sandbox
Users can create a portfolio from a predefined set of assets and choose the asset allocation. Assets may be pre-selected by the teams, but the selection must remain realistic (see Section 4: Data). Users can then challenge and test their portfolio across realistic market phases while time is accelerated (for example, years in minutes) to experience long-term effects.

#### b) Ideally multiplayer mode (Battle Mode)
The same functionality as the sandbox, but in a competitive format (team vs. team or person vs. person), including a leaderboard to make it suitable for events and workshops.

Additional features that enhance or simplify playful learning are welcome.

### C. Who are the users of this solution?
- Beginners / non-investors with limited knowledge (retail prospects, young adults)
- Schools and youth programs (financial literacy workshops)
- Event participants (bank events, public activations)

## 4. Data

### What numbers, text, or images are necessary to solve the case?
A small set of historical market data (prices/returns) for a simplified universe is sufficient, for example:

- equity indices (e.g. SMI, Euro Stoxx 50, Dow Jones)
- a subset of single stocks
- bonds (e.g. bond index or 10Y yield)
- currencies (USD/CHF, EUR/CHF)
- gold
- optional: BTC (and ETH)

Additional content may include:

- short educational text snippets
- event/news cards (market phases, crises, interest rate shocks)

Alternatively, teams may use a fully or partially synthetic / self-generated dataset, for example stochastically simulated price series based on typical financial market behavior. This is perfectly acceptable and encouraged if it saves time. The goal is not data sourcing, but building the game mechanics.

**Focus on gameplay, not data hunting.**

### Which datasets are provided by the company?
- No proprietary dataset will be provided.
- Teams are free to start with a subset of instruments and use any public source.
- Teams may also create their own fictional or simulated market datasets instead of using real historical data.
- No client or confidential data will be provided.

### Which additional data sources may be helpful?
- Public market data sources / APIs (e.g. Yahoo Finance Historical Data, Stooq, Alpha Vantage, FRED)
- Random-walk / Monte Carlo style simulations to generate realistic but fictional market data

## 5. Technology
- Teams may use any web or mobile tech stack to build a playable prototype (UI + charts).
- A lightweight backend/database is recommended to store game state, scoring, and leaderboards.
- For Battle Mode, real-time features (e.g. WebSockets or Firebase) may be helpful.
- Optional: QR-code onboarding for events and/or an LLM-based “investment coach.”
- PostFinance will not provide proprietary APIs or SDKs; teams may use any public data sources and standard tools.

## 6. Use Case and Business Case

### What job does it do well for the users?
The solution should help beginners experience investing in a safe, playful way and build confidence by learning core principles such as:

- risk profile,
- diversification,
- long-term thinking,
- dealing with volatility.

This should happen through a time-accelerated simulation (for example, years in minutes).

The solution should work both as:

- a self-learning game, and
- an event/workshop format (schools, youth programs, public events),

with optional **Battle Mode**, where teams compete in the same market scenario.

### Business case
Higher financial literacy and engagement can lead to:

- stronger trust and brand affinity,
- an additional activation format for events and education,
- potential lead generation and onboarding entry points.

Ultimately, the goal is to help more clients and prospects start investing, make better long-term decisions, and increase adoption of the bank’s investing solutions through the knowledge and confidence gained via the game.

### Are participants supposed to come with a use case?
No. The use case is provided. Teams should focus on building the best prototype and gameplay mechanics.

## 7. Judgment Criteria

### Creativity (25%)
- Originality of the concept
- Engaging game mechanics
- Smart learning design

### Visual Design (20%)
- Clear UI/UX
- Intuitive flow for beginners
- High-quality visuals and charts

### Feasibility (20%)
- MVP completeness
- Technical robustness
- Playable demo within hackathon scope

### Reachability (15%)
- Realistic adoption potential
- Works for beginners
- Easy onboarding (e.g. quick start / QR join)
- Event-ready usability

### Learning Impact & Realism (20%)
- Teaches core investing principles (risk profile, diversification, long-term investing)
- Discourages gambling behavior
- Feedback explains outcomes in simple language

## 8. Presentation Prototype

### Format
- Pitch
- Live demo
- Q&A

### Key Elements
- Beginner problem + solution
- Game mechanics (market cycles, long-term simulation)
- Learning feedback + scoring
- Optional: Battle Mode / leaderboard

### Requirements
- Playable prototype / demo
- Show at least one market phase change and the resulting outcome/learning