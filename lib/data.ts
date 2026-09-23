import models from "../data/models.json";
import dataStack from "../data/data-stack.json";
import cloud from "../data/cloud.json";
import hardware from "../data/hardware.json";
import evolution from "../data/evolution.json";
import codingAgents from "../data/coding-agents.json";
import freeLabs from "../data/free-labs.json";
import runtimeLab from "../data/runtime-lab.json";
import serverless from "../data/serverless.json";

import type {
  BenchmarkMeta,
  BenchmarkRun,
  CodingAgentFrontierPoint,
  CloudPlatform,
  CommunityTool,
  DataEngine,
  DataFormat,
  EvolutionItem,
  FreeTierOffer,
  FreeLabService,
  HardwareItem,
  LanguageRuntime,
  MobileSoc,
  ModelBenchmark,
  QueryPrice,
  QueryScenario,
  RuntimeFramework,
  RuntimeBenchmarkTemplate,
  RuntimeProfile,
  SelfHostScenario,
  ServerlessService,
  TerminalBenchEffortPoint,
  VmShape
} from "./types";

export const modelBenchmarks = models.benchmarks as ModelBenchmark[];
export const terminalBenchEffort = codingAgents.terminalBenchEffort as TerminalBenchEffortPoint[];
export const terminalBenchMeta = codingAgents.terminalBenchMeta as BenchmarkMeta;
export const codingAgentFrontier = codingAgents.codingAgentFrontier as CodingAgentFrontierPoint[];
export const codingAgentFrontierMeta = codingAgents.codingAgentFrontierMeta as BenchmarkMeta;

export const freeLabServices = freeLabs.services as FreeLabService[];
export const freeLabsAsOf = freeLabs.asOf as string;
export const runtimeProfiles = runtimeLab.profiles as RuntimeProfile[];
export const runtimeBenchmarkTemplates = runtimeLab.benchmarkTemplates as RuntimeBenchmarkTemplate[];
export const runtimeSummary = runtimeLab.summary as string[];
export const serverlessServices = serverless.services as ServerlessService[];

export const dataEngines = dataStack.engines as DataEngine[];
export const dataFormats = dataStack.formats as DataFormat[];
export const benchmarkRuns = dataStack.benchmarks as BenchmarkRun[];
export const languageRuntimes = dataStack.languages as LanguageRuntime[];
export const abstractionTimeline = dataStack.abstractionTimeline;
export const runtimeFrameworks = dataStack.runtimeFrameworks as RuntimeFramework[];
export const queryScenarios = dataStack.queryScenarios as QueryScenario[];

export const cloudPlatforms = cloud.platforms as CloudPlatform[];
export const queryPrices = cloud.queryPrices as QueryPrice[];
export const vmShapes = cloud.vmShapes as VmShape[];
export const freeTiers = cloud.freeTiers as FreeTierOffer[];
export const communityTools = cloud.communityTools as CommunityTool[];
export const orchestrationPatterns = cloud.orchestrationPatterns;
export const selfHostScenarios = cloud.selfHostScenarios as SelfHostScenario[];

export const hardwareItems = hardware.items as HardwareItem[];
export const mobileSocs = hardware.mobile as MobileSoc[];

export const evolutionItems = evolution.items as EvolutionItem[];

export const snapshot = {
  asOf: "2026-09-23",
  repo: "julian-passebecq/model-benchmark",
  dataPath: "data/"
};
