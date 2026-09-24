"use client";

import { useMemo, useState } from "react";
import { BatteryCharging, Cpu, Gauge, MemoryStick, Smartphone } from "lucide-react";
import { hardwareItems, mobileSocs } from "../../lib/data";
import type { HardwareItem, InspectorRecord, MobileSoc } from "../../lib/types";
import { EmptyState, MetricCard, SectionHeader, ToggleGroup } from "../ui";

function hardwareInspector(item: HardwareItem): InspectorRecord {
  return {
    eyebrow: item.vendor.toUpperCase() + " / " + item.kind.toUpperCase(),
    title: item.name,
    description: item.bestFor,
    stats: [
      { label: "Year", value: String(item.year) },
      { label: "Cores", value: item.cores },
      { label: "Memory", value: item.memory },
      { label: "Perf index", value: item.perfIndex + "/100" },
      { label: "Perf / watt", value: item.perfPerWatt + "/100" },
      { label: "Power", value: item.powerW === null ? "platform-dependent" : item.powerW + " W" }
    ],
    tags: [item.process, item.kind],
    source: item.source,
    note: "Performance indices are dashboard normalization fields, not vendor benchmark claims. Replace with a reproducible benchmark series when you add measured data."
  };
}

function mobileInspector(item: MobileSoc): InspectorRecord {
  return {
    eyebrow: item.vendor.toUpperCase() + " / MOBILE SOC",
    title: item.name,
    description: item.note,
    stats: [
      { label: "Year", value: String(item.year) },
      { label: "CPU", value: item.cpu },
      { label: "GPU", value: item.gpu },
      { label: "AI", value: item.ai },
      { label: "Process", value: item.process }
    ],
    tags: [item.class],
    source: item.source
  };
}

export function HardwareDashboard({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const [view, setView] = useState("Compute");
  const q = query.trim().toLowerCase();
  const items = useMemo(
    () => hardwareItems.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const mobile = useMemo(
    () => mobileSocs.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );

  const activeCount = view === "Compute" ? items.length : mobile.length;

  return (
    <div className="dashboard-grid">
      <section className="metric-strip four">
        <MetricCard label="COMPUTE ITEMS" value={String(hardwareItems.length)} sub="laptop, server CPU and GPU" />
        <MetricCard label="MOBILE FAMILIES" value={String(mobileSocs.length)} sub="phone / tablet SoC lens" />
        <MetricCard label="EFFICIENCY LENS" value="Perf/W" sub="normalized dashboard index" />
        <MetricCard label="PRICE FIELD" value="SKU-aware" sub="keep device/cloud pricing separate" />
      </section>

      <section className="panel span-12">
        <div className="split-header">
          <SectionHeader eyebrow="COMPUTE HARDWARE" title="Performance is only useful with power, memory and form factor" meta={activeCount + " visible records"} />
          <ToggleGroup value={view} values={["Compute", "Mobile SoCs"]} onChange={setView} label="Hardware view" />
        </div>

        {activeCount === 0 ? <EmptyState query={query} /> : null}

        {view === "Compute" && items.length ? (
          <div className="hardware-grid">
            {items
              .toSorted((a, b) => b.year - a.year)
              .map((item) => (
                <button type="button" className="hardware-card" key={item.id} onClick={() => onInspect(hardwareInspector(item))}>
                  <div className="hardware-card-head">
                    <div>
                      <span className="micro-label">{item.vendor + " · " + item.year}</span>
                      <h3>{item.name}</h3>
                    </div>
                    <span className="hardware-kind">{item.kind}</span>
                  </div>
                  <p>{item.bestFor}</p>
                  <div className="dual-score">
                    <label>
                      <span>Performance</span>
                      <i><b style={{ width: item.perfIndex + "%" }} /></i>
                      <strong>{item.perfIndex}</strong>
                    </label>
                    <label>
                      <span>Perf / watt</span>
                      <i><b style={{ width: item.perfPerWatt + "%" }} /></i>
                      <strong>{item.perfPerWatt}</strong>
                    </label>
                  </div>
                  <div className="hardware-specs">
                    <span><Cpu size={14} /> {item.cores}</span>
                    <span><MemoryStick size={14} /> {item.memory}</span>
                    <span><BatteryCharging size={14} /> {item.powerW === null ? "platform TDP" : item.powerW + " W"}</span>
                  </div>
                </button>
              ))}
          </div>
        ) : null}

        {view === "Mobile SoCs" && mobile.length ? (
          <div className="mobile-grid">
            {mobile.map((item) => (
              <button type="button" className="mobile-card" key={item.id} onClick={() => onInspect(mobileInspector(item))}>
                <Smartphone size={20} />
                <div>
                  <span className="micro-label">{item.vendor + " · " + item.year}</span>
                  <h3>{item.name}</h3>
                </div>
                <dl>
                  <div><dt>CPU</dt><dd>{item.cpu}</dd></div>
                  <div><dt>GPU</dt><dd>{item.gpu}</dd></div>
                  <div><dt>NPU / AI</dt><dd>{item.ai}</dd></div>
                  <div><dt>Process</dt><dd>{item.process}</dd></div>
                </dl>
                <p>{item.note}</p>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel span-7">
        <SectionHeader eyebrow="PERFORMANCE / EFFICIENCY" title="Normalized quadrant" />
        <div className="hardware-quadrant">
          <div className="quadrant-axis y">PERF / WATT</div>
          <div className="quadrant-axis x">PERFORMANCE</div>
          <div className="quadrant-grid" />
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className="quadrant-point"
              style={{ left: item.perfIndex + "%", bottom: item.perfPerWatt + "%" }}
              onClick={() => onInspect(hardwareInspector(item))}
              title={item.name}
            >
              <i />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <aside className="panel span-5">
        <SectionHeader eyebrow="HARDWARE LENS" title="What usually gets missed" />
        <div className="knowledge-stack">
          <article><Gauge size={18} /><div><strong>Benchmark ≠ workload</strong><p>CPU score, GPU FLOPS and AI tokens/s represent different bottlenecks. Pin the workload before choosing the metric.</p></div></article>
          <article><MemoryStick size={18} /><div><strong>Memory is architecture</strong><p>Capacity, bandwidth, unified memory and HBM can matter more than raw compute for large data and model workloads.</p></div></article>
          <article><BatteryCharging size={18} /><div><strong>Power becomes cost</strong><p>Datacenter TDP affects rack density and cooling; laptop/mobile efficiency affects sustained performance and battery life.</p></div></article>
          <article><Smartphone size={18} /><div><strong>CPU + GPU + NPU converge</strong><p>Mobile comparison should include local AI blocks, media engines and memory architecture instead of CPU alone.</p></div></article>
        </div>
      </aside>
    </div>
  );
}
