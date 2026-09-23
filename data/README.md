# Dataset conventions

The UI is intentionally tolerant of partial data. Use `null` for unknown or region-dependent numeric prices instead of guessing.

## models.json

Primary measures:

- `score`: benchmark score on a 0–100 scale;
- `costPerTask`: recorded agent cost for the same benchmark run/configuration;
- `effort`: reasoning/agent effort label;
- `current`: whether the reference chart marks the configuration as current;
- `dataQuality`: provenance class.

Token pricing is stored separately from benchmark evidence. When a benchmark record has API price fields, it must also carry `pricingSourceLabel`, `pricingSourceUrl`, and `pricingAsOf`.

The Models dashboard can then estimate a configurable token-only request cost while keeping the benchmark's recorded agent cost/task unchanged. This avoids treating a list price as if it were the full agent invoice.

Future useful fields can be added for latency quantiles, tool-call counts and context size.

## data-stack.json

Contains four related but distinct concepts:

- execution engines;
- file/table formats;
- benchmark runs;
- languages/abstraction evolution.

A benchmark run must say whether it is `measured` or an `illustrative-template`.

`stackLayers` is the conceptual architecture map used to keep unlike technologies separate: storage → representation → table format → catalog → engine → DataFrame/API → pipeline abstraction → serving. Use it when adding a new technology so the UI explains *which problem it solves* before comparing features or performance.

## cloud.json

Keep these separate:

- capability comparison;
- pricing unit/model;
- concrete SKU/region price;
- orchestration abstraction.

This prevents false comparisons such as a raw VM hourly rate versus a managed serverless warehouse cost.

## hardware.json

The seed `perfIndex` and `perfPerWatt` fields are normalized dashboard indices, not vendor benchmark claims. Replace or supplement them with named benchmark suites when measured data is available.

## evolution.json

Use this for timeline-style infrastructure changes. Categories currently include:

- accelerator;
- network;
- display;
- energy.

Network can contain both datacenter links and mobile generations, but add a subtype field if that section becomes large.


## free-labs.json

Catalog of hosted free plans, trials, local-free desktop tools and open-source/self-hosted tools.

Required comparison fields:

- `tierType`: `true-free`, `trial`, `local-free`, or `open-source`
- `duration`
- `quota`
- `cardRequired`
- `platforms` / access model
- `goodFor`
- `limits`
- `commercialUse`
- official `source` and `asOf`

Never classify expiring credits as `true-free`.

## runtime-lab.json

Execution-model knowledge and benchmark recipes for pandas, Polars, DuckDB, PySpark, Scala Spark and Spark SQL.

Benchmark recipes are intentionally not measured results. Add timing results only after fixing dataset, layout, runtime version, hardware/cluster shape and cache policy.

## serverless.json

Serverless/function/container comparison records. Keep billing unit and free quota separate because request-count, GB-second and vCPU/GiB-second models are not directly comparable.


## use-case-guides.json

Task-first recipes that reference records from `free-labs.json` by ID.

Examples:

- run FastAPI for $0;
- get a real Linux VM;
- hosted PostgreSQL / MongoDB / Redis;
- learn Spark or Kafka;
- store Parquet;
- build a Microsoft BI/Fabric lab;
- FOIL zero-cost infrastructure;
- end-to-end data-engineering lab.

Do **not** duplicate service quotas here. Keep the quota/source in `free-labs.json` and only store the recipe rationale, caveats and referenced service IDs.

CI validates that every referenced service ID exists.

## coding-agents.json

Agent benchmark datasets that must remain isolated by benchmark/harness.

Do not merge Browser Use, Terminal-Bench and Artificial Analysis scores into one numerical ranking unless the benchmark itself defines a common scale.

## Single-source rule

Use one canonical JSON source for each volatile fact:

- free-tier/service quotas → `free-labs.json`
- serverless billing models → `serverless.json`
- cloud platform architecture/pricing units → `cloud.json`
- runtime performance concepts/recipes → `runtime-lab.json`
- task-first free-stack recipes → `use-case-guides.json`

Views should derive summaries from these records instead of copying numbers into React components.


## releases.json

Dated release/version tracker for the languages and data technologies shown in the Data dashboard.

Each row stores:

- latest stable version and release date;
- status / LTS context;
- production baseline;
- next preview or scheduled major release when relevant;
- concise release highlights;
- compatibility/migration caveat;
- official source and verification date.

Keep this dataset descriptive. A newer version is not automatically a better production choice; the dashboard should show the current release and the conservative baseline separately.
