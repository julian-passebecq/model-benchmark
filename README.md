# Benchmark Observatory

A Git-backed knowledge console for five complementary technical dashboards:

1. **Model efficiency** — agent benchmark score, cost/task, effort, provider and score-per-dollar.
2. **Modern data stack** — Spark, DuckDB, Polars, Trino/DataFusion, Parquet, Iceberg, Delta, Hudi, DuckLake, benchmarks and language evolution.
3. **Cloud data platforms** — Databricks, Microsoft Fabric, BigQuery, Snowflake and AWS, plus pricing models, VM shapes and orchestration layers.
4. **Compute & devices** — laptop/server CPUs, datacenter GPUs and mobile SoCs with performance/efficiency views.
5. **Infrastructure evolution** — accelerator, optical/network, 4G/5G, display and datacenter-energy timelines.

## Design

The UI is a three-pane technical workspace:

- **top ribbon**: switch between the five observatories;
- **left rail**: navigation and data-model reminders;
- **main canvas**: interactive charts, matrices, tables and timelines;
- **right inspector**: source, caveat and selected-record details.

The visual language intentionally keeps the dense, dark benchmark feel of the reference material while adding a reusable application shell and provenance-aware records.

## What changed in the data model

The app now keeps volatile catalogs in dedicated source-of-truth files instead of duplicating them across dashboards:

- `data/free-labs.json` — all hosted free tiers, trials, local/community tools and quotas;
- `data/use-case-guides.json` — references free-lab service IDs to build practical “I need to…” stacks;
- `data/runtime-lab.json` — Python / pandas / Polars / DuckDB / PySpark / Scala / Spark SQL execution profiles and benchmark recipes;
- `data/serverless.json` — Lambda / Functions / Cloud Run / Workers / Container Apps comparison;
- `data/releases.json` — current data-stack versions and release tracking;
- `data/cloud.json` — cloud platform capabilities, query pricing, VM shapes and self-host baselines.

`npm run validate:data` checks JSON validity, duplicate IDs, source metadata, use-case references and selected schema invariants before TypeScript/build CI runs.

## Data-first architecture

All dashboard content lives in version-controlled JSON:

```
data/
  models.json
  data-stack.json
  cloud.json
  hardware.json
  evolution.json
  coding-agents.json
  free-labs.json
  runtime-lab.json
  serverless.json
```

The React views import these files through `lib/data.ts`. Updating a model, cloud price, engine capability or hardware generation does not require rewriting the dashboard components.

Every important record can carry:

- source label + URL;
- snapshot date;
- data-quality type;
- caveat/note;
- normalized fields for filtering and charts.

### Evidence policy

The initial data deliberately distinguishes:

- **reference-image** values transcribed from the supplied model benchmark graphic;
- **official/source-linked** product capability descriptions;
- **illustrative-template** benchmark timings that exist only to demonstrate the chart schema until replaced by reproducible measured runs.

Do not present an illustrative timing as a measured benchmark. Replace the record and change `sourceType` to `measured` when you have a fixture, hardware shape, run command and source artifact.

## Local development

```bash
npm install
npm run dev
```

Verification:

```bash
npm run typecheck
npm run build
```

## Updating the datasets

A good update PR should include the data change and source/caveat change together.

Example model record:

```json
{
  "id": "model-config-id",
  "label": "Model name + effort",
  "provider": "Provider",
  "score": 50.0,
  "costPerTask": 0.12,
  "benchmark": "Benchmark name",
  "current": true,
  "dataQuality": "upstream",
  "sourceLabel": "Upstream benchmark",
  "sourceUrl": "https://...",
  "asOf": "2026-09-23"
}
```

For volatile cloud prices, prefer leaving the numeric value null until a concrete region/SKU/pricing unit is fixed. The qualitative pricing model remains useful while preventing a stale global price from looking authoritative.

## Next data passes

The app already has schema slots for the areas that are most useful to extend:

- reproducible 1 TB / 5 TB / 10 TB Parquet + Iceberg/Delta query suites;
- bytes-scanned vs capacity/credit/DBU normalized cloud workloads;
- concrete VM/GPU SKU prices by region;
- model token input/output pricing and latency distributions;
- CPU/GPU tokens-per-second and energy-per-token runs;
- Ethernet/InfiniBand/optics generations;
- grid carbon intensity, PUE, water and firm clean-power availability;
- smartphone CPU/GPU/NPU benchmark series and display efficiency.

## CI

GitHub Actions runs TypeScript checking and a production Next.js build on pushes and pull requests.

Current implementation branch: `feature/benchmark-observatory-v1`.


## Free lab catalog

The Cloud dashboard now separates four different meanings of “free”:

- **true-free** — recurring/no-expiry hosted quota;
- **trial** — time-limited or credit-limited evaluation;
- **local-free** — free desktop/local tooling;
- **open-source** — self-hosted software where you provide the compute.

The catalog is stored in `data/free-labs.json` and includes compute, databases, warehouses, CI/CD, web/serverless, BI and developer tooling. Each row keeps its quota, duration, account/card requirement, caveat, commercial-use note and official source.

The Cloud dashboard also has a **Serverless** comparison sourced from `data/serverless.json` for Lambda, Azure Functions, Cloud Run, Cloudflare Workers and Azure Container Apps.

## Python / Spark runtime lab

`data/runtime-lab.json` models execution behavior for pandas, Polars, DuckDB, PySpark, Spark with Scala and Spark SQL.

It also defines reproducible benchmark recipes from 1 GB local tests through 1 TB distributed tests, plus a specific built-in-expression vs Python UDF / Pandas UDF / Scala UDF experiment.

The dashboard intentionally stores benchmark **recipes before timings**. A measured result should only be added when dataset, file layout, engine version, cluster/hardware and cold/warm-cache policy are versioned with it.
