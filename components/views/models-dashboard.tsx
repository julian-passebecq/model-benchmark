"use client";

import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  Clock3,
  Gauge,
  GitBranch,
  ListFilter,
  ScatterChart,
  Timer,
  Waypoints
} from "lucide-react";
import {
  codingAgentFrontier,
  codingAgentFrontierMeta,
  modelBenchmarks,
  terminalBenchEffort,
  terminalBenchMeta
} from "../../lib/data";
import type {
  CodingAgentFrontierPoint,
  InspectorRecord,
  ModelBenchmark,
  TerminalBenchEffortPoint
} from "../../lib/types";
import { EmptyState, MetricCard, SectionHeader, ToggleGroup } from "../ui";

const providerClass: Record<string, string> = {
  OpenAI: "provider-openai",
  Anthropic: "provider-anthropic",
  DeepSeek: "provider-deepseek",
  Zhipu: "provider-zhipu",
  xAI: "provider-xai",
  Alibaba: "provider-alibaba"
};

const effortSeriesColors: Record<string, string> = {
  "Opus 5.5": "#f26a35",
  "Opus 5": "#f0a202",
  "Fable 5.1": "#2fbd8a",
  "GPT-6 Astra": "#8d8b85",
  "GPT-5.6 Sol": "#d1d0c9"
};

const agentColors: Record<string, string> = {
  OpenAI: "#7aa2f7",
  Anthropic: "#f7a76c",
  DeepSeek: "#e88bc5",
  Zhipu: "#6dd6e8",
  xAI: "#b7bbc4",
  Alibaba: "#e2cf72"
};


const benchmarkChoices = [
  {
    id: "Browser Use v2",
    eyebrow: "GENERAL AGENT",
    title: "Browser / tool-use efficiency",
    summary: "Compare benchmark quality against recorded task cost across providers and reasoning efforts.",
    metric: "score ↔ $/task"
  },
  {
    id: "Terminal-Bench 4.0",
    eyebrow: "CODING",
    title: "Reasoning effort curve",
    summary: "See how low, medium, high and max effort change coding quality and cost per attempt.",
    metric: "effort ↔ quality"
  },
  {
    id: "Coding Agent Index",
    eyebrow: "CODING AGENTS",
    title: "Agent cost-quality frontier",
    summary: "Compare Codex, Claude Code and other agent harnesses using cost, wall time, tokens and quality.",
    metric: "index ↔ $/task"
  },
  {
    id: "API pricing",
    eyebrow: "ECONOMICS",
    title: "Token list-price calculator",
    summary: "Estimate token-only API cost separately from the end-to-end benchmark cost of an agent task.",
    metric: "$/1M tokens"
  }
] as const;

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

function inspectTerminalPoint(point: TerminalBenchEffortPoint): InspectorRecord {
  return {
    eyebrow: "TERMINAL-BENCH 4.0",
    title: point.series + " · " + point.effort,
    description: "Agentic terminal coding by effort level",
    stats: [
      { label: "Score", value: point.score.toFixed(1) + "%" },
      { label: "Cost / attempt", value: "$" + point.cost.toFixed(point.cost < 2 ? 2 : 1) },
      { label: "Effort", value: point.effort },
      { label: "Value type", value: point.exact ? "published headline score" : "chart transcription" }
    ],
    tags: [point.provider, point.series, point.exact ? "headline score" : "approximate cost/point"],
    source: {
      label: terminalBenchMeta.sourceLabel,
      url: terminalBenchMeta.sourceUrl,
      asOf: terminalBenchMeta.asOf
    },
    note: terminalBenchMeta.note
  };
}

