"use client";

import { useMemo, useState } from "react";
import { Cable, Cpu, Monitor, RadioTower, Waves, Zap } from "lucide-react";
import { evolutionItems } from "../../lib/data";
import type { EvolutionItem, InspectorRecord } from "../../lib/types";
import { EmptyState, MetricCard, SectionHeader, ToggleGroup } from "../ui";

const categoryIcon = {
  accelerator: Cpu,
  network: Cable,
  display: Monitor,
  energy: Zap
};

function evolutionInspector(item: EvolutionItem): InspectorRecord {
  return {
    eyebrow: item.category.toUpperCase(),
    title: item.year + " · " + item.name,
    description: item.description,
    stats: [
      { label: "Metric", value: item.metric },
      { label: "Value", value: item.value + " " + item.unit },
      { label: "Status", value: item.status }
    ],
    tags: [item.category, item.status],
    source: item.source
  };
}

export function EvolutionDashboard({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const [category, setCategory] = useState("All");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return evolutionItems.filter((item) => {
      const categoryMatch = category === "All" || item.category === category.toLowerCase();
      const queryMatch = !q || JSON.stringify(item).toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [category, q]);

  const categoryCounts = evolutionItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="dashboard-grid">
      <section className="metric-strip four">
        <MetricCard label="ACCELERATOR ERAS" value={String(categoryCounts.accelerator ?? 0)} sub="GPU / AI compute" />
        <MetricCard label="NETWORK MILESTONES" value={String(categoryCounts.network ?? 0)} sub="Ethernet + mobile generations" />
        <MetricCard label="DISPLAY MILESTONES" value={String(categoryCounts.display ?? 0)} sub="LCD → OLED / Mini-LED" />
        <MetricCard label="ENERGY MILESTONES" value={String(categoryCounts.energy ?? 0)} sub="grid + datacenter constraint" />
      </section>

      <section className="panel span-12">
        <div className="split-header">
          <SectionHeader eyebrow="INFRASTRUCTURE EVOLUTION" title="The stack around compute changes as quickly as compute itself" meta={filtered.length + " visible records"} />
          <ToggleGroup value={category} values={["All", "Accelerator", "Network", "Display", "Energy"]} onChange={setCategory} label="Evolution category" />
        </div>

        {filtered.length === 0 ? <EmptyState query={query} /> : null}

        {filtered.length ? (
          <div className="evolution-timeline">
            {filtered.toSorted((a, b) => a.year - b.year).map((item) => {
              const Icon = categoryIcon[item.category];
              return (
                <button type="button" className={"evolution-node " + item.category} key={item.id} onClick={() => onInspect(evolutionInspector(item))}>
                  <div className="evolution-year">{item.year}</div>
                  <div className="evolution-track-dot"><Icon size={15} /></div>
                  <div className="evolution-content">
                    <span className="micro-label">{item.category + " · " + item.status}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="evolution-value">
                      <strong>{item.value}</strong>
                      <span>{item.unit}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="panel span-7">
        <SectionHeader eyebrow="SYSTEM VIEW" title="Why these categories belong together" />
        <div className="system-map">
          <div className="system-node"><Cpu size={20} /><strong>Compute</strong><small>CPU · GPU · accelerator</small></div>
          <span>↔</span>
          <div className="system-node"><Waves size={20} /><strong>Memory / I/O</strong><small>HBM · PCIe · fabric</small></div>
          <span>↔</span>
          <div className="system-node"><Cable size={20} /><strong>Network</strong><small>Ethernet · optics</small></div>
          <span>↔</span>
          <div className="system-node"><Zap size={20} /><strong>Power</strong><small>grid · cooling · rack density</small></div>
        </div>
        <div className="system-note">
          A faster accelerator can move the bottleneck into memory bandwidth, network fabric, optical links, cooling or power delivery. Tracking only chips hides the system constraint.
        </div>
      </section>

      <aside className="panel span-5">
        <SectionHeader eyebrow="WHAT ELSE TO TRACK" title="Next useful datasets" />
        <div className="knowledge-stack">
          <article><Cable size={18} /><div><strong>Optical interconnect</strong><p>Track 400G/800G/1.6T Ethernet, InfiniBand and co-packaged optics because AI clusters are increasingly network-bound.</p></div></article>
          <article><RadioTower size={18} /><div><strong>4G / 5G / 6G</strong><p>Separate peak radio rates from real-world median throughput, latency and coverage. Keep mobile network evolution as a subpage.</p></div></article>
          <article><Monitor size={18} /><div><strong>Display efficiency</strong><p>Track brightness, refresh, pixel density, OLED lifetime and energy rather than “LCD vs OLED” as a single winner.</p></div></article>
          <article><Zap size={18} /><div><strong>Electricity + carbon</strong><p>Add grid carbon intensity, datacenter PUE, water usage and firm-power availability so AI infrastructure has a physical-resource view.</p></div></article>
        </div>
      </aside>
    </div>
  );
}
