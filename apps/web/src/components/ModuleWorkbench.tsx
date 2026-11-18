"use client";

import { useState, type FormEvent } from "react";
import { Clipboard, Download, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import type { TechnologyModule } from "@/data/modules";

type Field = {
  id: string;
  label: string;
  initialValue: string;
  type?: "number" | "text" | "textarea";
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
};

type Tool = {
  title: string;
  description: string;
  fields: Field[];
  checklist?: { id: string; label: string }[];
  calculate: (
    values: Record<string, string>,
    checks: Record<string, boolean>,
  ) => string;
};

type SavedProject = {
  id: string;
  title: string;
  moduleId: string;
  moduleName: string;
  toolTitle: string;
  values: Record<string, string>;
  checks: Record<string, boolean>;
  result: string;
  savedAt: string;
};

const projectStorageKey = "omniverse-ai:technology-projects:v1";

const numberField = (
  id: string,
  label: string,
  initialValue: string,
  min = 0,
  max?: number,
  step = 1,
): Field => ({ id, label, initialValue, type: "number", min, max, step });

const textField = (
  id: string,
  label: string,
  initialValue: string,
  type: "text" | "textarea" = "text",
  required = true,
): Field => ({ id, label, initialValue, type, required });

const value = (values: Record<string, string>, id: string) =>
  Number(values[id]);
const number = (input: number, digits = 2) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(input);
const usd = (input: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(input);
const unavailable = "Enter valid values in all required fields.";

const tools: Record<string, Tool> = {
  "artificial-intelligence": {
    title: "AI solution brief",
    description:
      "Frame an AI use case and its success criteria before selecting a model or provider.",
    fields: [
      textField("problem", "Problem to solve", "", "textarea"),
      textField("users", "Who will use the solution?", "", "text", false),
      textField("metric", "How will success be measured?", "", "text", false),
      textField("constraints", "Constraints or human-review needs", "", "text", false),
    ],
    calculate: (values) => {
      if (!values.problem.trim()) return "Describe the problem before creating a brief.";
      return [
        "AI SOLUTION BRIEF",
        `Problem: ${values.problem.trim()}`,
        `Users: ${values.users.trim() || "Not specified"}`,
        `Success measure: ${values.metric.trim() || "Not specified"}`,
        `Constraints and review: ${values.constraints.trim() || "Not specified"}`,
      ].join("\n\n");
    },
  },
  "generative-ai": {
    title: "Prompt composer",
    description:
      "Assemble a reusable prompt locally. It is not sent to an AI service.",
    fields: [
      textField("role", "Role or perspective", "You are a helpful assistant."),
      textField("context", "Context", "", "textarea", false),
      textField("task", "Task", "", "textarea"),
      textField("format", "Output format", "A concise, structured answer."),
    ],
    calculate: (values) => {
      if (!values.task.trim()) return "Add a task before composing the prompt.";
      return [
        `Role:\n${values.role.trim() || "Not specified"}`,
        `Context:\n${values.context.trim() || "Not specified"}`,
        `Task:\n${values.task.trim()}`,
        `Output format:\n${values.format.trim() || "Not specified"}`,
      ].join("\n\n");
    },
  },
  "machine-learning": {
    title: "Classification metrics",
    description:
      "Calculate accuracy, precision, recall, and F1 from a confusion matrix.",
    fields: [
      numberField("tp", "True positives", "42"),
      numberField("tn", "True negatives", "44"),
      numberField("fp", "False positives", "6"),
      numberField("fn", "False negatives", "8"),
    ],
    calculate: (values) => {
      const { tp, tn, fp, fn } = {
        tp: value(values, "tp"),
        tn: value(values, "tn"),
        fp: value(values, "fp"),
        fn: value(values, "fn"),
      };
      if (![tp, tn, fp, fn].every(Number.isFinite)) return unavailable;
      const total = tp + tn + fp + fn;
      if (total === 0) return "At least one observation is required.";
      const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
      const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
      const f1 = precision + recall === 0
        ? 0
        : (2 * precision * recall) / (precision + recall);
      return [
        `Accuracy: ${number((tp + tn) / total * 100)}%`,
        `Precision: ${number(precision * 100)}%`,
        `Recall: ${number(recall * 100)}%`,
        `F1 score: ${number(f1 * 100)}%`,
        `Observations: ${number(total, 0)}`,
      ].join("\n");
    },
  },
  "deep-learning": {
    title: "Dense network parameter estimator",
    description:
      "Estimate trainable parameters for fully connected layers, including one bias per output unit.",
    fields: [
      textField("layers", "Layer widths, comma-separated", "128, 64, 10"),
    ],
    calculate: (values) => {
      const widths = values.layers
        .split(",")
        .map((part) => Number(part.trim()));
      if (
        widths.length < 2 ||
        !widths.every((width) => Number.isInteger(width) && width > 0)
      ) {
        return "Enter at least two positive integer layer widths, separated by commas.";
      }
      const counts = widths.slice(1).map((width, index) => {
        const parameters = widths[index] * width + width;
        return `${widths[index]} → ${width}: ${number(parameters, 0)} parameters`;
      });
      const total = widths.slice(1).reduce(
        (sum, width, index) => sum + widths[index] * width + width,
        0,
      );
      return [
        ...counts,
        `Total trainable parameters: ${number(total, 0)}`,
      ].join("\n");
    },
  },
  "data-science": {
    title: "Descriptive statistics",
    description:
      "Summarize a small list of numeric values. Values are processed in this browser only.",
    fields: [
      textField("dataset", "Numbers, comma-separated", "4, 7, 7, 9, 13"),
    ],
    calculate: (values) => {
      const rawItems = values.dataset.split(",").map((item) => item.trim());
      const items = rawItems.map(Number);
      if (!items.length || rawItems.some((item) => !item) || !items.every(Number.isFinite)) {
        return "Enter one or more valid numbers, separated by commas.";
      }
      const sorted = [...items].sort((a, b) => a - b);
      const mean = items.reduce((sum, item) => sum + item, 0) / items.length;
      const middle = Math.floor(sorted.length / 2);
      const median = sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
      const deviation = Math.sqrt(
        items.reduce((sum, item) => sum + (item - mean) ** 2, 0) / items.length,
      );
      return [
        `Count: ${items.length}`,
        `Mean: ${number(mean)}`,
        `Median: ${number(median)}`,
        `Population standard deviation: ${number(deviation)}`,
        `Minimum / maximum: ${number(sorted[0])} / ${number(sorted[sorted.length - 1])}`,
      ].join("\n");
    },
  },
  "data-analytics": {
    title: "Conversion funnel",
    description:
      "Compare visitor, engagement, and conversion counts to see where users drop off.",
    fields: [
      numberField("visitors", "Visitors", "1000"),
      numberField("engaged", "Engaged users", "320"),
      numberField("conversions", "Conversions", "68"),
    ],
    calculate: (values) => {
      const visitors = value(values, "visitors");
      const engaged = value(values, "engaged");
      const conversions = value(values, "conversions");
      if (![visitors, engaged, conversions].every(Number.isFinite)) return unavailable;
      if (visitors <= 0 || engaged > visitors || conversions > engaged) {
        return "Use counts where visitors > 0, engaged users ≤ visitors, and conversions ≤ engaged users.";
      }
      return [
        `Visitor → engaged: ${number(engaged / visitors * 100)}%`,
        `Engaged → converted: ${number(engaged === 0 ? 0 : conversions / engaged * 100)}%`,
        `Overall conversion: ${number(conversions / visitors * 100)}%`,
        `Users lost before engagement: ${number(visitors - engaged, 0)}`,
        `Engaged users without conversion: ${number(engaged - conversions, 0)}`,
      ].join("\n");
    },
  },
  "big-data": {
    title: "Ingestion and retention estimator",
    description:
      "Estimate storage volume from event rate, average event size, and retention.",
    fields: [
      numberField("events", "Events per second", "5000", 0, undefined, 1),
      numberField("bytes", "Average event size (bytes)", "1200", 0, undefined, 1),
      numberField("days", "Retention (days)", "30", 0, undefined, 1),
    ],
    calculate: (values) => {
      const events = value(values, "events");
      const bytes = value(values, "bytes");
      const days = value(values, "days");
      if (![events, bytes, days].every((item) => Number.isFinite(item) && item >= 0)) {
        return unavailable;
      }
      const dailyGigabytes = events * bytes * 86400 / 1e9;
      return [
        `Ingestion rate: ${number(events * bytes / 1e6)} MB/s`,
        `Daily volume: ${number(dailyGigabytes)} GB/day`,
        `Retained volume: ${number(dailyGigabytes * days / 1000)} TB`,
        "Estimate excludes replication, indexes, compression, and metadata.",
      ].join("\n");
    },
  },
  "cloud-computing": {
    title: "Monthly cloud cost estimator",
    description:
      "Estimate compute, storage, and data-transfer charges using your own unit prices.",
    fields: [
      numberField("hours", "Compute hours / month", "730"),
      numberField("computeRate", "Compute price / hour ($)", "0.12", 0, undefined, 0.01),
      numberField("storage", "Storage (GB)", "250"),
      numberField("storageRate", "Storage price / GB / month ($)", "0.08", 0, undefined, 0.01),
      numberField("egress", "Outbound data (GB)", "100"),
      numberField("egressRate", "Outbound price / GB ($)", "0.09", 0, undefined, 0.01),
    ],
    calculate: (values) => {
      const compute = value(values, "hours") * value(values, "computeRate");
      const storage = value(values, "storage") * value(values, "storageRate");
      const egress = value(values, "egress") * value(values, "egressRate");
      if (![compute, storage, egress].every((item) => Number.isFinite(item) && item >= 0)) {
        return unavailable;
      }
      return [
        `Compute: $${number(compute)}`,
        `Storage: $${number(storage)}`,
        `Outbound data: $${number(egress)}`,
        `Estimated monthly total: $${number(compute + storage + egress)}`,
        "Estimate excludes taxes, discounts, support, and provider-specific fees.",
      ].join("\n");
    },
  },
  cybersecurity: {
    title: "Incident response checklist",
    description:
      "Track defensive response steps for an incident using your organization's approved procedures.",
    fields: [
      textField("incident", "Incident summary", "", "textarea", false),
      textField("system", "Affected service or system", "", "text", false),
    ],
    checklist: [
      { id: "lead", label: "Assign an incident lead and record the time detected." },
      { id: "contain", label: "Contain affected systems using approved procedures." },
      { id: "evidence", label: "Preserve relevant logs and evidence." },
      { id: "scope", label: "Assess affected accounts, data, and services." },
      { id: "credentials", label: "Revoke or rotate confirmed exposed credentials." },
      { id: "recover", label: "Recover from a trusted source and verify monitoring." },
      { id: "review", label: "Record lessons learned and follow-up owners." },
    ],
    calculate: (values, checks) => {
      const checked = Object.values(checks).filter(Boolean).length;
      const tasks = tools.cybersecurity.checklist ?? [];
      return [
        "DEFENSIVE INCIDENT NOTE",
        `Incident: ${values.incident.trim() || "Not specified"}`,
        `Affected system: ${values.system.trim() || "Not specified"}`,
        `Response steps checked: ${checked} of ${tasks.length}`,
        "",
        ...tasks.map((task) => `${checks[task.id] ? "[x]" : "[ ]"} ${task.label}`),
        "",
        "Follow your organization's incident response plan and escalation process.",
      ].join("\n");
    },
  },
  "information-security": {
    title: "Information risk rating",
    description:
      "Prioritize a data or system risk using a simple likelihood × impact score.",
    fields: [
      textField("asset", "Information asset or process", "", "text", false),
      numberField("likelihood", "Likelihood (1–5)", "3", 1, 5),
      numberField("impact", "Impact (1–5)", "4", 1, 5),
    ],
    calculate: (values) => {
      const likelihood = value(values, "likelihood");
      const impact = value(values, "impact");
      if (![likelihood, impact].every((item) => Number.isInteger(item) && item >= 1 && item <= 5)) {
        return "Choose whole-number likelihood and impact values from 1 to 5.";
      }
      const score = likelihood * impact;
      const rating = score <= 4 ? "Low" : score <= 9 ? "Moderate" : score <= 16 ? "High" : "Critical";
      return [
        `Asset: ${values.asset.trim() || "Not specified"}`,
        `Likelihood × impact: ${likelihood} × ${impact} = ${score}/25`,
        `Priority: ${rating}`,
        "Use this as a triage aid, not a substitute for your formal risk methodology.",
      ].join("\n");
    },
  },
  blockchain: {
    title: "Transaction fee estimator",
    description:
      "Estimate a transaction fee from gas usage and gas price. This does not submit a transaction.",
    fields: [
      numberField("gas", "Estimated gas units", "21000"),
      numberField("gwei", "Gas price (gwei)", "25", 0, undefined, 0.1),
      numberField("tokenPrice", "Native token price (USD)", "3000", 0, undefined, 0.01),
    ],
    calculate: (values) => {
      const gas = value(values, "gas");
      const gwei = value(values, "gwei");
      const tokenPrice = value(values, "tokenPrice");
      if (![gas, gwei, tokenPrice].every((item) => Number.isFinite(item) && item >= 0)) {
        return unavailable;
      }
      const fee = gas * gwei / 1e9;
      return [
        `Estimated fee: ${number(fee, 8)} native tokens`,
        `Estimated value: $${number(fee * tokenPrice)}`,
        "Actual fees depend on chain conditions and transaction execution.",
      ].join("\n");
    },
  },
  "web-development": {
    title: "Fluid type scale generator",
    description:
      "Generate a CSS clamp() value that scales between chosen viewport and font sizes.",
    fields: [
      numberField("minViewport", "Minimum viewport (px)", "360"),
      numberField("maxViewport", "Maximum viewport (px)", "1440"),
      numberField("minFont", "Minimum font (px)", "16"),
      numberField("maxFont", "Maximum font (px)", "24"),
    ],
    calculate: (values) => {
      const minViewport = value(values, "minViewport");
      const maxViewport = value(values, "maxViewport");
      const minFont = value(values, "minFont");
      const maxFont = value(values, "maxFont");
      if (![minViewport, maxViewport, minFont, maxFont].every(Number.isFinite)) {
        return unavailable;
      }
      if (minViewport <= 0 || maxViewport <= minViewport || minFont <= 0 || maxFont < minFont) {
        return "Use positive viewport widths in ascending order and a maximum font size at least as large as the minimum.";
      }
      const slope = (maxFont - minFont) / (maxViewport - minViewport) * 100;
      const intercept = minFont - slope * minViewport / 100;
      return [
        "CSS",
        `font-size: clamp(${number(minFont, 2)}px, calc(${number(slope, 4)}vw + ${number(intercept, 2)}px), ${number(maxFont, 2)}px);`,
        "",
        "Adjust the values to fit your design system and test at your supported breakpoints.",
      ].join("\n");
    },
  },
  "mobile-app-development": {
    title: "dp to pixel converter",
    description:
      "Convert density-independent dimensions to physical pixels for a selected screen density.",
    fields: [
      numberField("width", "Width (dp)", "393"),
      numberField("height", "Height (dp)", "852"),
      numberField("density", "Density scale", "3", 0.1, undefined, 0.1),
    ],
    calculate: (values) => {
      const width = value(values, "width");
      const height = value(values, "height");
      const density = value(values, "density");
      if (![width, height, density].every((item) => Number.isFinite(item) && item >= 0)) {
        return unavailable;
      }
      return [
        `Width: ${number(width, 0)} dp × ${number(density)} = ${number(width * density, 0)} px`,
        `Height: ${number(height, 0)} dp × ${number(density)} = ${number(height * density, 0)} px`,
        "Physical display size and platform scaling behavior may vary by device.",
      ].join("\n");
    },
  },
  "game-development": {
    title: "Expected damage calculator",
    description:
      "Estimate average damage across normal and critical hits after percentage-based armor reduction.",
    fields: [
      numberField("base", "Base damage", "60", 0, undefined, 0.1),
      numberField("skill", "Skill multiplier", "1.5", 0, undefined, 0.1),
      numberField("armor", "Armor reduction (%)", "20", 0, 100, 1),
      numberField("chance", "Critical chance (%)", "15", 0, 100, 1),
      numberField("critical", "Critical multiplier", "2", 1, undefined, 0.1),
    ],
    calculate: (values) => {
      const base = value(values, "base");
      const skill = value(values, "skill");
      const armor = value(values, "armor");
      const chance = value(values, "chance");
      const critical = value(values, "critical");
      if (![base, skill, armor, chance, critical].every((item) => Number.isFinite(item) && item >= 0)) {
        return unavailable;
      }
      if (armor > 100 || chance > 100) return "Armor reduction and critical chance must be at most 100%.";
      const normal = base * skill * (1 - armor / 100);
      const expected = normal * (1 + chance / 100 * (critical - 1));
      return [
        `Normal hit after armor: ${number(normal)}`,
        `Critical hit after armor: ${number(normal * critical)}`,
        `Expected damage per hit: ${number(expected)}`,
        "Estimate excludes game-specific rounding, buffs, and damage rules.",
      ].join("\n");
    },
  },
  "internet-of-things": {
    title: "IoT telemetry capacity planner",
    description:
      "Estimate message rate and retained payload volume for a fleet of connected devices.",
    fields: [
      numberField("devices", "Connected devices", "500"),
      numberField("messages", "Messages per device / day", "1440"),
      numberField("payload", "Average payload (bytes)", "512"),
      numberField("retention", "Retention (days)", "30"),
    ],
    calculate: (values) => {
      const devices = value(values, "devices");
      const messages = value(values, "messages");
      const payload = value(values, "payload");
      const retention = value(values, "retention");
      if (![devices, messages, payload, retention].every(
        (item) => Number.isFinite(item) && item >= 0,
      )) {
        return unavailable;
      }
      const dailyMessages = devices * messages;
      const dailyGigabytes = dailyMessages * payload / 1e9;
      return [
        `Messages per day: ${number(dailyMessages, 0)}`,
        `Average message rate: ${number(dailyMessages / 86400)} messages/second`,
        `Payload volume: ${number(dailyGigabytes)} GB/day`,
        `Retained payload: ${number(dailyGigabytes * retention / 1000)} TB`,
        "Estimate excludes protocol overhead, indexes, replication, and retries.",
      ].join("\n");
    },
  },
  robotics: {
    title: "Wheel motion planner",
    description:
      "Estimate wheel speed and travel time from motor speed, reduction ratio, and wheel diameter. This does not control hardware.",
    fields: [
      numberField("diameter", "Wheel diameter (mm)", "100", 0.1, undefined, 0.1),
      numberField("motorRpm", "Motor speed (RPM)", "300", 0.1, undefined, 0.1),
      numberField("reduction", "Gear reduction ratio", "30", 0.1, undefined, 0.1),
      numberField("distance", "Travel distance (m)", "10", 0.1, undefined, 0.1),
    ],
    calculate: (values) => {
      const diameter = value(values, "diameter") / 1000;
      const motorRpm = value(values, "motorRpm");
      const reduction = value(values, "reduction");
      const distance = value(values, "distance");
      if (![diameter, motorRpm, reduction, distance].every(
        (item) => Number.isFinite(item) && item > 0,
      )) {
        return "Enter positive finite values for wheel size, motor speed, gear ratio, and distance.";
      }
      const wheelRpm = motorRpm / reduction;
      const circumference = Math.PI * diameter;
      const speed = circumference * wheelRpm / 60;
      const wheelRotations = distance / circumference;
      return [
        `Wheel speed: ${number(wheelRpm)} RPM`,
        `Linear speed: ${number(speed)} m/s`,
        `Estimated travel time: ${number(distance / speed)} seconds`,
        `Wheel rotations: ${number(wheelRotations)}`,
        `Motor rotations: ${number(wheelRotations * reduction)}`,
        "Estimate excludes acceleration, wheel slip, load, and controller limits.",
      ].join("\n");
    },
  },
  automation: {
    title: "Workflow automation ROI planner",
    description:
      "Estimate labor time and cost savings for a repeatable workflow. This planner does not connect to or automate external systems.",
    fields: [
      numberField("tasksPerDay", "Tasks per workday", "25", 0, undefined, 1),
      numberField("minutesPerTask", "Manual minutes per task", "8", 0, undefined, 0.1),
      numberField("coverage", "Tasks handled by automation (%)", "80", 0, 100, 1),
      numberField("hourlyCost", "Labor cost (USD / hour)", "35", 0, undefined, 0.01),
      numberField("setupHours", "Estimated setup effort (hours)", "12", 0, undefined, 0.5),
      numberField("workdays", "Workdays per month", "22", 1, 31, 1),
    ],
    calculate: (values) => {
      const tasksPerDay = value(values, "tasksPerDay");
      const minutesPerTask = value(values, "minutesPerTask");
      const coverage = value(values, "coverage");
      const hourlyCost = value(values, "hourlyCost");
      const setupHours = value(values, "setupHours");
      const workdays = value(values, "workdays");
      const inputs = [
        tasksPerDay,
        minutesPerTask,
        coverage,
        hourlyCost,
        setupHours,
        workdays,
      ];
      if (!inputs.every(Number.isFinite) || inputs.some((item) => item < 0)) {
        return unavailable;
      }
      if (coverage > 100 || workdays < 1 || workdays > 31) {
        return "Automation coverage must be at most 100%, and workdays per month must be from 1 to 31.";
      }

      const hoursSavedPerDay = tasksPerDay * minutesPerTask * coverage / 100 / 60;
      const dailySavings = hoursSavedPerDay * hourlyCost;
      const monthlySavings = dailySavings * workdays;
      const setupCost = setupHours * hourlyCost;
      if (![hoursSavedPerDay, dailySavings, monthlySavings, setupCost].every(Number.isFinite)) {
        return "These values are too large to estimate safely.";
      }

      const payback = setupCost === 0
        ? "No setup cost"
        : dailySavings === 0
          ? "No payback at the current inputs"
          : `${number(setupCost / dailySavings)} working days`;
      return [
        `Tasks automated per workday: ${number(tasksPerDay * coverage / 100, 1)}`,
        `Labor time saved per workday: ${number(hoursSavedPerDay)} hours`,
        `Estimated labor savings per month: ${usd(monthlySavings)}`,
        `Estimated one-time setup labor cost: ${usd(setupCost)}`,
        `Estimated payback: ${payback}`,
        `First-month savings after setup labor: ${usd(monthlySavings - setupCost)}`,
        "Estimate excludes software costs, maintenance, exceptions, and process redesign.",
      ].join("\n");
    },
  },
  "quantum-computing": {
    title: "Quantum circuit execution planner",
    description:
      "Estimate gate-layer runtime and gate operations for a circuit workload. This is a rough planning estimate, not a simulator or hardware benchmark.",
    fields: [
      numberField("qubits", "Qubits in the circuit", "8", 1, undefined, 1),
      numberField("gates", "Gate operations per circuit", "100", 1, undefined, 1),
      numberField("depth", "Sequential circuit layers", "20", 1, undefined, 1),
      numberField("shots", "Circuit shots", "1000", 1, undefined, 1),
      numberField("gateTime", "Average gate time (microseconds)", "1", 0.1, undefined, 0.1),
    ],
    calculate: (values) => {
      const qubits = value(values, "qubits");
      const gates = value(values, "gates");
      const depth = value(values, "depth");
      const shots = value(values, "shots");
      const gateTime = value(values, "gateTime");
      const counts = [qubits, gates, depth, shots];
      if (
        !counts.every((item) => Number.isInteger(item) && item > 0) ||
        !Number.isFinite(gateTime) ||
        gateTime <= 0
      ) {
        return "Enter positive whole-number qubit, gate, layer, and shot counts, plus a positive finite gate time.";
      }
      if (depth > gates) {
        return "Circuit depth cannot exceed the number of gate operations.";
      }

      const gateOperations = gates * shots;
      const runtimeSeconds = depth * gateTime * shots / 1e6;
      const qubitTime = qubits * runtimeSeconds;
      if (![gateOperations, runtimeSeconds, qubitTime].every(Number.isFinite)) {
        return "These values are too large to estimate safely.";
      }

      return [
        `Qubit register: ${number(qubits, 0)} qubits`,
        `Circuit: ${number(gates, 0)} gate operations across ${number(depth, 0)} sequential layers`,
        `Shots: ${number(shots, 0)}`,
        `Total gate operations: ${number(gateOperations, 0)}`,
        `Estimated execution time: ${number(runtimeSeconds)} seconds`,
        `Estimated qubit-time: ${number(qubitTime)} qubit-seconds`,
        "Estimate assumes gates within each layer run in parallel and excludes state preparation, readout, routing, queueing, and error correction.",
      ].join("\n");
    },
  },
  "computer-hardware": {
    title: "PC power budget planner",
    description:
      "Estimate system power from component peak values and check a PSU against a target utilization. This is a planning estimate, not a hardware measurement.",
    fields: [
      numberField("cpuPower", "CPU power estimate (W)", "125", 0, undefined, 1),
      numberField("gpuPower", "GPU power estimate (W)", "250", 0, undefined, 1),
      numberField("otherPower", "Other components (W)", "100", 0, undefined, 1),
      numberField("psuRating", "PSU rated capacity (W)", "650", 1, undefined, 1),
      numberField("targetUtilization", "Target maximum utilization (%)", "80", 1, 100, 1),
    ],
    calculate: (values) => {
      const cpuPower = value(values, "cpuPower");
      const gpuPower = value(values, "gpuPower");
      const otherPower = value(values, "otherPower");
      const psuRating = value(values, "psuRating");
      const targetUtilization = value(values, "targetUtilization");
      const inputs = [cpuPower, gpuPower, otherPower, psuRating, targetUtilization];
      if (!inputs.every(Number.isFinite) || inputs.some((item) => item < 0)) {
        return unavailable;
      }
      if (psuRating <= 0 || targetUtilization <= 0 || targetUtilization > 100) {
        return "PSU capacity must be positive, and target utilization must be between 1% and 100%.";
      }

      const estimatedLoad = cpuPower + gpuPower + otherPower;
      const utilization = estimatedLoad / psuRating * 100;
      const recommendedCapacity = estimatedLoad / (targetUtilization / 100);
      const remainingCapacity = psuRating - estimatedLoad;
      if (![estimatedLoad, utilization, recommendedCapacity, remainingCapacity].every(Number.isFinite)) {
        return "These values are too large to estimate safely.";
      }

      const targetStatus = utilization <= targetUtilization
        ? `Within the ${number(targetUtilization, 0)}% target`
        : `Exceeds the ${number(targetUtilization, 0)}% target by ${number(utilization - targetUtilization)} percentage points`;
      return [
        `Estimated component load: ${number(estimatedLoad, 0)} W`,
        `PSU rated capacity: ${number(psuRating, 0)} W`,
        `Estimated PSU utilization: ${number(utilization)}%`,
        `Remaining rated capacity: ${number(remainingCapacity, 0)} W`,
        `Minimum PSU rating at the target utilization: ${number(recommendedCapacity, 0)} W`,
        `Target check: ${targetStatus}`,
        "Estimate uses the entered component power values; verify transient demand, PSU connectors, and manufacturer specifications before choosing hardware.",
      ].join("\n");
    },
  },
  "semiconductor-technology": {
    title: "Wafer yield estimator",
    description:
      "Estimate semiconductor die count and modeled yield from wafer geometry and defect density.",
    fields: [
      numberField("waferDiameter", "Wafer diameter (mm)", "300", 1, undefined, 1),
      numberField("dieWidth", "Die width (mm)", "10", 0.1, undefined, 0.1),
      numberField("dieHeight", "Die height (mm)", "10", 0.1, undefined, 0.1),
      numberField("defectDensity", "Defect density (per cm²)", "0.1", 0, undefined, 0.01),
    ],
    calculate: (values) => {
      const waferDiameter = value(values, "waferDiameter");
      const dieWidth = value(values, "dieWidth");
      const dieHeight = value(values, "dieHeight");
      const defectDensity = value(values, "defectDensity");
      if (![waferDiameter, dieWidth, dieHeight].every((item) => Number.isFinite(item) && item > 0) ||
          !Number.isFinite(defectDensity) || defectDensity < 0) {
        return "Enter positive wafer and die values, plus a non-negative defect density.";
      }
      const radius = waferDiameter / 2;
      const dieAreaCm = dieWidth * dieHeight / 100;
      const grossDies = Math.PI * radius * radius / (dieWidth * dieHeight);
      const edgeLoss = grossDies * (dieAreaCm > 0 ? dieAreaCm * 0.08 : 0);
      const usableDies = Math.max(0, grossDies - edgeLoss);
      const modelYield = 1 / (1 + defectDensity * dieAreaCm);
      const modeledYieldDies = usableDies * modelYield;
      if (![grossDies, usableDies, modelYield, modeledYieldDies].every(Number.isFinite)) {
        return "These values are too large to estimate safely.";
      }
      return [
        `Theoretical die area count: ${number(grossDies, 0)} dies`,
        `Approximate usable gross dies: ${number(usableDies, 0)} dies`,
        `Modeled die yield: ${number(modelYield * 100)}%`,
        `Estimated good dies: ${number(modeledYieldDies, 0)} per wafer`,
        "Simplified yield model excludes reticle alignment, wafer-edge losses, clustering, and manufacturing-process-specific yield distributions.",
      ].join("\n");
    },
  },
  "networking": {
    title: "Network capacity planner",
    description:
      "Estimate usable throughput and determine whether a connection can carry a target workload.",
    fields: [
      numberField("linkSpeed", "Link speed (Mbps)", "1000", 0.1, undefined, 0.1),
      numberField("protocolOverhead", "Protocol overhead (%)", "10", 0, 100, 0.1),
      numberField("targetTraffic", "Peak traffic (Mbps)", "650", 0, undefined, 0.1),
      numberField("latency", "Round-trip latency (ms)", "40", 0, undefined, 0.1),
    ],
    calculate: (values) => {
      const linkSpeed = value(values, "linkSpeed");
      const protocolOverhead = value(values, "protocolOverhead");
      const targetTraffic = value(values, "targetTraffic");
      const latency = value(values, "latency");
      if (![linkSpeed, protocolOverhead, targetTraffic, latency].every(Number.isFinite)) return unavailable;
      if (linkSpeed <= 0 || protocolOverhead < 0 || protocolOverhead >= 100 || targetTraffic < 0 || latency < 0) {
        return "Use a positive link speed, overhead below 100%, and non-negative traffic and latency.";
      }
      const usableMbps = linkSpeed * (1 - protocolOverhead / 100);
      const utilization = usableMbps === 0 ? 0 : targetTraffic / usableMbps * 100;
      const availableHeadroom = usableMbps - targetTraffic;
      return [
        `Usable throughput: ${number(usableMbps)} Mbps`,
        `Target utilization: ${number(utilization)}%`,
        `Available headroom: ${number(availableHeadroom)} Mbps`,
        `Round-trip latency: ${number(latency)} ms`,
        utilization <= 80
          ? "Capacity check: target workload is within an 80% operating target."
          : "Capacity check: consider reducing load or upgrading the link.",
        "Estimate excludes congestion, retransmissions, jitter, application behavior, and full-duplex or shared-link conditions.",
      ].join("\n");
    },
  },
  "database-management": {
    title: "Database growth planner",
    description:
      "Estimate daily and retained database storage from record volume and average record size.",
    fields: [
      numberField("recordsPerDay", "New records per day", "100000", 0, undefined, 1),
      numberField("recordSize", "Average stored size (KB)", "4", 0, undefined, 0.1),
      numberField("retentionDays", "Retention (days)", "365", 0, undefined, 1),
      numberField("indexFactor", "Index and overhead multiplier", "1.5", 1, undefined, 0.1),
    ],
    calculate: (values) => {
      const recordsPerDay = value(values, "recordsPerDay");
      const recordSize = value(values, "recordSize");
      const retentionDays = value(values, "retentionDays");
      const indexFactor = value(values, "indexFactor");
      if (![recordsPerDay, recordSize, retentionDays, indexFactor].every((item) => Number.isFinite(item) && item >= 0)) {
        return unavailable;
      }
      if (indexFactor < 1) return "The index and overhead multiplier must be at least 1.";
      const dailyGigabytes = recordsPerDay * recordSize / 1e6 * indexFactor;
      const retainedGigabytes = dailyGigabytes * retentionDays;
      return [
        `Daily data growth: ${number(dailyGigabytes)} GB/day`,
        `Retention volume: ${number(retainedGigabytes)} GB`,
        `Retention volume: ${number(retainedGigabytes / 1000)} TB`,
        `Index and overhead allowance: ${number((indexFactor - 1) * 100)}%`,
        "Estimate does not include backups, replicas, WAL/archive logs, temporary files, partitioning, or database-specific compression.",
      ].join("\n");
    },
  },
  "it-consulting": {
    title: "Project effort estimator",
    description:
      "Estimate a planning range for project effort and budget from team size, duration, and uncertainty.",
    fields: [
      numberField("teamSize", "Team members", "4", 1, undefined, 1),
      numberField("durationWeeks", "Duration (weeks)", "8", 1, undefined, 1),
      numberField("hoursPerWeek", "Hours per person / week", "40", 1, undefined, 1),
      numberField("rate", "Blended hourly rate ($)", "125", 0, undefined, 1),
      numberField("uncertainty", "Contingency (%)", "20", 0, undefined, 1),
    ],
    calculate: (values) => {
      const teamSize = value(values, "teamSize");
      const durationWeeks = value(values, "durationWeeks");
      const hoursPerWeek = value(values, "hoursPerWeek");
      const rate = value(values, "rate");
      const uncertainty = value(values, "uncertainty");
      const inputs = [teamSize, durationWeeks, hoursPerWeek, rate, uncertainty];
      if (!inputs.every(Number.isFinite) || inputs.some((item) => item < 0)) return unavailable;
      if (![teamSize, durationWeeks, hoursPerWeek].every((item) => item > 0)) {
        return "Team size, duration, and hours per week must be positive.";
      }
      const baseHours = teamSize * durationWeeks * hoursPerWeek;
      const plannedHours = baseHours * (1 + uncertainty / 100);
      const baseCost = baseHours * rate;
      const plannedCost = plannedHours * rate;
      return [
        `Base effort: ${number(baseHours, 0)} person-hours`,
        `Effort with contingency: ${number(plannedHours, 0)} person-hours`,
        `Base budget: ${usd(baseCost)}`,
        `Planning budget: ${usd(plannedCost)}`,
        `Contingency: ${number(uncertainty)}%`,
        "Range is indicative and excludes travel, tooling, taxes, third-party fees, and scope changes.",
      ].join("\n");
    },
  },
  "ar-vr-xr": {
    title: "XR frame budget planner",
    description:
      "Allocate frame time across rendering, CPU work, GPU work, and platform overhead.",
    fields: [
      numberField("frameRate", "Target frame rate (Hz)", "90", 1, undefined, 1),
      numberField("renderMs", "Rendering budget (ms)", "6"),
      numberField("cpuMs", "CPU and application work (ms)", "2"),
      numberField("otherMs", "Compositing and overhead (ms)", "1"),
    ],
    calculate: (values) => {
      const frameRate = value(values, "frameRate");
      const renderMs = value(values, "renderMs");
      const cpuMs = value(values, "cpuMs");
      const otherMs = value(values, "otherMs");
      if (![frameRate, renderMs, cpuMs, otherMs].every((item) => Number.isFinite(item) && item >= 0)) return unavailable;
      if (frameRate <= 0) return "Target frame rate must be positive.";
      const frameBudget = 1000 / frameRate;
      const plannedMs = renderMs + cpuMs + otherMs;
      const headroom = frameBudget - plannedMs;
      return [
        `Frame budget: ${number(frameBudget)} ms`,
        `Planned work: ${number(plannedMs)} ms`,
        `Remaining headroom: ${number(headroom)} ms`,
        headroom >= 0
          ? "Frame budget check: the entered work fits inside the frame budget."
          : `Frame budget check: planned work exceeds the target by ${number(Math.abs(headroom))} ms.`,
        "Actual CPU/GPU parallelism, driver overhead, reprojection, and thermal limits vary by device.",
      ].join("\n");
    },
  },
  "edge-computing": {
    title: "Edge capacity estimator",
    description:
      "Estimate edge-node request capacity and storage runway from traffic and retention inputs.",
    fields: [
      numberField("requestsPerSecond", "Requests per second", "250", 0, undefined, 1),
      numberField("requestsPerNode", "Sustained capacity per node", "400", 1, undefined, 1),
      numberField("payloadKb", "Average payload (KB)", "80", 0, undefined, 0.1),
      numberField("storageGb", "Local storage (GB)", "500", 0, undefined, 1),
    ],
    calculate: (values) => {
      const requestsPerSecond = value(values, "requestsPerSecond");
      const requestsPerNode = value(values, "requestsPerNode");
      const payloadKb = value(values, "payloadKb");
      const storageGb = value(values, "storageGb");
      if (![requestsPerSecond, requestsPerNode, payloadKb, storageGb].every((item) => Number.isFinite(item) && item >= 0)) return unavailable;
      if (requestsPerNode <= 0) return "Sustained capacity per node must be positive.";
      const requiredNodes = Math.ceil(requestsPerSecond / requestsPerNode);
      const dailyWriteGb = requestsPerSecond * payloadKb * 86400 / 1e6;
      const storageDays = dailyWriteGb === 0 ? Infinity : storageGb / dailyWriteGb;
      return [
        `Minimum node count: ${number(requiredNodes, 0)} nodes`,
        `Aggregate configured capacity: ${number(requiredNodes * requestsPerNode, 0)} requests/second`,
        `Estimated daily write volume: ${number(dailyWriteGb)} GB/day`,
        storageDays === Infinity
          ? "Local storage runway: unlimited for zero write volume"
          : `Local storage runway: ${number(storageDays)} days`,
        "Estimate ignores data compression, replicas, cache churn, retries, maintenance, and failover reserve.",
      ].join("\n");
    },
  },
  "devops": {
    title: "Reliability budget calculator",
    description:
      "Convert an availability target into an allowed downtime budget for a selected period.",
    fields: [
      numberField("availability", "Availability target (%)", "99.9", 0, 100, 0.001),
      numberField("periodDays", "Period (days)", "30", 1, undefined, 1),
    ],
    calculate: (values) => {
      const availability = value(values, "availability");
      const periodDays = value(values, "periodDays");
      if (![availability, periodDays].every((item) => Number.isFinite(item) && item >= 0)) return unavailable;
      if (availability > 100 || periodDays <= 0) return "Availability must be at most 100%, and period must be positive.";
      const minutes = periodDays * 24 * 60;
      const downtimeMinutes = minutes * (1 - availability / 100);
      const hours = downtimeMinutes / 60;
      return [
        `Period: ${number(periodDays, 0)} days`,
        `Availability target: ${number(availability)}%`,
        `Allowed downtime: ${number(downtimeMinutes)} minutes`,
        `Allowed downtime: ${number(hours)} hours`,
        "Use an explicit monitoring, service, and exclusion policy before turning this estimate into an operational objective.",
      ].join("\n");
    },
  },
  "saas-management": {
    title: "SaaS license cost planner",
    description:
      "Estimate monthly and annual subscription spend, including inactive licenses and growth.",
    fields: [
      numberField("licenses", "Paid licenses", "250"),
      numberField("price", "Monthly price per license ($)", "18", 0, undefined, 0.01),
      numberField("unused", "Unused or inactive licenses (%)", "8", 0, 100, 0.1),
      numberField("growth", "Expected annual growth (%)", "10", 0, undefined, 0.1),
    ],
    calculate: (values) => {
      const licenses = value(values, "licenses");
      const price = value(values, "price");
      const unused = value(values, "unused");
      const growth = value(values, "growth");
      if (![licenses, price, unused, growth].every((item) => Number.isFinite(item) && item >= 0)) return unavailable;
      if (unused > 100) return "Unused or inactive licenses must be at most 100%.";
      const waste = licenses * unused / 100;
      const currentMonthly = licenses * price;
      const recoverableWaste = waste * price;
      const nextYearMonthly = licenses * (1 + growth / 100) * price;
      return [
        `Estimated inactive licenses: ${number(waste)} of ${number(licenses, 0)}`,
        `Current monthly spend: ${usd(currentMonthly)}`,
        `Potential monthly inactive-license waste: ${usd(recoverableWaste)}`,
        `Next-year monthly spend estimate: ${usd(nextYearMonthly)}`,
        `Next-year annual spend estimate: ${usd(nextYearMonthly * 12)}`,
      ].join("\n");
    },
  },
  "telecommunications": {
    title: "Wireless link budget planner",
    description:
      "Estimate theoretical link capacity from bandwidth and signal quality.",
    fields: [
      numberField("bandwidth", "Channel bandwidth (MHz)", "20", 0.1, undefined, 0.1),
      numberField("spectralEfficiency", "Spectral efficiency (bits/Hz/s)", "3", 0.1, undefined, 0.1),
      numberField("sectorLoad", "Target sector load (%)", "70", 1, 100, 0.1),
    ],
    calculate: (values) => {
      const bandwidth = value(values, "bandwidth");
      const spectralEfficiency = value(values, "spectralEfficiency");
      const sectorLoad = value(values, "sectorLoad");
      if (![bandwidth, spectralEfficiency, sectorLoad].every((item) => Number.isFinite(item) && item > 0)) return unavailable;
      if (sectorLoad > 100) return "Target sector load must be at most 100%.";
      const theoreticalMbps = bandwidth * spectralEfficiency;
      const plannedMbps = theoreticalMbps * sectorLoad / 100;
      return [
        `Theoretical sector capacity: ${number(theoreticalMbps)} Mbps`,
        `Capacity at ${number(sectorLoad)}% load: ${number(plannedMbps)} Mbps`,
        `Load reserve: ${number(theoreticalMbps - plannedMbps)} Mbps`,
        "Estimate applies Shannon-style proportional capacity, not a carrier-specific maximum; timing, modulation, coding, interference, and overhead determine real throughput.",
      ].join("\n");
    },
  },
};

function initialValues(fields: Field[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((values, field) => {
    values[field.id] = field.initialValue;
    return values;
  }, {});
}

export default function ModuleWorkbench({
  module,
}: {
  module: TechnologyModule;
}) {
  const tool = tools[module.id];
  const [values, setValues] = useState<Record<string, string>>(() =>
    tool ? initialValues(tool.fields) : {},
  );
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [projectTitle, setProjectTitle] = useState(`${module.shortName} project`);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored: unknown = JSON.parse(
        window.localStorage.getItem(projectStorageKey) ?? "[]",
      );
      return Array.isArray(stored)
        ? (stored as SavedProject[]).filter(
            (project) => project.moduleId === module.id,
          )
        : [];
    } catch {
      return [];
    }
  });

  if (!tool) return null;

  const runTool = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(tool.calculate(values, checks));
    setError("");
    setNotice("");
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      setError("Could not copy the result. Check clipboard permissions and try again.");
      setNotice("");
      return;
    }
    setError("");
    setNotice("Result copied to the clipboard.");
  };

  const resetTool = () => {
    setValues(initialValues(tool.fields));
    setChecks({});
    setResult("");
    setError("");
    setNotice("");
  };

  const readAllProjects = (): SavedProject[] => {
    try {
      const stored: unknown = JSON.parse(
        window.localStorage.getItem(projectStorageKey) ?? "[]",
      );
      return Array.isArray(stored) ? (stored as SavedProject[]) : [];
    } catch {
      return [];
    }
  };

  const saveProject = () => {
    if (!result.trim()) {
      setError("Run the tool once before saving a project.");
      setNotice("");
      return;
    }
    const title = projectTitle.trim();
    if (!title) {
      setError("Add a project name before saving.");
      setNotice("");
      return;
    }
    const project: SavedProject = {
      id: crypto.randomUUID(),
      title,
      moduleId: module.id,
      moduleName: module.name,
      toolTitle: tool.title,
      values,
      checks,
      result,
      savedAt: new Date().toISOString(),
    };
    try {
      const next = [project, ...readAllProjects()].slice(0, 100);
      window.localStorage.setItem(projectStorageKey, JSON.stringify(next));
      setSavedProjects(next.filter((item) => item.moduleId === module.id));
      setError("");
      setNotice("Project saved in this browser.");
    } catch {
      setError("Could not save the project. Browser storage may be unavailable.");
      setNotice("");
    }
  };

  const loadProject = (project: SavedProject) => {
    setProjectTitle(project.title);
    setValues(project.values);
    setChecks(project.checks);
    setResult(project.result);
    setError("");
    setNotice(`Loaded “${project.title}”.`);
  };

  const deleteProject = (projectId: string) => {
    try {
      const next = readAllProjects().filter((project) => project.id !== projectId);
      window.localStorage.setItem(projectStorageKey, JSON.stringify(next));
      setSavedProjects(next.filter((project) => project.moduleId === module.id));
      setNotice("Saved project deleted.");
      setError("");
    } catch {
      setError("Could not delete the saved project.");
      setNotice("");
    }
  };

  const exportProject = () => {
    if (!result.trim()) {
      setError("Run the tool once before exporting.");
      setNotice("");
      return;
    }
    const content = [
      `OMNIVERSE AI — ${module.name}`,
      `Project: ${projectTitle.trim() || "Untitled project"}`,
      `Tool: ${tool.title}`,
      "",
      "INPUTS",
      ...tool.fields.map((field) => `${field.label}: ${values[field.id] ?? ""}`),
      "",
      "RESULT",
      result,
      "",
      "Note: Browser-local estimate or planning output. Verify domain-specific constraints before use.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${module.id}-${projectTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setError("");
    setNotice("Project exported as a text report.");
  };

  return (
    <section className="module-workbench" aria-labelledby="module-workbench-title">
      <div className="module-workbench-heading">
        <div>
          <span className="panel-eyebrow">
            STAGE {String(module.stage).padStart(2, "0")} · {module.name.toUpperCase()}
          </span>
          <h3 id="module-workbench-title">{tool.title}</h3>
          <p>{tool.description}</p>
        </div>
        <Sparkles size={18} aria-hidden="true" />
      </div>

      {error && <p className="developer-feedback developer-feedback-error" role="alert">{error}</p>}
      {notice && <p className="developer-feedback developer-feedback-success" role="status">{notice}</p>}

      <form className="module-tool-form" onSubmit={runTool}>
        <div className="module-tool-fields">
          {tool.fields.map((field) => (
            <label
              className={field.type === "textarea" ? "module-tool-field-wide" : ""}
              key={field.id}
            >
              {field.label}
              {field.type === "textarea" ? (
                <textarea
                  required={field.required ?? true}
                  value={values[field.id]}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.id]: event.target.value }))
                  }
                />
              ) : (
                <input
                  required={field.required ?? true}
                  type={field.type ?? "text"}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={values[field.id]}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.id]: event.target.value }))
                  }
                />
              )}
            </label>
          ))}
        </div>

        {tool.checklist && (
          <fieldset className="module-tool-checklist">
            <legend>Response steps</legend>
            {tool.checklist.map((task) => (
              <label key={task.id}>
                <input
                  type="checkbox"
                  checked={checks[task.id] ?? false}
                  onChange={(event) =>
                    setChecks((current) => ({ ...current, [task.id]: event.target.checked }))
                  }
                />
                <span>{task.label}</span>
              </label>
            ))}
          </fieldset>
        )}

        <div className="module-tool-actions">
          <button className="asset-primary-button">
            <Sparkles size={14} aria-hidden="true" />
            Run tool
          </button>
          <button className="asset-text-button" type="button" onClick={resetTool}>
            <RotateCcw size={13} aria-hidden="true" />
            Reset
          </button>
        </div>
      </form>

      <div className="module-project-controls">
        <label>
          Project name
          <input
            value={projectTitle}
            maxLength={100}
            onChange={(event) => setProjectTitle(event.target.value)}
          />
        </label>
        <button type="button" className="asset-text-button" onClick={saveProject}>
          <Save size={13} aria-hidden="true" />
          Save project
        </button>
        <button type="button" className="asset-text-button" onClick={exportProject}>
          <Download size={13} aria-hidden="true" />
          Export report
        </button>
      </div>

      {savedProjects.length > 0 && (
        <div className="module-saved-projects" aria-label="Saved projects">
          <strong>Saved projects</strong>
          {savedProjects.map((project) => (
            <div className="module-saved-project" key={project.id}>
              <button type="button" onClick={() => loadProject(project)}>
                <span>{project.title}</span>
                <small>{new Date(project.savedAt).toLocaleString()}</small>
              </button>
              <button
                type="button"
                aria-label={`Delete ${project.title}`}
                onClick={() => deleteProject(project.id)}
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="module-tool-result" aria-live="polite">
          <div className="module-tool-result-heading">
            <strong>Result</strong>
            <button type="button" onClick={() => void copyResult()}>
              <Clipboard size={13} aria-hidden="true" />
              Copy result
            </button>
          </div>
          <pre><code>{result}</code></pre>
        </div>
      )}
    </section>
  );
}
