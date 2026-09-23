"use client";

import { useMemo, useState } from "react";
import { Boxes, Braces, DatabaseZap, GitBranch, Layers3, Sigma } from "lucide-react";
import {
  abstractionTimeline,
  benchmarkRuns,
  dataEngines,
  dataFormats,
  languageRuntimes
} from "../../lib/data";
import type {
  DataEngine,
  DataFormat,
  InspectorRecord,
  LanguageRuntime
} from "../../lib/types";
import { EmptyState, MetricCard, SectionHeader, ToggleGroup } from "../ui";

function engineInspector(item: DataEngine): InspectorRecord {
  return {
    eyebrow: item.kind.toUpperCase(),
    title: item.name,
    description: item.bestFor,
    stats: [
      { label: "Execution", value: item.execution },
      { label: "Scale", value: item.scale },
      { label: "Distributed", value: item.distributed ? "Yes" : "No" },
      { label: "Lazy", value: item.lazy ? "Yes" : "No" }
    ],
    tags: [...item.languages, item.sql ? "SQL" : "API"],
    source: item.source,
    note: item.tradeoff
  };
}

function formatInspector(item: DataFormat): InspectorRecord {
  return {
    eyebrow: item.kind.toUpperCase(),
    title: item.name,
    description: item.bestFor,
    stats: [
      { label: "ACID", value: item.acid },
      { label: "Time travel", value: item.timeTravel ? "Yes" : "No" },
      { label: "Schema evolution", value: item.schemaEvolution },
      { label: "Multi-engine", value: item.multiEngine }
    ],
    tags: [item.partitionEvolution ? "partition evolution" : "static partition model", item.storageLayer],
    source: item.source,
    note: item.tradeoff
  };
}

function languageInspector(item: LanguageRuntime): InspectorRecord {
  return {
    eyebrow: "PROGRAMMING MODEL",
    title: item.name,
    description: item.dataRole,
    stats: [
      { label: "Performance", value: item.performance + "/100" },
      { label: "Ergonomics", value: item.ergonomics + "/100" },
      { label: "Ecosystem", value: item.ecosystem + "/100" },
      { label: "Paradigm", value: item.paradigm }
    ],
    tags: [item.version, item.strength],
    source: item.source
  };
}

