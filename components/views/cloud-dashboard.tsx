"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  CloudCog,
  Coins,
  Container,
  Database,
  Gift,
  Laptop,
  Network,
  Server,
  Workflow
} from "lucide-react";
import {
  cloudPlatforms,
  freeLabServices,
  freeTierUseCaseGuides,
  orchestrationPatterns,
  queryPrices,
  selfHostScenarios,
  serverlessServices,
  vmShapes
} from "../../lib/data";
import type {
  CloudPlatform,
  FreeLabService,
  FreeTierUseCaseGuide,
  InspectorRecord,
  QueryPrice,
  ServerlessService,
  VmShape
} from "../../lib/types";
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

function serverlessInspector(item: ServerlessService): InspectorRecord {
  return {
    eyebrow: item.provider.toUpperCase() + " / SERVERLESS",
    title: item.name,
    description: item.goodFor,
    stats: [
      { label: "Billing unit", value: item.unit },
      { label: "Free quota", value: item.freeQuota },
      { label: "Packaging", value: item.packaging },
      { label: "Runtimes", value: item.runtimes },
      { label: "Scale to zero", value: item.scaleToZero ? "Yes" : "No" }
    ],
    tags: [item.container ? "container-capable" : "function/edge runtime", item.scaleToZero ? "scale-to-zero" : "provisioned"],
    source: item.source,
    note: item.watchFor
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

function freeLabInspector(item: FreeLabService): InspectorRecord {
  return {
    eyebrow: item.provider.toUpperCase() + " / FREE LAB",
    title: item.name,
    description: item.goodFor,
    stats: [
      { label: "Tier", value: item.tierType },
      { label: "Duration", value: item.duration },
      { label: "Quota", value: item.quota },
      { label: "Account / card", value: item.cardRequired },
      { label: "Commercial", value: item.commercialUse },
      { label: "Access / OS", value: item.platforms ?? "Hosted / cross-platform" }
    ],
    source: item.source,
    note: item.limits,
    tags: [item.category, item.tierType]
  };
}

function useCaseInspector(guide: FreeTierUseCaseGuide, services: FreeLabService[]): InspectorRecord {
  const trueFree = services.filter((item) => item.tierType === "true-free").length;
  return {
    eyebrow: "USE-CASE GUIDE / " + guide.category.toUpperCase(),
    title: guide.title,
    description: guide.goal,
    stats: [
      { label: "Services", value: String(services.length) },
      { label: "True free", value: String(trueFree) },
      { label: "Pattern", value: guide.recommendedPattern },
      { label: "Next step", value: guide.nextStep }
    ],
    tags: [guide.category, "data-driven recipe"],
    note: guide.watchFor
  };
}

function freeGroup(category: string) {
  const value = category.toLowerCase();
  if (
    value.includes("vm") ||
    value.includes("function") ||
    value.includes("container") ||
    value.includes("web") ||
    value.includes("python") ||
    value.includes("notebook") ||
    value.includes("hosted app") ||
    value.includes("kubernetes")
  ) return "Compute & web";
  if (
    value.includes("database") ||
    value.includes("postgres") ||
    value.includes("nosql") ||
    value.includes("cache") ||
    value.includes("key-value")
  ) return "Databases";
  if (
    value.includes("warehouse") ||
    value.includes("lakehouse") ||
    value.includes("data transformation") ||
    value.includes("managed data") ||
    value.includes("object storage") ||
    value.includes("streaming") ||
    value.includes("bi /")
  ) return "Data & BI";
  if (
    value.includes("ci") ||
    value.includes("ide") ||
    value.includes("infrastructure") ||
    value.includes("orchestration") ||
    value.includes("observability")
  ) return "CI & tooling";
  return "Other";
}

function tierMatches(item: FreeLabService, filter: string) {
  if (filter === "All") return true;
  if (filter === "True free") return item.tierType === "true-free";
  if (filter === "Trial") return item.tierType === "trial";
  return item.tierType === "local-free" || item.tierType === "open-source";
}

function tierLabel(tier: FreeLabService["tierType"]) {
  if (tier === "true-free") return "TRUE FREE";
  if (tier === "trial") return "TRIAL";
  if (tier === "local-free") return "LOCAL FREE";
  return "OPEN SOURCE";
}

export function CloudDashboard({
  query,
  onInspect
}: {
  query: string;
  onInspect: (record: InspectorRecord) => void;
}) {
  const [view, setView] = useState("Platforms");
  const [freeTier, setFreeTier] = useState("True free");
  const [freeCategory, setFreeCategory] = useState("All");
  const [selectedGuideId, setSelectedGuideId] = useState(freeTierUseCaseGuides[0]?.id ?? "");
  const q = query.trim().toLowerCase();

  const platforms = useMemo(
    () => cloudPlatforms.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const prices = useMemo(
    () => queryPrices.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const serverless = useMemo(
    () => serverlessServices.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const vms = useMemo(
    () => vmShapes.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const freeLabs = useMemo(
    () => freeLabServices.filter((item) => {
      const queryMatch = !q || JSON.stringify(item).toLowerCase().includes(q);
      const tierMatch = tierMatches(item, freeTier);
      const groupMatch = freeCategory === "All" || freeGroup(item.category) === freeCategory;
      return queryMatch && tierMatch && groupMatch;
    }),
    [q, freeTier, freeCategory]
  );

  const guides = useMemo(
    () => freeTierUseCaseGuides.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q)),
    [q]
  );
  const selectedGuide = guides.find((item) => item.id === selectedGuideId) ?? guides[0] ?? null;
  const selectedGuideServices = selectedGuide
    ? selectedGuide.serviceIds
        .map((id) => freeLabServices.find((item) => item.id === id))
        .filter((item): item is FreeLabService => Boolean(item))
    : [];
  const guideServiceCount = new Set(freeTierUseCaseGuides.flatMap((item) => item.serviceIds)).size;

  const activeCount =
    view === "Platforms" ? platforms.length :
    view === "Query pricing" ? prices.length :
    view === "Serverless" ? serverless.length :
    view === "VM shapes" ? vms.length :
    view === "Use cases" ? guides.length :
    freeLabs.length;

  const hostedFreeCount = freeLabServices.filter((item) => item.tierType === "true-free").length;
  const trialCount = freeLabServices.filter((item) => item.tierType === "trial").length;
  const localCount = freeLabServices.filter((item) => item.tierType === "local-free" || item.tierType === "open-source").length;
  const realVmCount = freeLabServices.filter((item) => item.tierType === "true-free" && item.category === "VM / compute").length;

  return (
    <div className="dashboard-grid">
      {view === "Free labs" ? (
        <section className="metric-strip four">
          <MetricCard label="HOSTED TRUE FREE" value={String(hostedFreeCount)} sub="recurring/no-expiry quota" />
          <MetricCard label="TRUE FREE VM" value={String(realVmCount)} sub="Oracle + Google-style VM quota" />
          <MetricCard label="TRIAL / CREDITS" value={String(trialCount)} sub="kept separate from permanent free" />
          <MetricCard label="LOCAL / OSS" value={String(localCount)} sub="free software; bring your own compute" />
        </section>
      ) : view === "Use cases" ? (
        <section className="metric-strip four">
          <MetricCard label="USE-CASE GUIDES" value={String(freeTierUseCaseGuides.length)} sub="start from the job, not the vendor" />
          <MetricCard label="REFERENCED SERVICES" value={String(guideServiceCount)} sub="reused across recipes" />
          <MetricCard label="SELECTED STACK" value={String(selectedGuideServices.length)} sub={selectedGuide?.category ?? "choose a guide"} />
          <MetricCard label="TRUE FREE IN STACK" value={String(selectedGuideServices.filter((item) => item.tierType === "true-free").length)} sub="trials/local tools kept distinct" />
        </section>
      ) : (
        <section className="metric-strip four">
          <MetricCard label="PLATFORMS" value={String(cloudPlatforms.length)} sub="lakehouse + warehouse + cloud stacks" />
          <MetricCard label="PRICING MODELS" value="5+" sub="capacity, credits, bytes, DBUs, instances" />
          <MetricCard label="ORCHESTRATION LAYERS" value={String(orchestrationPatterns.length)} sub="container → declarative pipeline" />
          <MetricCard label="FREE LAB CATALOG" value={String(freeLabServices.length)} sub="hosted + trial + local / OSS" />
        </section>
      )}

      <section className="panel span-12">
        <div className="split-header">
          <SectionHeader
            eyebrow={view === "Free labs" ? "FREE CLOUD + DEVELOPER LABS" : view === "Use cases" ? "FREE-TIER USE-CASE PLANNER" : "CLOUD DATA PLATFORMS"}
            title={view === "Free labs" ? "What can I genuinely run for $0?" : view === "Use cases" ? "Start from what you need to do" : "Compare architecture before comparing brand names"}
            meta={activeCount + " visible records"}
          />
          <ToggleGroup
            value={view}
            values={["Platforms", "Query pricing", "Serverless", "VM shapes", "Free labs", "Use cases"]}
            onChange={setView}
            label="Cloud view"
          />
        </div>

        {view === "Free labs" ? (
          <div className="free-lab-controls">
            <ToggleGroup
              value={freeTier}
              values={["All", "True free", "Trial", "Local / OSS"]}
              onChange={setFreeTier}
              label="Free tier type"
            />
            <select
              className="compact-select"
              value={freeCategory}
              onChange={(event) => setFreeCategory(event.target.value)}
              aria-label="Free lab category"
            >
              {["All", "Compute & web", "Databases", "Data & BI", "CI & tooling", "Other"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        ) : null}

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
          <div className="query-pricing-stack">
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

            <div>
              <SectionHeader
                eyebrow="SCAN-PRICED SERVICES"
                title="What repeated full scans cost before storage / egress"
                meta="only directly scan-priced rows are calculated"
              />
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Listed scan unit</th>
                      <th>1 unit</th>
                      <th>5 units</th>
                      <th>10 units</th>
                      <th>Included free allowance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.filter((item) => item.usd !== null).map((item) => (
                      <tr key={item.id} onClick={() => onInspect(priceInspector(item))}>
                        <td><strong>{item.service}</strong><small className="table-sub">{item.platform}</small></td>
                        <td>{item.unit}</td>
                        <td>{"$" + Number(item.usd).toFixed(2)}</td>
                        <td>{"$" + (Number(item.usd) * 5).toFixed(2)}</td>
                        <td>{"$" + (Number(item.usd) * 10).toFixed(2)}</td>
                        <td>{item.freeTier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="query-price-note">
                These multipliers use each provider's listed billing unit. BigQuery uses TiB while Athena/R2 SQL use TB-style scan units, so this is a billing-model lens rather than a byte-perfect benchmark.
              </div>
            </div>
          </div>
        ) : null}

        {view === "Serverless" && serverless.length ? (
          <div className="data-table-wrap">
            <table className="data-table feature-table serverless-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Billing unit</th>
                  <th>Permanent free allowance</th>
                  <th>Packaging</th>
                  <th>Runtime</th>
                  <th>Scale-to-zero</th>
                  <th>Best for</th>
                </tr>
              </thead>
              <tbody>
                {serverless.map((item) => (
                  <tr key={item.id} onClick={() => onInspect(serverlessInspector(item))}>
                    <td><strong>{item.name}</strong><small className="table-sub">{item.provider}</small></td>
                    <td>{item.unit}</td>
                    <td className="quota-cell">{item.freeQuota}</td>
                    <td>{item.packaging}</td>
                    <td>{item.runtimes}</td>
                    <td>{item.scaleToZero ? "✓" : "—"}</td>
                    <td>{item.goodFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {view === "VM shapes" && vms.length ? (
          <div className="vm-shape-stack">
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
                  <small>
                    {item.usdHour === null
                      ? "Price intentionally unbound until exact SKU + region are selected."
                      : "$" + item.usdHour.toFixed(4) + "/h · ≈ $" + (item.usdHour * 730).toFixed(2) + "/730h compute"}
                  </small>
                </button>
              ))}
            </div>

            <div>
              <SectionHeader
                eyebrow="SELF-HOST BASELINE"
                title="Free software still needs compute"
                meta="compute-only estimate; storage / egress / ops excluded"
              />
              <div className="data-table-wrap">
                <table className="data-table feature-table self-host-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Small lab shape</th>
                      <th>Managed alternative</th>
                      <th>What it teaches</th>
                      <th>2 vCPU / 8 GB VM reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selfHostScenarios.map((item) => {
                      const priced = vms.filter((vm) => vm.usdHour !== null && vm.vcpu >= 2 && vm.ramGb >= 8);
                      const cheapest = priced.toSorted((a, b) => Number(a.usdHour) - Number(b.usdHour))[0];
                      return (
                        <tr
                          key={item.id}
                          onClick={() => onInspect({
                            eyebrow: "SELF-HOST / MANAGED",
                            title: item.name,
                            description: item.workload,
                            stats: [
                              { label: "Software", value: item.software },
                              { label: "Lab shape", value: item.labShape },
                              { label: "Managed alternative", value: item.managedAlternative },
                              { label: "Compute baseline", value: cheapest && cheapest.usdHour !== null ? cheapest.cloud + " " + cheapest.family + " ≈ $" + (cheapest.usdHour * 730).toFixed(2) + "/730h" : "Add a priced VM snapshot" }
                            ],
                            tags: ["self-host", "managed comparison"],
                            note: item.caveat
                          })}
                        >
                          <td><strong>{item.name}</strong><small className="table-sub">{item.software}</small></td>
                          <td>{item.labShape}</td>
                          <td>{item.managedAlternative}</td>
                          <td>{item.workload}</td>
                          <td>
                            {cheapest && cheapest.usdHour !== null
                              ? cheapest.cloud + ": $" + cheapest.usdHour.toFixed(4) + "/h · ≈ $" + (cheapest.usdHour * 730).toFixed(2) + "/730h"
                              : "No priced matching VM"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {view === "Free labs" && freeLabs.length ? (
          <div className="data-table-wrap free-tier-table">
            <table className="data-table feature-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Access / OS</th>
                  <th>Card / account</th>
                  <th>Included quota</th>
                  <th>Best for</th>
                </tr>
              </thead>
              <tbody>
                {freeLabs.toSorted((a, b) => {
                  const order = { "true-free": 0, trial: 1, "local-free": 2, "open-source": 3 };
                  return order[a.tierType] - order[b.tierType] || a.provider.localeCompare(b.provider);
                }).map((item) => (
                  <tr key={item.id} onClick={() => onInspect(freeLabInspector(item))}>
                    <td><strong>{item.name}</strong><small className="table-sub">{item.provider}</small></td>
                    <td><span className={"tier-badge " + item.tierType}>{tierLabel(item.tierType)}</span></td>
                    <td>{item.category}</td>
                    <td>{item.duration}</td>
                    <td>{item.platforms ?? "Hosted / cross-platform"}</td>
                    <td>{item.cardRequired}</td>
                    <td className="quota-cell">{item.quota}</td>
                    <td>{item.goodFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {view === "Use cases" && guides.length ? (
          <div className="use-case-layout">
            <div className="use-case-guide-grid">
              {guides.map((guide) => {
                const services = guide.serviceIds
                  .map((id) => freeLabServices.find((item) => item.id === id))
                  .filter((item): item is FreeLabService => Boolean(item));
                const trueFree = services.filter((item) => item.tierType === "true-free").length;
                const active = selectedGuide?.id === guide.id;
                return (
                  <button
                    type="button"
                    className={"use-case-card" + (active ? " active" : "")}
                    key={guide.id}
                    onClick={() => {
                      setSelectedGuideId(guide.id);
                      onInspect(useCaseInspector(guide, services));
                    }}
                  >
                    <span className="micro-label">{guide.category}</span>
                    <h3>{guide.title}</h3>
                    <p>{guide.goal}</p>
                    <div className="use-case-card-meta">
                      <span>{services.length + " options"}</span>
                      <span>{trueFree + " true free"}</span>
                    </div>
                    <div className="use-case-service-chips">
                      {services.slice(0, 5).map((item) => <i key={item.id}>{item.name}</i>)}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedGuide ? (
              <div className="use-case-detail">
                <SectionHeader eyebrow={selectedGuide.category} title={selectedGuide.title} meta={selectedGuideServices.length + " stack options"} />
                <p className="use-case-goal">{selectedGuide.goal}</p>
                <div className="summary-bullets use-case-summary">
                  <span><CheckCircle2 size={16} /><strong>Pattern</strong> {selectedGuide.recommendedPattern}</span>
                  <span><Network size={16} /><strong>Watch</strong> {selectedGuide.watchFor}</span>
                  <span><Workflow size={16} /><strong>Next</strong> {selectedGuide.nextStep}</span>
                </div>

                <div className="data-table-wrap use-case-service-table">
                  <table className="data-table feature-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Tier</th>
                        <th>Category</th>
                        <th>Included quota</th>
                        <th>Why it fits</th>
                        <th>Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGuideServices.map((item) => (
                        <tr key={item.id} onClick={() => onInspect(freeLabInspector(item))}>
                          <td><strong>{item.name}</strong><small className="table-sub">{item.provider}</small></td>
                          <td><span className={"tier-badge " + item.tierType}>{tierLabel(item.tierType)}</span></td>
                          <td>{item.category}</td>
                          <td className="quota-cell">{item.quota}</td>
                          <td>{item.goodFor}</td>
                          <td>{item.source.asOf ?? "source linked"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {view === "Free labs" ? (
        <>
          <section className="panel span-8">
            <SectionHeader eyebrow="ZERO-COST LAB RECIPES" title="Combine free services by learning goal" />
            <div className="lab-recipes">
              <article>
                <Server size={18} />
                <div><strong>Linux / infrastructure lab</strong><p>Oracle or GCP free VM → Docker → OpenTofu → k3s → GitHub Actions. This is the closest route to a persistent $0 self-managed cloud lab.</p></div>
              </article>
              <article>
                <Database size={18} />
                <div><strong>FastAPI backend lab</strong><p>Render/Koyeb/Azure Container Apps → Neon/Supabase/MongoDB/Turso → Upstash Redis → Cloudflare R2 for files.</p></div>
              </article>
              <article>
                <Workflow size={18} />
                <div><strong>Data-engineering lab</strong><p>Databricks Free Edition → dbt Developer → BigQuery Sandbox or MotherDuck → Aiven Kafka when you want a managed streaming source.</p></div>
              </article>
              <article>
                <Laptop size={18} />
                <div><strong>BI / Microsoft lab</strong><p>Power BI Desktop + DAX Studio + Tabular Editor 2 locally; add the 60-day Fabric trial when you need OneLake, notebooks, Warehouse and Data Factory.</p></div>
              </article>
            </div>
          </section>

          <aside className="panel span-4">
            <SectionHeader eyebrow="FREE ≠ FREE" title="Read the tier label before designing around it" />
            <div className="knowledge-stack">
              <article><CheckCircle2 size={18} /><div><strong>True free</strong><p>A recurring monthly quota or no-expiry sandbox. It can still have idle reclaim, region restrictions, hard caps or non-commercial terms.</p></div></article>
              <article><Coins size={18} /><div><strong>Trial / credits</strong><p>Fabric, Snowflake and AWS evaluation plans are useful labs but eventually expire. They are intentionally not grouped with true free services.</p></div></article>
              <article><Laptop size={18} /><div><strong>Local / OSS</strong><p>DAX Studio, Tabular Editor 2, dbt, Airflow, OpenTofu and k3s can be free software while the machine or cloud VM running them still costs money.</p></div></article>
              <article><Network size={18} /><div><strong>Hidden bill dimensions</strong><p>Egress, object operations, storage, build minutes, cold starts and dependent services are often outside the headline free compute quota.</p></div></article>
            </div>
          </aside>

          <section className="panel span-12">
            <SectionHeader eyebrow="FREE-TIER DECISION TABLE" title="Use the catalog as a lab planner, not a marketing list" />
            <div className="summary-bullets">
              <span><Gift size={16} /><strong>Need a real VM?</strong> Start with Oracle Always Free or GCP e2-micro and inspect regional/capacity limits.</span>
              <span><Database size={16} /><strong>Need hosted SQL?</strong> Neon, Supabase, Turso, CockroachDB and Azure SQL cover different Postgres/SQLite/distributed/SQL Server patterns.</span>
              <span><Boxes size={16} /><strong>Need object data?</strong> Cloudflare R2 is useful for Parquet/object-storage labs because the catalog tracks storage, operations and egress separately.</span>
              <span><Workflow size={16} /><strong>Need Spark?</strong> Databricks Free Edition gives managed Spark/lakehouse learning; local Spark remains the unrestricted self-managed option.</span>
            </div>
          </section>
        </>
      ) : (
        <>
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
                  <div><strong>{item.name}</strong><small>{item.tools}</small></div>
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
        </>
      )}
    </div>
  );
}
