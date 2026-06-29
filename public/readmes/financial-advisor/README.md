# financial-advisor

Personal financial AI agent. Analyses your income, expenses, and investments — then gives actionable advice, forecasts, and budget plans powered by LLMs.

## How it works

- Connect your financial data or upload CSV exports
- The agent profiles spending patterns and income streams
- Runs scenario forecasts and budget recommendations
- Returns a structured plan with charts in the Streamlit UI

## Parameters

| Field | Description |
|---|---|
| **Input** | Income/expense CSV, portfolio holdings, or natural-language financial goals |
| **Output** | Budget plan, forecasts, and actionable recommendations in the embedded app |

## Run locally

```bash
git clone https://github.com/merendamattia/personal-financial-ai-agent
cd personal-financial-ai-agent
cp .env.example .env
docker build -t financial-ai-agent:local .
docker run -p 8501:8501 --env-file .env financial-ai-agent:local
```

In AgentHub: click **Run** on this agent, then **Open session** to load the app at `http://localhost:8501`.

## Example prompts

- What should my monthly savings rate be given $6k income and $4.2k expenses?
- Forecast my portfolio over 5 years with a conservative allocation.
- Build a debt payoff plan for my credit cards ordered by APR.

## Limitations

- Requires the Docker container running locally for embedded sessions
- Not financial advice — verify outputs before acting
- Prototype only; no live bank integrations yet
