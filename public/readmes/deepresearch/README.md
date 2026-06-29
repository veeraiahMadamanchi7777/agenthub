# deepresearch

Autonomous web research agent. Give it a research question and it breaks it down into sub-questions, runs parallel web searches, cross-references findings, and synthesizes a structured report with numbered inline citations.

## How it works

- Decomposes your query into 3–8 sub-questions
- Runs parallel web searches for each sub-question
- Ranks and extracts relevant passages from top results
- Cross-references findings for consistency and accuracy
- Synthesizes a final Markdown report with citations

## Parameters

| Field | Description |
|---|---|
| **Input** | Plain-text research question (any length or complexity) |
| **Output** | Structured Markdown report — executive summary, findings by topic, numbered references |

## Example prompts

- What are the top AI sandbox providers in 2026 and how do they compare on cold-start latency?
- Summarize the latest research on retrieval-augmented generation vs. fine-tuning for domain adaptation.

## Limitations

- Cannot access paywalled or login-gated content
- Reports may contain factual errors — always verify critical claims
- Best for research questions answerable in under 30 minutes
