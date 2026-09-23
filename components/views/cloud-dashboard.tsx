"use client";

import { useMemo, useState } from "react";
import { Boxes, CloudCog, Coins, Container, Network, Workflow } from "lucide-react";
import { cloudPlatforms, orchestrationPatterns, queryPrices, vmShapes } from "../../lib/data";
import type { CloudPlatform, InspectorRecord, QueryPrice, VmShape } from "../../lib/types";
import { EmptyState, MetricCard, SectionHeader, ToggleGroup } from "../ui";

function platformInspector(item: CloudPlatform): InspectorRecord {
  return {
    eyebrow: item.vendor.toUpperCase(),
    title: item.name,
    description: item.bestFor,
    stats: [
      { label: "Compute", value: item.computeModel },
      { label: "Pricing model", value: item.pricingModel },
      { label: "Warehouse", value: item.warehouse },
      { label: "Lakehouse", value: item.lakehouse }
    ],
    tags: [item.serverless, item.openFormats, item.governance],
    source: item.source,
    note: item.tradeoff
  };
}

function priceInspector(item: QueryPrice): InspectorRecord {
  return {
    eyebrow: item.platform.toUpperCase() + " / PRICING",
    title: item.service,
    description: item.unit,
    stats: [
      { label: "Seed price", value: item.usd === null ? "refresh from source" : "$" + item.usd },
      { label: "Region", value: item.region },
      { label: "Free tier", value: item.freeTier }
    ],
    source: item.source,
    note: item.note,
    tags: ["refreshable", "pricing"]
  };
}

function vmInspector(item: VmShape): InspectorRecord {
  return {
    eyebrow: item.cloud.toUpperCase() + " / VM",
    title: item.family,
    description: item.workload,
    stats: [
      { label: "vCPU", value: String(item.vcpu) },
      { label: "RAM", value: item.ramGb + " GB" },
      { label: "Accelerator", value: item.accelerator },
      { label: "Price", value: item.usdHour === null ? "bind exact SKU" : "$" + item.usdHour + "/h" }
    ],
    source: item.source,
    note: item.note,
    tags: [item.region, item.workload]
  };
}

