import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dataDir = path.join(root, "data");
const files = fs.readdirSync(dataDir).filter((name) => name.endsWith(".json")).sort();
const errors = [];
const counts = [];

function fail(file, location, message) {
  errors.push(file + " :: " + location + " :: " + message);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateTree(file, value, location = "$") {
  if (Array.isArray(value)) {
    const ids = new Map();
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      if (item && typeof item === "object" && !Array.isArray(item) && "id" in item) {
        if (typeof item.id !== "string" || item.id.trim() === "") {
          fail(file, location + "[" + index + "].id", "id must be a non-empty string");
        } else if (ids.has(item.id)) {
          fail(file, location, "duplicate id '" + item.id + "' (indexes " + ids.get(item.id) + " and " + index + ")");
        } else {
          ids.set(item.id, index);
        }
      }
      validateTree(file, item, location + "[" + index + "]");
    }
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const childLocation = location + "." + key;

    if (key === "asOf" && typeof child === "string" && !isIsoDate(child)) {
      fail(file, childLocation, "asOf must use YYYY-MM-DD");
    }

    if (key === "source" && child && typeof child === "object" && !Array.isArray(child)) {
      if (typeof child.url !== "string" || !/^https?:\/\//.test(child.url)) {
        fail(file, childLocation + ".url", "source URL must start with http:// or https://");
      }
      if (typeof child.label !== "string" || child.label.trim() === "") {
        fail(file, childLocation + ".label", "source label must be a non-empty string");
      }
    }

    validateTree(file, child, childLocation);
  }
}

function requireString(file, record, location, key) {
  if (typeof record[key] !== "string" || record[key].trim() === "") {
    fail(file, location + "." + key, key + " must be a non-empty string");
  }
}

