"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  Braces,
  Cpu,
  DatabaseZap,
  FlaskConical,
  Gauge,
  GitBranch,
  Layers3,
  Network,
  Sigma
} from "lucide-react";
import {
  abstractionTimeline,
  benchmarkRuns,
  dataEngines,
  dataFormats,
  languageRuntimes,
  runtimeBenchmarkTemplates,
  runtimeProfiles,
  runtimeSummary
} from "../../lib/data";
import type {
  DataEngine,
  DataFormat,
  InspectorRecord,
  LanguageRuntime,
  RuntimeBenchmarkTemplate,
  RuntimeProfile
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

function runtimeInspector(item: RuntimeProfile): InspectorRecord {
  return {
    eyebrow: "RUNTIME / EXECUTION MODEL",
    title: item.name,
    description: item.bestFor,
    stats: [
      { label: "Language", value: item.language },
      { label: "Node model", value: item.nodeModel },
      { label: "Startup", value: item.startup },
      { label: "Parallelism", value: item.parallelism },
      { label: "Optimizer", value: item.optimizer },
      { label: "Python boundary", value: item.pythonBoundary }
    ],
    tags: [item.language, item.nodeModel],
    source: item.source,
    note: item.watchFor
  };
}

function templateInspector(item: RuntimeBenchmarkTemplate): InspectorRecord {
  return {
    eyebrow: "REPRODUCIBLE BENCHMARK RECIPE",
    title: item.name,
    description: item.lesson,
    stats: [
      { label: "Dataset", value: item.dataset },
      { label: "Scale", value: item.size },
      { label: "Engines", value: item.engines.join(" · ") },
      { label: "Operations", value: item.operations.join(" · ") },
      { label: "Hardware rule", value: item.hardware }
    ],
    tags: ["benchmark recipe", item.size],
    note: "This is a benchmark design, not a measured result. Add timings only after the dataset, engine versions, hardware and cold/warm-cache policy are fixed."
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
  const runtimes = useMemo(
    () => runtimeProfiles.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const recipes = useMemo(
    () => runtimeBenchmarkTemplates.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );

  const activeCount =
    view === "Engines" ? engines.length :
    view === "Formats" ? formats.length :
    view === "Benchmarks" ? runs.length :
    view === "Runtime lab" ? runtimes.length + recipes.length :
    languages.length;

  return (
    <div className="dashboard-grid">
      {view === "Runtime lab" ? (
        <section className="metric-strip four">
          <MetricCard label="RUNTIME PROFILES" value={String(runtimeProfiles.length)} sub="pandas → Spark SQL" />
          <MetricCard label="BENCHMARK RECIPES" value={String(runtimeBenchmarkTemplates.length)} sub="1 GB local → 1 TB distributed" />
          <MetricCard label="SPARK APIS" value="3" sub="PySpark · Scala · SQL" />
          <MetricCard label="MEASURED RESULTS" value="0" sub="recipes first; no invented timings" />
        </section>
      ) : (
        <section className="metric-strip four">
          <MetricCard label="ENGINES" value={String(dataEngines.length)} sub="DataFrame + SQL + distributed" />
          <MetricCard label="TABLE / FILE LAYERS" value={String(dataFormats.length)} sub="Parquet through lakehouse formats" />
          <MetricCard label="BENCH RUNS" value={String(benchmarkRuns.length)} sub="measured + illustrative templates" />
          <MetricCard label="LANGUAGES" value={String(languageRuntimes.length)} sub="declarative to systems-level" />
        </section>
      )}

      <section className="panel span-12">
        <div className="split-header">
          <SectionHeader
            eyebrow={view === "Runtime lab" ? "PYTHON / SPARK PERFORMANCE LAB" : "MODERN DATA STACK"}
            title={view === "Runtime lab" ? "Compare execution models before comparing stopwatch numbers" : "Engine, storage and abstraction explorer"}
            meta={activeCount + " visible records"}
          />
          <ToggleGroup
            value={view}
            values={["Engines", "Formats", "Benchmarks", "Runtime lab", "Languages"]}
            onChange={setView}
            label="Data stack view"
          />
        </div>

        {activeCount === 0 ? <EmptyState query={query} /> : null}

        {view === "Engines" && engines.length ? (
          <div className="comparison-grid data-engine-grid">
            {engines.map((item) => (
              <button type="button" className="comparison-card" key={item.id} onClick={() => onInspect(engineInspector(item))}>
                <div className="card-title-row">
                  <DatabaseZap size={18} />
                  <div><span className="micro-label">{item.kind}</span><h3>{item.name}</h3></div>
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
                  <th>Layer</th><th>Type</th><th>Transactions</th><th>Time travel</th>
                  <th>Schema evolution</th><th>Partition evolution</th><th>Multi-engine</th>
                </tr>
              </thead>
              <tbody>
                {formats.map((item) => (
                  <tr key={item.id} onClick={() => onInspect(formatInspector(item))}>
                    <td><strong>{item.name}</strong></td><td>{item.kind}</td><td>{item.acid}</td>
                    <td>{item.timeTravel ? "✓" : "—"}</td><td>{item.schemaEvolution}</td>
                    <td>{item.partitionEvolution ? "✓" : "—"}</td><td>{item.multiEngine}</td>
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
                  <div className="benchmark-card-head"><span className="micro-label">{run.scenario}</span><strong>{run.seconds + "s"}</strong></div>
                  <h3>{run.engine}</h3>
                  <p>{run.operation + " · " + run.workers}</p>
                  <div className="horizontal-meter"><i style={{ width: relative + "%" }} /></div>
                  <small>{run.sourceType === "measured" ? "measured" : "illustrative — replace with your own run"}</small>
                </button>
              );
            })}
          </div>
        ) : null}

        {view === "Runtime lab" && (runtimes.length || recipes.length) ? (
          <div className="runtime-lab-stack">
            {runtimes.length ? (
              <div>
                <SectionHeader eyebrow="EXECUTION MODELS" title="pandas / Polars / DuckDB / PySpark / Scala Spark / Spark SQL" meta="click a row for the performance boundary" />
                <div className="data-table-wrap">
                  <table className="data-table runtime-table">
                    <thead>
                      <tr>
                        <th>Runtime</th><th>Execution</th><th>Node model</th><th>Startup</th>
                        <th>Parallelism</th><th>Optimizer</th><th>Python / JVM boundary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runtimes.map((item) => (
                        <tr key={item.id} onClick={() => onInspect(runtimeInspector(item))}>
                          <td><strong>{item.name}</strong><small className="table-sub">{item.language}</small></td>
                          <td>{item.execution}</td><td>{item.nodeModel}</td><td>{item.startup}</td>
                          <td>{item.parallelism}</td><td>{item.optimizer}</td><td>{item.pythonBoundary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {recipes.length ? (
              <div>
                <SectionHeader eyebrow="QUERY / DATASET RECIPES" title="Benchmarks worth measuring" meta="no fabricated timings" />
                <div className="recipe-grid">
                  {recipes.map((item) => (
                    <button type="button" className="recipe-card" key={item.id} onClick={() => onInspect(templateInspector(item))}>
                      <div className="recipe-card-head">
                        <FlaskConical size={18} />
                        <div><span className="micro-label">{item.size}</span><h3>{item.name}</h3></div>
                      </div>
                      <p>{item.lesson}</p>
                      <dl>
                        <div><dt>Dataset</dt><dd>{item.dataset}</dd></div>
                        <div><dt>Engines</dt><dd>{item.engines.join(" · ")}</dd></div>
                        <div><dt>Ops</dt><dd>{item.operations.join(" · ")}</dd></div>
                      </dl>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {view === "Languages" && languages.length ? (
          <div className="language-grid">
            {languages.map((item) => (
              <button className="language-card" type="button" key={item.id} onClick={() => onInspect(languageInspector(item))}>
                <div className="language-title">
                  <Braces size={19} />
                  <div><span className="micro-label">{item.paradigm}</span><h3>{item.name}</h3></div>
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

      {view === "Runtime lab" ? (
        <>
          <section className="panel span-8">
            <SectionHeader eyebrow="PERFORMANCE RULES" title="What usually matters more than Python vs Scala" />
            <div className="summary-bullets performance-bullets">
              {runtimeSummary.map((item, index) => (
                <span key={item}>
                  {index === 0 ? <Gauge size={16} /> : index === 1 ? <Cpu size={16} /> : index === 2 ? <Braces size={16} /> : index === 3 ? <Network size={16} /> : <GitBranch size={16} />}
                  <strong>{String(index + 1).padStart(2, "0")}</strong> {item}
                </span>
              ))}
            </div>
          </section>

          <aside className="panel span-4">
            <SectionHeader eyebrow="SPARK INTERVIEW LENS" title="The comparison that is actually useful" />
            <div className="knowledge-stack">
              <article><Sigma size={18} /><div><strong>Built-ins first</strong><p>PySpark DataFrame expressions and Spark SQL can stay inside Catalyst/Tungsten. A Python UDF can break that optimized path and add serialization overhead.</p></div></article>
              <article><Braces size={18} /><div><strong>Scala is not automatically faster</strong><p>If Python and Scala express the same built-in Spark plan, the physical work can be effectively the same. JVM-native custom code is where the boundary changes.</p></div></article>
              <article><Network size={18} /><div><strong>Shuffle beats syntax</strong><p>At distributed scale, join strategy, skew, partitions, file sizes, pruning and network shuffle usually dominate API-language differences.</p></div></article>
              <article><FlaskConical size={18} /><div><strong>Benchmark the crossover</strong><p>Use 1/10 GB locally, then 100 GB/1 TB distributed, with fixed data layout and hardware, to show when cluster overhead becomes justified.</p></div></article>
            </div>
          </aside>

          <section className="panel span-12">
            <SectionHeader eyebrow="MEASUREMENT SCHEMA" title="Fields every future timing should store" />
            <div className="architecture-flow runtime-measurement-flow">
              <div className="arch-node"><strong>Dataset</strong><small>generator · rows · bytes · skew</small></div><span>→</span>
              <div className="arch-node"><strong>Layout</strong><small>Parquet · partitions · compression</small></div><span>→</span>
              <div className="arch-node"><strong>Runtime</strong><small>version · config · API</small></div><span>→</span>
              <div className="arch-node"><strong>Compute</strong><small>CPU · RAM · executors · disk</small></div><span>→</span>
              <div className="arch-node"><strong>Result</strong><small>cold/warm · seconds · scan · shuffle</small></div>
            </div>
          </section>
        </>
      ) : (
        <>
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
                  <span>{item.year}</span><i /><strong>{item.label}</strong><small>{item.detail}</small>
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
        </>
      )}
    </div>
  );
}
