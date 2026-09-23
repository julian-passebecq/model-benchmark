"use client";

import { useMemo, useState } from "react";
import { CircleDollarSign, Gauge, ListFilter, ScatterChart } from "lucide-react";
import { modelBenchmarks } from "../../lib/data";
import type { InspectorRecord, ModelBenchmark } from "../../lib/types";
import { EmptyState, MetricCard, SectionHeader, ToggleGroup } from "../ui";

const providerClass: Record<string, string> = {
  OpenAI: "provider-openai",
  Anthropic: "provider-anthropic",
  DeepSeek: "provider-deepseek",
  Zhipu: "provider-zhipu",
  xAI: "provider-xai"
};

function inspectModel(model: ModelBenchmark): InspectorRecord {
  return {
    eyebrow: model.provider.toUpperCase(),
    title: model.label,
    description: model.benchmark + " · " + model.surface,
    stats: [
      { label: "Score", value: model.score.toFixed(1) + " / 100" },
      { label: "Cost / task", value: "$" + model.costPerTask.toFixed(model.costPerTask < 1 ? 3 : 2) },
      { label: "Score / $", value: (model.score / model.costPerTask).toFixed(1) },
      { label: "Effort", value: model.effort }
    ],
    tags: [model.family, model.current ? "current" : "historical", model.dataQuality],
    source: { label: model.sourceLabel, url: model.sourceUrl, asOf: model.asOf },
    note: model.note ?? "Benchmark results are workload-specific. Compare models on the same harness and task set before drawing conclusions."
  };
}