export function DataDashboard({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const [view, setView] = useState("Engines");

  const q = query.trim().toLowerCase();
  const engines = useMemo(
    () => dataEngines.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const formats = useMemo(
    () => dataFormats.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const runs = useMemo(
    () => benchmarkRuns.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const languages = useMemo(
    () => languageRuntimes.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );

  const activeCount =
    view === "Engines" ? engines.length :
    view === "Formats" ? formats.length :
    view === "Benchmarks" ? runs.length :
    languages.length;

  return (
    <div className="dashboard-grid">
      <section className="metric-strip four">
        <MetricCard label="ENGINES" value={String(dataEngines.length)} sub="DataFrame + SQL + distributed" />
        <MetricCard label="TABLE / FILE LAYERS" value={String(dataFormats.length)} sub="Parquet through lakehouse formats" />
        <MetricCard label="BENCH RUNS" value={String(benchmarkRuns.length)} sub="measured + illustrative templates" />
        <MetricCard label="LANGUAGES" value={String(languageRuntimes.length)} sub="declarative to systems-level" />
      </section>

      <section className="panel span-12">
        <div className="split-header">
          <SectionHeader eyebrow="MODERN DATA STACK" title="Engine, storage and abstraction explorer" meta={activeCount + " visible records"} />
          <ToggleGroup value={view} values={["Engines", "Formats", "Benchmarks", "Languages"]} onChange={setView} label="Data stack view" />
        </div>

        {activeCount === 0 ? <EmptyState query={query} /> : null}

        {view === "Engines" && engines.length ? (
          <div className="comparison-grid data-engine-grid">
            {engines.map((item) => (
              <button type="button" className="comparison-card" key={item.id} onClick={() => onInspect(engineInspector(item))}>
                <div className="card-title-row">
                  <DatabaseZap size={18} />
                  <div>
                    <span className="micro-label">{item.kind}</span>
                    <h3>{item.name}</h3>
                  </div>
                </div>
                <p>{item.bestFor}</p>
                <div className="feature-matrix compact">
                  <span>Distributed<strong>{item.distributed ? "YES" : "NO"}</strong></span>
                  <span>Lazy plan<strong>{item.lazy ? "YES" : "NO"}</strong></span>
                  <span>SQL<strong>{item.sql ? "YES" : "NO"}</strong></span>
                  <span>Vectorized<strong>{item.vectorized ? "YES" : "NO"}</strong></span>
                </div>
                <div className="tag-row">
                  {item.languages.slice(0, 4).map((lang) => <span className="tag" key={lang}>{lang}</span>)}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {view === "Formats" && formats.length ? (
          <div className="data-table-wrap">
            <table className="data-table feature-table">
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>Type</th>
                  <th>Transactions</th>
                  <th>Time travel</th>
                  <th>Schema evolution</th>
                  <th>Partition evolution</th>
                  <th>Multi-engine</th>
                </tr>
              </thead>
              <tbody>
                {formats.map((item) => (
                  <tr key={item.id} onClick={() => onInspect(formatInspector(item))}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.kind}</td>
                    <td>{item.acid}</td>
                    <td>{item.timeTravel ? "✓" : "—"}</td>
                    <td>{item.schemaEvolution}</td>
                    <td>{item.partitionEvolution ? "✓" : "—"}</td>
                    <td>{item.multiEngine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {view === "Benchmarks" && runs.length ? (
          <div className="benchmark-grid">
            {runs.map((run) => {
              const relative = Math.max(10, 100 - run.seconds / 2.5);
              return (
                <button
                  type="button"
                  className="benchmark-card"
                  key={run.id}
                  onClick={() => onInspect({
                    eyebrow: run.sourceType.toUpperCase(),
                    title: run.engine + " · " + run.scenario,
                    description: run.operation + " · " + run.workers,
                    stats: [
                      { label: "Dataset", value: run.datasetTb + " TB" },
                      { label: "Runtime", value: run.seconds + "s" },
                      { label: "Workers", value: run.workers },
                      { label: "Evidence", value: run.sourceType }
                    ],
                    source: { label: run.sourceLabel, url: run.sourceUrl },
                    note: run.note,
                    tags: [run.engine, run.operation]
                  })}
                >
                  <div className="benchmark-card-head">
                    <span className="micro-label">{run.scenario}</span>
                    <strong>{run.seconds + "s"}</strong>
                  </div>
                  <h3>{run.engine}</h3>
                  <p>{run.operation + " · " + run.workers}</p>
                  <div className="horizontal-meter"><i style={{ width: relative + "%" }} /></div>
                  <small>{run.sourceType === "measured" ? "measured" : "illustrative — replace with your own run"}</small>
                </button>
              );
            })}
          </div>
        ) : null}

        {view === "Languages" && languages.length ? (
          <div className="language-grid">
            {languages.map((item) => (
              <button className="language-card" type="button" key={item.id} onClick={() => onInspect(languageInspector(item))}>
                <div className="language-title">
                  <Braces size={19} />
                  <div>
                    <span className="micro-label">{item.paradigm}</span>
                    <h3>{item.name}</h3>
                  </div>
                </div>
                <p>{item.dataRole}</p>
                <div className="score-bars">
                  <label>Performance <i><b style={{ width: item.performance + "%" }} /></i><span>{item.performance}</span></label>
                  <label>Ergonomics <i><b style={{ width: item.ergonomics + "%" }} /></i><span>{item.ergonomics}</span></label>
                  <label>Ecosystem <i><b style={{ width: item.ecosystem + "%" }} /></i><span>{item.ecosystem}</span></label>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel span-8">
        <SectionHeader eyebrow="ABSTRACTION CURVE" title="Programming is moving upward: describe intent, optimize underneath" />
        <div className="timeline horizontal">
          {abstractionTimeline.map((item) => (
            <button
              type="button"
              key={item.year}
              className="timeline-node"
              onClick={() => onInspect({
                eyebrow: "ABSTRACTION TIMELINE",
                title: item.label,
                description: item.detail,
                stats: [{ label: "Era", value: String(item.year) }],
                tags: ["declarative systems", "optimization"]
              })}
            >
              <span>{item.year}</span>
              <i />
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </button>
          ))}
        </div>
      </section>

      <aside className="panel span-4">
        <SectionHeader eyebrow="MENTAL MODEL" title="Do not compare unlike layers" />
        <div className="knowledge-stack">
          <article><Layers3 size={18} /><div><strong>Parquet is not Iceberg</strong><p>Parquet is a columnar file format. Iceberg, Delta and Hudi add table metadata, transactions and snapshots around files.</p></div></article>
          <article><Boxes size={18} /><div><strong>DuckDB is not Spark</strong><p>DuckDB optimizes single-node embedded analytics. Spark optimizes distributed execution and a broad cluster ecosystem.</p></div></article>
          <article><Sigma size={18} /><div><strong>SQL survives by abstraction</strong><p>Declarative SQL lets engines change execution strategies while the query continues to express intent.</p></div></article>
          <article><GitBranch size={18} /><div><strong>Benchmarks need fixtures</strong><p>Data size, file layout, compression, skew, warm cache and hardware must be versioned with every run.</p></div></article>
        </div>
      </aside>
    </div>
  );
}