export function CloudDashboard({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const [view, setView] = useState("Platforms");
  const q = query.trim().toLowerCase();

  const platforms = useMemo(
    () => cloudPlatforms.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const prices = useMemo(
    () => queryPrices.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const vms = useMemo(
    () => vmShapes.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );

  const activeCount = view === "Platforms" ? platforms.length : view === "Query pricing" ? prices.length : vms.length;

  return (
    <div className="dashboard-grid">
      <section className="metric-strip four">
        <MetricCard label="PLATFORMS" value={String(cloudPlatforms.length)} sub="lakehouse + warehouse + cloud stacks" />
        <MetricCard label="PRICING MODELS" value="5+" sub="capacity, credits, bytes, DBUs, instances" />
        <MetricCard label="ORCHESTRATION LAYERS" value={String(orchestrationPatterns.length)} sub="container → declarative pipeline" />
        <MetricCard label="VM TEMPLATES" value={String(vmShapes.length)} sub="bind exact region/SKU in JSON" />
      </section>

      <section className="panel span-12">
        <div className="split-header">
          <SectionHeader eyebrow="CLOUD DATA PLATFORMS" title="Compare architecture before comparing brand names" meta={activeCount + " visible records"} />
          <ToggleGroup value={view} values={["Platforms", "Query pricing", "VM shapes"]} onChange={setView} label="Cloud view" />
        </div>

        {activeCount === 0 ? <EmptyState query={query} /> : null}

        {view === "Platforms" && platforms.length ? (
          <div className="cloud-columns">
            {platforms.map((item) => (
              <button type="button" key={item.id} className="cloud-column" onClick={() => onInspect(platformInspector(item))}>
                <div className="cloud-column-head">
                  <span className="micro-label">{item.vendor}</span>
                  <h3>{item.name}</h3>
                  <p>{item.bestFor}</p>
                </div>
                <dl className="cloud-dl">
                  <div><dt>Compute</dt><dd>{item.computeModel}</dd></div>
                  <div><dt>Pricing</dt><dd>{item.pricingModel}</dd></div>
                  <div><dt>Lake / table</dt><dd>{item.lakehouse}</dd></div>
                  <div><dt>Warehouse</dt><dd>{item.warehouse}</dd></div>
                  <div><dt>Streaming</dt><dd>{item.streaming}</dd></div>
                  <div><dt>Orchestration</dt><dd>{item.orchestration}</dd></div>
                  <div><dt>Governance</dt><dd>{item.governance}</dd></div>
                  <div><dt>AI / ML</dt><dd>{item.aiMl}</dd></div>
                  <div><dt>BI</dt><dd>{item.bi}</dd></div>
                </dl>
              </button>
            ))}
          </div>
        ) : null}

        {view === "Query pricing" && prices.length ? (
          <div className="pricing-grid">
            {prices.map((item) => (
              <button type="button" className="pricing-card" key={item.id} onClick={() => onInspect(priceInspector(item))}>
                <div>
                  <span className="micro-label">{item.platform}</span>
                  <h3>{item.service}</h3>
                </div>
                <strong>{item.usd === null ? "VARIABLE" : "$" + item.usd}</strong>
                <span>{item.unit}</span>
                <p>{item.note}</p>
                <small>{item.region}</small>
              </button>
            ))}
          </div>
        ) : null}

        {view === "VM shapes" && vms.length ? (
          <div className="vm-grid">
            {vms.map((item) => (
              <button className="vm-card" type="button" key={item.id} onClick={() => onInspect(vmInspector(item))}>
                <div className="vm-card-title">
                  <CloudCog size={18} />
                  <div>
                    <span className="micro-label">{item.cloud}</span>
                    <h3>{item.family}</h3>
                  </div>
                </div>
                <div className="vm-specs">
                  <span><strong>{item.vcpu}</strong> vCPU</span>
                  <span><strong>{item.ramGb}</strong> GB RAM</span>
                  <span><strong>{item.accelerator}</strong> accelerator</span>
                </div>
                <p>{item.workload}</p>
                <small>{item.usdHour === null ? "Price intentionally unbound until exact SKU + region are selected." : "$" + item.usdHour + "/h"}</small>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel span-8">
        <SectionHeader eyebrow="ABSTRACTION STACK" title="Docker, Kubernetes, workflow DAGs and managed pipelines solve different problems" />
        <div className="orchestration-ladder">
          {orchestrationPatterns.map((item, index) => (
            <button
              type="button"
              className="ladder-row"
              key={item.name}
              onClick={() => onInspect({
                eyebrow: "ORCHESTRATION LAYER",
                title: item.name,
                description: item.when,
                stats: [
                  { label: "Tools", value: item.tools },
                  { label: "Abstraction", value: item.abstraction },
                  { label: "Layer", value: "0" + (index + 1) }
                ],
                tags: ["architecture", "orchestration"]
              })}
            >
              <span className="ladder-index">0{index + 1}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.tools}</small>
              </div>
              <p>{item.abstraction}</p>
              <span>{item.when}</span>
            </button>
          ))}
        </div>
      </section>

      <aside className="panel span-4">
        <SectionHeader eyebrow="COST MODEL" title="Normalize before comparing" />
        <div className="knowledge-stack">
          <article><Coins size={18} /><div><strong>Same unit first</strong><p>Convert credits, DBUs, capacity units and per-byte scans into a workload-level cost before making a price comparison.</p></div></article>
          <article><Network size={18} /><div><strong>Egress can dominate</strong><p>Cross-region and cross-cloud movement changes the economics of otherwise cheap compute.</p></div></article>
          <article><Container size={18} /><div><strong>VM ≠ managed service</strong><p>An hourly VM rate excludes orchestration, autoscaling, patching, storage, network and engineer time.</p></div></article>
          <article><Workflow size={18} /><div><strong>Measure end-to-end</strong><p>Useful benchmarks include queue time, cold start, scan bytes, retries, warehouse suspension and concurrency.</p></div></article>
        </div>
      </aside>

      <section className="panel span-12">
        <SectionHeader eyebrow="REFERENCE ARCHITECTURE" title="One problem, five implementation styles" />
        <div className="architecture-flow">
          <div className="arch-node source"><Boxes size={18} /><strong>Object / source data</strong><small>files · CDC · APIs</small></div>
          <span>→</span>
          <div className="arch-node"><strong>Ingest</strong><small>managed pipeline / streaming</small></div>
          <span>→</span>
          <div className="arch-node"><strong>Open table layer</strong><small>Delta · Iceberg · Parquet</small></div>
          <span>→</span>
          <div className="arch-node"><strong>Compute</strong><small>SQL · Spark · serverless</small></div>
          <span>→</span>
          <div className="arch-node"><strong>Serve</strong><small>BI · APIs · ML</small></div>
        </div>
      </section>
    </div>
  );
}
