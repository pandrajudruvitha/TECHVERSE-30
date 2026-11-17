"use client";

import { useState, type FormEvent } from "react";
import { Clipboard, RotateCcw, Sparkles } from "lucide-react";
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

  return (
    <section className="module-workbench" aria-labelledby="module-workbench-title">
      <div className="module-workbench-heading">
        <div>
          <span className="panel-eyebrow">STAGE 05 · {module.name.toUpperCase()}</span>
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
