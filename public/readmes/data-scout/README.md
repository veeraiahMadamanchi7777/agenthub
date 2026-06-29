# data-scout

Data analysis agent. Drop a CSV, connect a database, or paste raw data. It profiles the dataset, identifies patterns, runs statistical tests, and generates interactive visualizations.

## How it works

- Ingests your data and profiles each column (type, nulls, distribution)
- Detects outliers, correlations, and trends automatically
- Runs statistical tests appropriate to your data types
- Generates interactive Plotly charts
- Produces a written findings summary

## Parameters

| Field | Description |
|---|---|
| **Input** | CSV file, JSON array, PostgreSQL connection string, or natural-language dataset description |
| **Output** | Analysis report with embedded interactive charts (HTML) and a findings summary |

## Example prompts

- Analyze this sales CSV and find the top 3 drivers of revenue growth over the past 12 months.
- Profile my user table — flag any data quality issues and show me the distribution of signup dates.

## Limitations

- Maximum dataset size: 10M rows / 50MB
- Database connections must be read-only for safety
- Visualization output requires a browser to render