function inspectAgentPoint(point: CodingAgentFrontierPoint): InspectorRecord {
  return {
    eyebrow: "CODING AGENT INDEX",
    title: point.agent + " · " + point.model,
    description: codingAgentFrontierMeta.benchmark,
    stats: [
      { label: "Index", value: String(point.score) },
      { label: "Cost / task", value: "$" + point.cost.toFixed(2) },
      { label: "Time / task", value: point.timeMinutes.toFixed(1) + " min" },
      { label: "Tokens / task", value: point.tokensMillions.toFixed(1) + "M" }
    ],
    tags: [point.provider, point.agent, point.frontier ? "cost-quality frontier" : "comparison"],
    source: {
      label: codingAgentFrontierMeta.sourceLabel,
      url: codingAgentFrontierMeta.sourceUrl,
      asOf: codingAgentFrontierMeta.asOf
    },
    note: codingAgentFrontierMeta.note
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
  const width = 1080;
  const height = 500;
  const pad = { left: 72, right: 34, top: 38, bottom: 62 };

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

function TerminalBenchChart({
  points,
  onInspect
}: {
  points: TerminalBenchEffortPoint[];
  onInspect: (record: InspectorRecord) => void;
}) {
  const width = 980;
  const height = 440;
  const pad = { left: 66, right: 24, top: 35, bottom: 58 };
  const minCost = 1;
  const maxCost = 22;
  const xTicks = [1, 2, 5, 10, 20];
  const yTicks = [0, 10, 20, 30, 40, 50, 60, 70];

  const x = (cost: number) => {
    const lo = Math.log10(minCost);
    const hi = Math.log10(maxCost);
    return pad.left + ((Math.log10(cost) - lo) / (hi - lo)) * (width - pad.left - pad.right);
  };
  const y = (score: number) =>
    pad.top + ((70 - score) / 70) * (height - pad.top - pad.bottom);

  const series = Array.from(new Set(points.map((item) => item.series)));

  return (
    <div className="chart-shell terminal-bench-shell">
      <div className="chart-legend">
        {series.map((name) => (
          <span key={name}>
            <i style={{ background: effortSeriesColors[name] ?? "#9aa4b1" }} />
            {name}
          </span>
        ))}
      </div>
      <svg className="scatter-svg terminal-bench-svg" viewBox={"0 0 " + width + " " + height} role="img" aria-label="Terminal-Bench 4.0 score by cost and effort level">
        <rect x="0" y="0" width={width} height={height} rx="12" className="chart-bg" />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="grid-line" />
            <text x={pad.left - 11} y={y(tick) + 4} textAnchor="end" className="axis-text">{tick}</text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={pad.top} y2={height - pad.bottom} className="grid-line vertical" />
            <text x={x(tick)} y={height - pad.bottom + 24} textAnchor="middle" className="axis-text">{tick}</text>
          </g>
        ))}

        {series.map((name) => {
          const rows = points.filter((item) => item.series === name).toSorted((a, b) => a.cost - b.cost);
          const coords = rows.map((item) => x(item.cost) + "," + y(item.score)).join(" ");
          return (
            <g key={name}>
              <polyline points={coords} fill="none" stroke={effortSeriesColors[name] ?? "#9aa4b1"} strokeWidth="1.8" />
              {rows.map((item) => (
                <g
                  key={item.id}
                  className="benchmark-curve-point"
                  role="button"
                  tabIndex={0}
                  onClick={() => onInspect(inspectTerminalPoint(item))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onInspect(inspectTerminalPoint(item));
                  }}
                >
                  <circle
                    cx={x(item.cost)}
                    cy={y(item.score)}
                    r={item.exact ? 6.7 : 5.5}
                    fill={effortSeriesColors[name] ?? "#9aa4b1"}
                    stroke="#0b0e12"
                    strokeWidth="1.5"
                  />
                  {name === "Opus 5.5" ? (
                    <text x={x(item.cost)} y={y(item.score) - 11} textAnchor="middle" className="curve-effort-label">{item.effort === "medium" ? "med" : item.effort}</text>
                  ) : null}
                </g>
              ))}
            </g>
          );
        })}

        <text x={18} y={height / 2} transform={"rotate(-90 18 " + height / 2 + ")"} className="axis-title">
          TERMINAL-BENCH SCORE (%)
        </text>
        <text x={width / 2} y={height - 10} textAnchor="middle" className="axis-title">
          COST PER ATTEMPT (USD, LOG SCALE)
        </text>
      </svg>
    </div>
  );
}

