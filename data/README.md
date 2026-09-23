# Dataset conventions

The UI is intentionally tolerant of partial data. Use `null` for unknown or region-dependent numeric prices instead of guessing.

## models.json

Primary measures:

- `score`: benchmark score on a 0–100 scale;
- `costPerTask`: recorded agent cost for the same benchmark run/configuration;
- `effort`: reasoning/agent effort label;
- `current`: whether the reference chart marks the configuration as current;
- `dataQuality`: provenance class.

Future useful fields can be added for token pricing, latency quantiles, tool-call counts and context size.

## data-stack.json

Contains four related but distinct concepts:

- execution engines;
- file/table formats;
- benchmark runs;
- languages/abstraction evolution.

A benchmark run must say whether it is `measured` or an `illustrative-template`.

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