function ModelScatter({
  models,
  onInspect,
  selectedId
}: {
  models: ModelBenchmark[];
  onInspect: (record: InspectorRecord) => void;
  selectedId: string | null;
}) {
  const minCost = 0.01;
  const maxCost = 12;
  const width = 900;
  const height = 430;
  const pad = { left: 65, right: 30, top: 30, bottom: 56 };

  const x = (cost: number) => {
    const lo = Math.log10(minCost);
    const hi = Math.log10(maxCost);
    return pad.left + ((Math.log10(Math.max(minCost, cost)) - lo) / (hi - lo)) * (width - pad.left - pad.right);
  };
  const y = (score: number) =>
    pad.top + ((90 - score) / 90) * (height - pad.top - pad.bottom);

  const xTicks = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
  const yTicks = [0, 20, 40, 60, 80];

  return (
    <div className="chart-shell">
      <svg className="scatter-svg" viewBox={"0 0 " + width + " " + height} role="img" aria-label="Model benchmark score versus cost per task">
        <rect x="0" y="0" width={width} height={height} rx="12" className="chart-bg" />

        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="grid-line" />
            <text x={pad.left - 12} y={y(tick) + 4} textAnchor="end" className="axis-text">{tick}</text>
          </g>
        ))}

        {xTicks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={pad.top} y2={height - pad.bottom} className="grid-line vertical" />
            <text x={x(tick)} y={height - pad.bottom + 24} textAnchor="middle" className="axis-text">
              {tick < 1 ? "$" + tick : "$" + tick.toFixed(0)}
            </text>
          </g>
        ))}

        <text x={18} y={height / 2} transform={"rotate(-90 18 " + height / 2 + ")"} className="axis-title">
          SCORE / 100
        </text>
        <text x={width / 2} y={height - 10} textAnchor="middle" className="axis-title">
          RECORDED COST / TASK · LOG SCALE
        </text>

        {models.map((model) => {
          const px = x(model.costPerTask);
          const py = y(model.score);
          const selected = selectedId === model.id;
          const cls = providerClass[model.provider] ?? "provider-default";
          const labelRight = px < width * 0.72;
          return (
            <g
              key={model.id}
              className={"scatter-point " + cls + (selected ? " selected" : "")}
              role="button"
              tabIndex={0}
              onClick={() => onInspect(inspectModel(model))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onInspect(inspectModel(model));
              }}
            >
              <circle cx={px} cy={py} r={model.current ? 7 : 5} />
              {model.current ? <circle cx={px} cy={py} r={11} className="point-ring" /> : null}
              <text
                x={labelRight ? px + 11 : px - 11}
                y={py - 8}
                textAnchor={labelRight ? "start" : "end"}
                className="point-label"
              >
                {model.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ModelsDashboard({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const [view, setView] = useState("Scatter");
  const [provider, setProvider] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const providers = useMemo(
    () => ["All", ...Array.from(new Set(modelBenchmarks.map((item) => item.provider)))],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modelBenchmarks.filter((item) => {
      const providerMatch = provider === "All" || item.provider === provider;
      const queryMatch = !q || [
        item.label,
        item.provider,
        item.family,
        item.surface,
        item.effort,
        item.benchmark
      ].join(" ").toLowerCase().includes(q);
      return providerMatch && queryMatch;
    });
  }, [provider, query]);

  const currentModels = filtered.filter((item) => item.current);
  const bestScore = filtered.reduce<ModelBenchmark | null>(
    (best, item) => (!best || item.score > best.score ? item : best),
    null
  );
  const cheapest = filtered.reduce<ModelBenchmark | null>(
    (best, item) => (!best || item.costPerTask < best.costPerTask ? item : best),
    null
  );
  const bestEfficiency = filtered.reduce<ModelBenchmark | null>(
    (best, item) => (!best || item.score / item.costPerTask > best.score / best.costPerTask ? item : best),
    null
  );

  const inspect = (record: InspectorRecord, id?: string) => {
    if (id) setSelectedId(id);
    onInspect(record);
  };

  return (
    <div className="dashboard-grid">
      <section className="metric-strip four">
        <MetricCard label="VISIBLE MODELS" value={String(filtered.length)} sub={String(currentModels.length) + " marked current"} />
        <MetricCard label="TOP SCORE" value={bestScore ? bestScore.score.toFixed(1) : "—"} sub={bestScore?.label ?? "No match"} />
        <MetricCard label="LOWEST COST" value={cheapest ? "$" + cheapest.costPerTask.toFixed(3) : "—"} sub={cheapest?.label ?? "No match"} />
        <MetricCard label="SCORE / $" value={bestEfficiency ? (bestEfficiency.score / bestEfficiency.costPerTask).toFixed(0) : "—"} sub={bestEfficiency?.label ?? "No match"} />
      </section>

      <section className="panel span-8">
        <SectionHeader eyebrow="BENCHMARK MAP" title="Quality vs recorded task cost" meta="ring = current generation" />
        <div className="toolbar-row">
          <ToggleGroup value={view} values={["Scatter", "Table", "Efficiency"]} onChange={setView} label="Model view" />
          <select className="compact-select" value={provider} onChange={(event) => setProvider(event.target.value)} aria-label="Filter by provider">
            {providers.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? <EmptyState query={query} /> : null}

        {filtered.length > 0 && view === "Scatter" ? (
          <ModelScatter
            models={filtered}
            selectedId={selectedId}
            onInspect={(record) => {
              const model = filtered.find((item) => item.label === record.title);
              inspect(record, model?.id);
            }}
          />
        ) : null}

        {filtered.length > 0 && view === "Table" ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Provider</th>
                  <th>Effort</th>
                  <th>Score</th>
                  <th>Cost/task</th>
                  <th>Score/$</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .toSorted((a, b) => b.score - a.score)
                  .map((model) => (
                    <tr key={model.id} onClick={() => inspect(inspectModel(model), model.id)}>
                      <td><span className={model.current ? "status-dot current" : "status-dot"} />{model.label}</td>
                      <td>{model.provider}</td>
                      <td>{model.effort}</td>
                      <td>{model.score.toFixed(1)}</td>
                      <td>{"$" + model.costPerTask.toFixed(model.costPerTask < 1 ? 3 : 2)}</td>
                      <td>{(model.score / model.costPerTask).toFixed(1)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {filtered.length > 0 && view === "Efficiency" ? (
          <div className="rank-list">
            {filtered
              .map((model) => ({ model, efficiency: model.score / model.costPerTask }))
              .toSorted((a, b) => b.efficiency - a.efficiency)
              .map(({ model, efficiency }, index) => (
                <button key={model.id} className="rank-row" type="button" onClick={() => inspect(inspectModel(model), model.id)}>
                  <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="rank-name">
                    <strong>{model.label}</strong>
                    <small>{model.provider + " · " + model.effort}</small>
                  </span>
                  <span className="rank-bar">
                    <i style={{ width: Math.min(100, efficiency / 25) + "%" }} />
                  </span>
                  <strong>{efficiency.toFixed(0) + " score/$"}</strong>
                </button>
              ))}
          </div>
        ) : null}
      </section>

      <aside className="panel span-4">
        <SectionHeader eyebrow="READ THIS FIRST" title="What the chart can and cannot tell you" />
        <div className="knowledge-stack">
          <article>
            <ScatterChart size={18} />
            <div>
              <strong>Same benchmark first</strong>
              <p>Agent cost and score are only directly comparable when harness, task set and run policy are aligned.</p>
            </div>
          </article>
          <article>
            <CircleDollarSign size={18} />
            <div>
              <strong>Cost is workload-shaped</strong>
              <p>Token prices alone do not predict agent cost. Reasoning effort, tool calls, retries and latency change total task spend.</p>
            </div>
          </article>
          <article>
            <Gauge size={18} />
            <div>
              <strong>Frontier ≠ always efficient</strong>
              <p>The dashboard keeps score, absolute spend and score-per-dollar separate so you can choose for the job instead of chasing one ranking.</p>
            </div>
          </article>
          <article>
            <ListFilter size={18} />
            <div>
              <strong>JSON provenance</strong>
              <p>Each point records source, date and data-quality type. Future token-pricing data can be added without replacing benchmark evidence.</p>
            </div>
          </article>
        </div>
      </aside>

      <section className="panel span-12">
        <SectionHeader eyebrow="PROVIDER LENS" title="Score, cost and effort distribution" meta="click a card to inspect" />
        <div className="provider-grid">
          {providers.filter((item) => item !== "All").map((name) => {
            const rows = filtered.filter((item) => item.provider === name);
            if (!rows.length) return null;
            const avgScore = rows.reduce((sum, item) => sum + item.score, 0) / rows.length;
            const avgCost = rows.reduce((sum, item) => sum + item.costPerTask, 0) / rows.length;
            return (
              <button
                type="button"
                className="provider-card"
                key={name}
                onClick={() => {
                  const row = rows.toSorted((a, b) => b.score - a.score)[0];
                  inspect(inspectModel(row), row.id);
                }}
              >
                <span className="micro-label">{name}</span>
                <strong>{avgScore.toFixed(1) + " avg score"}</strong>
                <small>{"$" + avgCost.toFixed(avgCost < 1 ? 3 : 2) + " avg task cost · " + rows.length + " configs"}</small>
                <div className="mini-bars">
                  {rows.toSorted((a, b) => a.costPerTask - b.costPerTask).map((row) => (
                    <i key={row.id} style={{ height: Math.max(8, row.score) + "%" }} title={row.label + ": " + row.score} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