function CodingAgentFrontierChart({
  points,
  onInspect
}: {
  points: CodingAgentFrontierPoint[];
  onInspect: (record: InspectorRecord) => void;
}) {
  const width = 980;
  const height = 440;
  const pad = { left: 66, right: 26, top: 30, bottom: 56 };
  const xMax = 14;
  const yMin = 35;
  const yMax = 66;
  const xTicks = [0, 2, 4, 6, 8, 10, 12, 14];
  const yTicks = [35, 40, 45, 50, 55, 60, 65];

  const x = (cost: number) => pad.left + (cost / xMax) * (width - pad.left - pad.right);
  const y = (score: number) => pad.top + ((yMax - score) / (yMax - yMin)) * (height - pad.top - pad.bottom);

  const frontier = points.filter((item) => item.frontier).toSorted((a, b) => a.cost - b.cost);
  const frontierCoords = frontier.map((item) => x(item.cost) + "," + y(item.score)).join(" ");

  return (
    <div className="chart-shell">
      <svg className="scatter-svg coding-frontier-svg" viewBox={"0 0 " + width + " " + height} role="img" aria-label="Coding Agent Index versus average API cost per task">
        <rect x="0" y="0" width={width} height={height} rx="12" className="chart-bg" />
        <rect
          x={x(0)}
          y={y(65)}
          width={x(7.6) - x(0)}
          height={y(50) - y(65)}
          className="frontier-zone"
          rx="8"
        />
        <text x={x(0.45)} y={y(63.8)} className="frontier-zone-label">HIGH QUALITY / LOWER COST ZONE</text>

        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="grid-line" />
            <text x={pad.left - 11} y={y(tick) + 4} textAnchor="end" className="axis-text">{tick}</text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={pad.top} y2={height - pad.bottom} className="grid-line vertical" />
            <text x={x(tick)} y={height - pad.bottom + 24} textAnchor="middle" className="axis-text">{"$" + tick}</text>
          </g>
        ))}

        <polyline points={frontierCoords} fill="none" className="pareto-line" />

        {points.map((item) => {
          const color = agentColors[item.provider] ?? "#9aa4b1";
          const labelRight = item.cost < 10;
          return (
            <g
              key={item.id}
              className="agent-frontier-point"
              role="button"
              tabIndex={0}
              onClick={() => onInspect(inspectAgentPoint(item))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onInspect(inspectAgentPoint(item));
              }}
            >
              <circle cx={x(item.cost)} cy={y(item.score)} r={item.frontier ? 6.5 : 5.2} fill={color} stroke="#0b0e12" strokeWidth="1.5" />
              {item.frontier ? <circle cx={x(item.cost)} cy={y(item.score)} r="10" fill="none" stroke={color} strokeOpacity="0.35" /> : null}
              <text
                x={labelRight ? x(item.cost) + 9 : x(item.cost) - 9}
                y={y(item.score) - 8}
                textAnchor={labelRight ? "start" : "end"}
                className="agent-point-label"
              >
                {item.agent + " · " + item.model}
              </text>
            </g>
          );
        })}

        <text x={18} y={height / 2} transform={"rotate(-90 18 " + height / 2 + ")"} className="axis-title">
          ARTIFICIAL ANALYSIS CODING AGENT INDEX
        </text>
        <text x={width / 2} y={height - 10} textAnchor="middle" className="axis-title">
          AVERAGE API COST PER TASK (USD)
        </text>
      </svg>
    </div>
  );
}