for (const file of files) {
  const fullPath = path.join(dataDir, file);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    fail(file, "$", "invalid JSON: " + error.message);
    continue;
  }

  validateTree(file, parsed);

  if (file === "models.json" && Array.isArray(parsed.benchmarks)) {
    for (let index = 0; index < parsed.benchmarks.length; index += 1) {
      const item = parsed.benchmarks[index];
      const location = "$.benchmarks[" + index + "]";
      const hasTokenPrice = item.inputUsdPer1M !== null || item.outputUsdPer1M !== null;
      if (hasTokenPrice) {
        if (typeof item.inputUsdPer1M !== "number" || item.inputUsdPer1M < 0) fail(file, location + ".inputUsdPer1M", "priced records require a non-negative input rate");
        if (typeof item.outputUsdPer1M !== "number" || item.outputUsdPer1M < 0) fail(file, location + ".outputUsdPer1M", "priced records require a non-negative output rate");
        if (item.cachedInputUsdPer1M != null && (typeof item.cachedInputUsdPer1M !== "number" || item.cachedInputUsdPer1M < 0)) fail(file, location + ".cachedInputUsdPer1M", "cached input rate must be non-negative or null");
        if (typeof item.pricingSourceUrl !== "string" || !/^https?:\/\//.test(item.pricingSourceUrl)) fail(file, location + ".pricingSourceUrl", "priced records require an official pricing source URL");
        if (typeof item.pricingSourceLabel !== "string" || item.pricingSourceLabel.trim() === "") fail(file, location + ".pricingSourceLabel", "priced records require a pricing source label");
        if (typeof item.pricingAsOf !== "string" || !isIsoDate(item.pricingAsOf)) fail(file, location + ".pricingAsOf", "priced records require YYYY-MM-DD pricingAsOf");
      }
    }
  }

  if (file === "cloud.json" && Array.isArray(parsed.platforms)) {
    const freeLabsPath = path.join(dataDir, "free-labs.json");
    let knownServices = new Set();
    try {
      const freeLabsData = JSON.parse(fs.readFileSync(freeLabsPath, "utf8"));
      knownServices = new Set((freeLabsData.services ?? []).map((item) => item.id));
    } catch (error) {
      fail(file, "$.platforms", "could not load free-labs.json for freeAccessServiceId validation: " + error.message);
    }
    for (let index = 0; index < parsed.platforms.length; index += 1) {
      const serviceId = parsed.platforms[index].freeAccessServiceId;
      if (serviceId && !knownServices.has(serviceId)) {
        fail(file, "$.platforms[" + index + "].freeAccessServiceId", "unknown free-lab service id '" + serviceId + "'");
      }
    }
  }

  if (file === "free-labs.json") {
    const allowed = new Set(["true-free", "trial", "local-free", "open-source"]);
    if (!Array.isArray(parsed.services)) {
      fail(file, "$.services", "services must be an array");
    } else {
      for (let index = 0; index < parsed.services.length; index += 1) {
        const item = parsed.services[index];
        const location = "$.services[" + index + "]";
        for (const key of ["id", "name", "provider", "category", "duration", "quota", "goodFor", "limits", "commercialUse"]) {
          requireString(file, item, location, key);
        }
        if (!allowed.has(item.tierType)) {
          fail(file, location + ".tierType", "must be true-free, trial, local-free or open-source");
        }
        if (typeof item.platforms !== "string" || item.platforms.trim() === "") {
          fail(file, location + ".platforms", "platforms/access metadata is required");
        }
      }
      counts.push(file + ": " + parsed.services.length + " services");
    }
  } else if (file === "use-case-guides.json") {
    if (!Array.isArray(parsed.guides)) {
      fail(file, "$.guides", "guides must be an array");
    } else {
      const freeLabsPath = path.join(dataDir, "free-labs.json");
      let knownServices = new Set();
      try {
        const freeLabsData = JSON.parse(fs.readFileSync(freeLabsPath, "utf8"));
        knownServices = new Set((freeLabsData.services ?? []).map((item) => item.id));
      } catch (error) {
        fail(file, "$.guides", "could not load free-labs.json for reference validation: " + error.message);
      }

      for (let index = 0; index < parsed.guides.length; index += 1) {
        const guide = parsed.guides[index];
        const location = "$.guides[" + index + "]";
        for (const key of ["id", "title", "category", "goal", "recommendedPattern", "watchFor", "nextStep"]) {
          requireString(file, guide, location, key);
        }
        if (!Array.isArray(guide.serviceIds) || guide.serviceIds.length === 0) {
          fail(file, location + ".serviceIds", "must contain at least one service id");
        } else {
          const seen = new Set();
          for (const serviceId of guide.serviceIds) {
            if (seen.has(serviceId)) fail(file, location + ".serviceIds", "duplicate service reference '" + serviceId + "'");
            seen.add(serviceId);
            if (!knownServices.has(serviceId)) fail(file, location + ".serviceIds", "unknown free-lab service id '" + serviceId + "'");
          }
        }
      }
      counts.push(file + ": " + parsed.guides.length + " use-case guides");
    }
  } else if (file === "releases.json") {
    if (!Array.isArray(parsed.technologies)) {
      fail(file, "$.technologies", "technologies must be an array");
    } else {
      for (let index = 0; index < parsed.technologies.length; index += 1) {
        const item = parsed.technologies[index];
        const location = "$.technologies[" + index + "]";
        for (const key of ["id", "name", "category", "latestStable", "releaseDate", "status", "productionBaseline", "whyItMatters", "compatibility"]) {
          requireString(file, item, location, key);
        }
        if (!isIsoDate(item.releaseDate)) {
          fail(file, location + ".releaseDate", "releaseDate must use YYYY-MM-DD");
        }
        if (!Array.isArray(item.highlights) || item.highlights.length === 0 || item.highlights.some((value) => typeof value !== "string" || value.trim() === "")) {
          fail(file, location + ".highlights", "must contain at least one non-empty highlight");
        }
      }
      counts.push(file + ": " + parsed.technologies.length + " technology releases");
    }
  } else if (file === "runtime-lab.json") {
    if (!Array.isArray(parsed.profiles) || !Array.isArray(parsed.benchmarkTemplates)) {
      fail(file, "$", "profiles and benchmarkTemplates must be arrays");
    } else {
      counts.push(file + ": " + parsed.profiles.length + " profiles, " + parsed.benchmarkTemplates.length + " benchmark recipes");
    }
  } else if (file === "serverless.json") {
    if (!Array.isArray(parsed.services)) {
      fail(file, "$.services", "services must be an array");
    } else {
      counts.push(file + ": " + parsed.services.length + " serverless services");
    }
  } else {
    const topLevelArrays = Object.entries(parsed).filter(([, value]) => Array.isArray(value));
    if (topLevelArrays.length) {
      counts.push(file + ": " + topLevelArrays.map(([key, value]) => key + "=" + value.length).join(", "));
    } else {
      counts.push(file + ": parsed");
    }
  }
}

if (errors.length) {
  console.error("\nData validation failed:\n");
  for (const error of errors) console.error(" - " + error);
  console.error("\n" + errors.length + " error(s).");
  process.exit(1);
}

console.log("Validated " + files.length + " JSON data files.");
for (const line of counts) console.log(" - " + line);