function BrowserUseView({
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
    <>
      <section className="metric-strip four">
        <MetricCard label="VISIBLE MODELS" value={String(filtered.length)} sub={String(currentModels.length) + " marked current"} />
        <MetricCard label="TOP SCORE" value={bestScore ? bestScore.score.toFixed(1) : "—"} sub={bestScore?.label ?? "No match"} />
        <MetricCard label="LOWEST COST" value={cheapest ? "$" + cheapest.costPerTask.toFixed(3) : "—"} sub={cheapest?.label ?? "No match"} />
        <MetricCard label="SCORE / $" value={bestEfficiency ? (bestEfficiency.score / bestEfficiency.costPerTask).toFixed(0) : "—"} sub={bestEfficiency?.label ?? "No match"} />
      </section>

      <section className="panel span-12 model-primary-chart">
        <SectionHeader eyebrow="BROWSER USE BENCHMARK V2" title="Quality vs recorded task cost" meta="upper-left = cheaper · upper-right = higher cost" />
        <div className="toolbar-row model-toolbar">
          <ToggleGroup value={view} values={["Scatter", "Table", "Efficiency"]} onChange={setView} label="Model view" />
          <div className="model-toolbar-right">
            <div className="provider-legend" aria-label="Provider legend">
              {providers.filter((item) => item !== "All").map((item) => (
                <span key={item} className={providerClass[item] ?? "provider-default"}><i />{item}</span>
              ))}
            </div>
            <select className="compact-select" value={provider} onChange={(event) => setProvider(event.target.value)} aria-label="Filter by provider">
              {providers.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <div className="chart-reading-hint">
          <strong>How to read it:</strong> higher = better benchmark score. Left = lower recorded task cost. Rings mark current-generation configurations. Click any point for source and caveats.
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

      <aside className="panel span-12 model-reading-guide">
        <SectionHeader eyebrow="READ THIS FIRST" title="Four rules for reading model benchmarks" />
        <div className="knowledge-stack">
          <article><ScatterChart size={18} /><div><strong>Same benchmark first</strong><p>Agent cost and score are only directly comparable when harness, task set and run policy are aligned.</p></div></article>
          <article><CircleDollarSign size={18} /><div><strong>Cost is workload-shaped</strong><p>Token prices alone do not predict agent cost. Reasoning effort, tool calls, retries and latency change total task spend.</p></div></article>
          <article><Gauge size={18} /><div><strong>Frontier ≠ always efficient</strong><p>The dashboard keeps score, absolute spend and score-per-dollar separate so you can choose for the job instead of chasing one ranking.</p></div></article>
          <article><ListFilter size={18} /><div><strong>JSON provenance</strong><p>Each point records source, date and data-quality type. Token-pricing data can be added without replacing benchmark evidence.</p></div></article>
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
    </>
  );
}

function TerminalBenchView({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const q = query.trim().toLowerCase();
  const points = terminalBenchEffort.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q));
  const exactScores = points.filter((item) => item.exact);
  const best = exactScores.toSorted((a, b) => b.score - a.score)[0];
  const cheapest = points.toSorted((a, b) => a.cost - b.cost)[0];
  const mediumOpus = points.find((item) => item.series === "Opus 5.5" && item.effort === "medium");

  return (
    <>
      <section className="metric-strip four">
        <MetricCard label="EFFORT POINTS" value={String(points.length)} sub="low → max across five model families" />
        <MetricCard label="PUBLISHED TOP" value={best ? best.score.toFixed(1) + "%" : "—"} sub={best ? best.series + " · " + best.effort : "No match"} />
        <MetricCard label="LOWEST ATTEMPT COST" value={cheapest ? "$" + cheapest.cost.toFixed(2) : "—"} sub={cheapest ? cheapest.series + " · " + cheapest.effort : "No match"} />
        <MetricCard label="OPUS 5.5 MEDIUM" value={mediumOpus ? mediumOpus.score.toFixed(1) + "%" : "—"} sub={mediumOpus ? "≈ $" + mediumOpus.cost.toFixed(2) + " / attempt" : "Filtered out"} />
      </section>

      <section className="panel span-9">
        <SectionHeader eyebrow="TERMINAL-BENCH 4.0" title="Agentic terminal coding by effort level" meta="intermediate chart points are approximate transcriptions" />
        {points.length ? <TerminalBenchChart points={points} onInspect={onInspect} /> : <EmptyState query={query} />}
      </section>

      <aside className="panel span-3">
        <SectionHeader eyebrow="WHY THIS VIEW MATTERS" title="Reasoning effort has a price curve" />
        <div className="knowledge-stack">
          <article><Gauge size={18} /><div><strong>Effort is not linear</strong><p>Moving from low to medium can buy a large quality jump, while xhigh to max can flatten or even regress.</p></div></article>
          <article><CircleDollarSign size={18} /><div><strong>Default can be efficient</strong><p>Anthropic reports Opus 5.5 medium near 58% at roughly $3/attempt, close to Astra’s best band at substantially lower cost.</p></div></article>
          <article><GitBranch size={18} /><div><strong>Keep the whole curve</strong><p>One max-effort leaderboard point hides the practical budget/performance tradeoff developers actually choose.</p></div></article>
          <article><ListFilter size={18} /><div><strong>Evidence is marked</strong><p>Headline scores use published figures. Intermediate point coordinates are stored as chart-reading estimates.</p></div></article>
        </div>
      </aside>

      <section className="panel span-12">
        <SectionHeader eyebrow="EFFORT MATRIX" title="Compare every effort level without reading the plot" />
        <div className="data-table-wrap">
          <table className="data-table feature-table">
            <thead>
              <tr><th>Model</th><th>Effort</th><th>Cost/attempt</th><th>Score</th><th>Evidence</th></tr>
            </thead>
            <tbody>
              {points.toSorted((a, b) => a.series.localeCompare(b.series) || a.cost - b.cost).map((item) => (
                <tr key={item.id} onClick={() => onInspect(inspectTerminalPoint(item))}>
                  <td><strong>{item.series}</strong></td>
                  <td>{item.effort}</td>
                  <td>{"$" + item.cost.toFixed(item.cost < 2 ? 2 : 1)}</td>
                  <td>{item.score.toFixed(1) + "%"}</td>
                  <td>{item.exact ? "published headline score" : "chart transcription"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function CodingFrontierView({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const q = query.trim().toLowerCase();
  const points = codingAgentFrontier.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q));
  const best = points.toSorted((a, b) => b.score - a.score)[0];
  const cheapest = points.toSorted((a, b) => a.cost - b.cost)[0];
  const fastest = points.toSorted((a, b) => a.timeMinutes - b.timeMinutes)[0];
  const frontierCount = points.filter((item) => item.frontier).length;

  return (
    <>
      <section className="metric-strip four">
        <MetricCard label="AGENT CONFIGS" value={String(points.length)} sub="harness + model combinations" />
        <MetricCard label="TOP INDEX" value={best ? String(best.score) : "—"} sub={best ? best.agent + " · " + best.model : "No match"} />
        <MetricCard label="LOWEST COST" value={cheapest ? "$" + cheapest.cost.toFixed(2) : "—"} sub={cheapest ? cheapest.agent + " · " + cheapest.model : "No match"} />
        <MetricCard label="PARETO POINTS" value={String(frontierCount)} sub={fastest ? "fastest visible: " + fastest.timeMinutes.toFixed(1) + " min" : "No match"} />
      </section>

      <section className="panel span-9">
        <SectionHeader eyebrow="ARTIFICIAL ANALYSIS · V1.5" title="Coding agent quality / cost frontier" meta="current source-backed data" />
        {points.length ? <CodingAgentFrontierChart points={points} onInspect={onInspect} /> : <EmptyState query={query} />}
      </section>

      <aside className="panel span-3">
        <SectionHeader eyebrow="AGENT ECONOMICS" title="Model alone is not the product" />
        <div className="knowledge-stack">
          <article><Waypoints size={18} /><div><strong>Harness matters</strong><p>Codex, Claude Code, OpenCode and Grok Build can produce different cost, token and quality outcomes with different models.</p></div></article>
          <article><Timer size={18} /><div><strong>Time is another axis</strong><p>A cheaper agent can still be expensive in human workflow terms if tasks run much longer or need more intervention.</p></div></article>
          <article><Clock3 size={18} /><div><strong>Tokens are not cost</strong><p>Cache pricing and provider rates mean two agents using similar token counts can have materially different task cost.</p></div></article>
          <article><ScatterChart size={18} /><div><strong>Frontier moves</strong><p>The dashed line is a snapshot, not a permanent winner. Store each dated refresh instead of overwriting history later.</p></div></article>
        </div>
      </aside>

      <section className="panel span-12">
        <SectionHeader eyebrow="AGENT TABLE" title="Index, cost, wall time and token usage" />
        <div className="data-table-wrap">
          <table className="data-table feature-table">
            <thead>
              <tr><th>Agent</th><th>Model</th><th>Index</th><th>Cost/task</th><th>Time/task</th><th>Tokens/task</th><th>Frontier</th></tr>
            </thead>
            <tbody>
              {points.toSorted((a, b) => b.score - a.score || a.cost - b.cost).map((item) => (
                <tr key={item.id} onClick={() => onInspect(inspectAgentPoint(item))}>
                  <td><strong>{item.agent}</strong></td>
                  <td>{item.model}</td>
                  <td>{item.score}</td>
                  <td>{"$" + item.cost.toFixed(2)}</td>
                  <td>{item.timeMinutes.toFixed(1) + "m"}</td>
                  <td>{item.tokensMillions.toFixed(1) + "M"}</td>
                  <td>{item.frontier ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ApiPricingView({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const [inputTokens, setInputTokens] = useState(100000);
  const [outputTokens, setOutputTokens] = useState(20000);
  const [cachedPercent, setCachedPercent] = useState(50);

  const pricedModels = useMemo(() => {
    const families = new Map<string, ModelBenchmark>();
    for (const item of modelBenchmarks) {
      if (item.inputUsdPer1M === null || item.outputUsdPer1M === null) continue;
      const key = item.provider + "::" + item.family;
      if (!families.has(key) || (item.current && !families.get(key)?.current)) families.set(key, item);
    }
    const q = query.trim().toLowerCase();
    return Array.from(families.values()).filter((item) =>
      !q || [item.provider, item.family, item.label].join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  const scenarioCost = (item: ModelBenchmark) => {
    if (item.inputUsdPer1M === null || item.outputUsdPer1M === null) return null;
    const cachedTokens = inputTokens * Math.min(100, Math.max(0, cachedPercent)) / 100;
    const uncachedTokens = inputTokens - cachedTokens;
    const cachedRate = item.cachedInputUsdPer1M ?? item.inputUsdPer1M;
    return (
      uncachedTokens / 1_000_000 * item.inputUsdPer1M +
      cachedTokens / 1_000_000 * cachedRate +
      outputTokens / 1_000_000 * item.outputUsdPer1M
    );
  };

  const inspectPricing = (item: ModelBenchmark): InspectorRecord => {
    const cost = scenarioCost(item);
    return {
      eyebrow: item.provider.toUpperCase() + " / API PRICING",
      title: item.family,
      description: "List-price token economics for a configurable request shape.",
      stats: [
        { label: "Input / 1M", value: "$" + Number(item.inputUsdPer1M).toFixed(2) },
        { label: "Cached input / 1M", value: item.cachedInputUsdPer1M == null ? "same / not tracked" : "$" + item.cachedInputUsdPer1M.toFixed(3) },
        { label: "Output / 1M", value: "$" + Number(item.outputUsdPer1M).toFixed(2) },
        { label: "Scenario", value: inputTokens.toLocaleString() + " in · " + outputTokens.toLocaleString() + " out · " + cachedPercent + "% cached" },
        { label: "Scenario cost", value: cost === null ? "—" : "$" + cost.toFixed(4) },
        { label: "Pricing context", value: item.pricingContext ?? "List-price snapshot" }
      ],
      tags: [item.provider, item.family, "token pricing"],
      source: item.pricingSourceUrl
        ? { label: item.pricingSourceLabel ?? "API pricing", url: item.pricingSourceUrl, asOf: item.pricingAsOf }
        : undefined,
      note: "Token list prices are not the same as recorded agent cost per task. Tool calls, reasoning tokens, long-context multipliers, cache writes, retries, fast/batch tiers and harness behavior can change the final bill."
    };
  };

  const rows = pricedModels
    .map((item) => ({ item, cost: scenarioCost(item) ?? Number.POSITIVE_INFINITY }))
    .toSorted((a, b) => a.cost - b.cost);
  const cheapest = rows[0];
  const maxOutput = pricedModels.toSorted((a, b) => Number(b.outputUsdPer1M) - Number(a.outputUsdPer1M))[0];

  return (
    <>
      <section className="metric-strip four">
        <MetricCard label="PRICED MODEL FAMILIES" value={String(pricedModels.length)} sub="unique provider/model price records" />
        <MetricCard label="REQUEST SHAPE" value={(inputTokens / 1000).toFixed(0) + "K / " + (outputTokens / 1000).toFixed(0) + "K"} sub="input / output tokens" />
        <MetricCard label="LOWEST SCENARIO COST" value={cheapest ? "$" + cheapest.cost.toFixed(4) : "—"} sub={cheapest?.item.family ?? "No priced match"} />
        <MetricCard label="HIGHEST OUTPUT RATE" value={maxOutput?.outputUsdPer1M == null ? "—" : "$" + maxOutput.outputUsdPer1M.toFixed(2) + "/M"} sub={maxOutput?.family ?? "No priced match"} />
      </section>

      <section className="panel span-12">
        <SectionHeader eyebrow="API TOKEN ECONOMICS" title="Estimate token-only cost without confusing it with agent cost" meta="official list-price snapshots" />
        <div className="token-cost-controls">
          <label>
            Input tokens
            <input type="number" min="0" step="1000" value={inputTokens} onChange={(event) => setInputTokens(Math.max(0, Number(event.target.value) || 0))} />
          </label>
          <label>
            Output tokens
            <input type="number" min="0" step="1000" value={outputTokens} onChange={(event) => setOutputTokens(Math.max(0, Number(event.target.value) || 0))} />
          </label>
          <label>
            Cached input
            <span><input type="number" min="0" max="100" step="5" value={cachedPercent} onChange={(event) => setCachedPercent(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} />%</span>
          </label>
          <div>
            <span className="micro-label">IMPORTANT</span>
            <p>Pure token estimate only. Compare it beside benchmark task cost, not as a substitute for it.</p>
          </div>
        </div>

        {rows.length ? (
          <div className="data-table-wrap">
            <table className="data-table feature-table token-pricing-table">
              <thead>
                <tr>
                  <th>Model family</th>
                  <th>Provider</th>
                  <th>Input / 1M</th>
                  <th>Cached input / 1M</th>
                  <th>Output / 1M</th>
                  <th>Scenario token cost</th>
                  <th>Recorded benchmark task</th>
                  <th>Pricing verified</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, cost }) => (
                  <tr key={item.provider + item.family} onClick={() => onInspect(inspectPricing(item))}>
                    <td><strong>{item.family}</strong></td>
                    <td>{item.provider}</td>
                    <td>{"$" + Number(item.inputUsdPer1M).toFixed(2)}</td>
                    <td>{item.cachedInputUsdPer1M == null ? "—" : "$" + item.cachedInputUsdPer1M.toFixed(3)}</td>
                    <td>{"$" + Number(item.outputUsdPer1M).toFixed(2)}</td>
                    <td><strong>{"$" + cost.toFixed(4)}</strong></td>
                    <td>{"$" + item.costPerTask.toFixed(item.costPerTask < 1 ? 3 : 2)}<small className="table-sub">{item.benchmark + " · " + item.effort}</small></td>
                    <td>{item.pricingAsOf ?? "source linked"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState query={query} />}

        <div className="query-price-note">
          The benchmark-task column is a recorded agent run and can include much more than the request shape above. The calculator is useful for understanding list-price sensitivity to input/output mix and caching, not for reconstructing benchmark invoices.
        </div>
      </section>

      <section className="panel span-8">
        <SectionHeader eyebrow="COST DECOMPOSITION" title="Why $/M tokens and $/agent task diverge" />
        <div className="summary-bullets">
          <span><CircleDollarSign size={16} /><strong>Output is expensive</strong> Long reasoning/coding responses can dominate a request even when input is cheap.</span>
          <span><Clock3 size={16} /><strong>Reasoning changes volume</strong> Higher effort may consume more internal/output tokens and more tool iterations.</span>
          <span><ListFilter size={16} /><strong>Caching matters</strong> Reused prompts can materially lower recurring input cost where the provider exposes cache pricing.</span>
          <span><Waypoints size={16} /><strong>Agent harness matters</strong> Search, computer use, retries, sub-agents and tool calls can move total cost far beyond text-token arithmetic.</span>
        </div>
      </section>

      <aside className="panel span-4">
        <SectionHeader eyebrow="PRICE PROVENANCE" title="Keep benchmark and price evidence separate" />
        <div className="knowledge-stack">
          <article><CircleDollarSign size={18} /><div><strong>Official price source</strong><p>Token rates carry their own provider source and verification date instead of inheriting the benchmark source.</p></div></article>
          <article><ScatterChart size={18} /><div><strong>Benchmark source</strong><p>Score and recorded task cost remain tied to the benchmark/harness that produced them.</p></div></article>
          <article><Gauge size={18} /><div><strong>Processing tier</strong><p>Standard, batch/flex, fast, regional and long-context pricing can differ. The stored rate must say which list-price snapshot it represents.</p></div></article>
        </div>
      </aside>
    </>
  );
}

export function ModelsDashboard({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const [benchmarkView, setBenchmarkView] = useState("Browser Use v2");
  const activeChoice = benchmarkChoices.find((item) => item.id === benchmarkView) ?? benchmarkChoices[0];

  return (
    <div className="dashboard-grid">
      <section className="panel span-12 benchmark-overview">
        <div className="benchmark-overview-head">
          <div>
            <span className="micro-label">MODEL / AGENT OBSERVATORY</span>
            <h2>Choose the question first</h2>
            <p>These datasets measure different things. Pick the view that matches the decision you are making instead of mixing scores from incompatible benchmarks.</p>
          </div>
          <div className="benchmark-active-summary">
            <span className="micro-label">ACTIVE VIEW</span>
            <strong>{activeChoice.title}</strong>
            <small>{activeChoice.metric}</small>
          </div>
        </div>

        <div className="benchmark-choice-grid" aria-label="Model benchmark views">
          {benchmarkChoices.map((item) => (
            <button
              type="button"
              aria-pressed={benchmarkView === item.id}
              key={item.id}
              className={benchmarkView === item.id ? "benchmark-choice active" : "benchmark-choice"}
              onClick={() => setBenchmarkView(item.id)}
            >
              <span className="micro-label">{item.eyebrow}</span>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
              <small>{item.metric}</small>
            </button>
          ))}
        </div>
      </section>

      {benchmarkView === "Browser Use v2" ? <BrowserUseView query={query} onInspect={onInspect} /> : null}
      {benchmarkView === "Terminal-Bench 4.0" ? <TerminalBenchView query={query} onInspect={onInspect} /> : null}
      {benchmarkView === "Coding Agent Index" ? <CodingFrontierView query={query} onInspect={onInspect} /> : null}
      {benchmarkView === "API pricing" ? <ApiPricingView query={query} onInspect={onInspect} /> : null}
    </div>
  );
}
