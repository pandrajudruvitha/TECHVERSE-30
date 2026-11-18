"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Play, RotateCcw, Save, Workflow } from "lucide-react";

type IntegrationStatus = {
  api: string;
  ai_configured: boolean;
  ai_model: string;
  assets: string;
  module_workbenches: string;
};

type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  steps: string[];
};

const templates: WorkflowTemplate[] = [
  {
    id: "ai-architecture",
    name: "AI architecture brief",
    description: "Validate the platform, collect context, and send it to the central AI engine.",
    steps: ["Check integration status", "Send architecture prompt", "Store run summary"],
  },
  {
    id: "module-estimate",
    name: "Technology estimate package",
    description: "Bundle a module estimate with a status snapshot and review-ready summary.",
    steps: ["Select module context", "Capture estimate inputs", "Generate handoff report"],
  },
  {
    id: "asset-readiness",
    name: "Asset readiness check",
    description: "Verify authenticated asset access and create a local operations checklist.",
    steps: ["Check API readiness", "Verify asset service", "Create readiness report"],
  },
];

export default function IntegrationWorkbench() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");
    void fetch(`${baseUrl}/integrations/status`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Integration status unavailable");
        setStatus((await response.json()) as IntegrationStatus);
      })
      .catch(() =>
        setStatus({
          api: "offline",
          ai_configured: false,
          ai_model: "not configured",
          assets: "unknown",
          module_workbenches: "browser-local",
        }),
      );
  }, []);

  const template = templates.find((item) => item.id === templateId) ?? templates[0];

  const runWorkflow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedContext = context.trim() || "No additional context provided.";
    const lines = [
      `WORKFLOW: ${template.name}`,
      `CONTEXT: ${normalizedContext}`,
      "",
      ...template.steps.map((step, index) => `${index + 1}. ${step} — ready`),
      "",
      `API: ${status?.api ?? "checking"}`,
      `AI: ${status?.ai_configured ? `configured (${status.ai_model})` : "not configured"}`,
      `Assets: ${status?.assets ?? "checking"}`,
      `Module workbenches: ${status?.module_workbenches ?? "browser-local"}`,
    ];
    setResult(lines.join("\n"));
    setMessage("Workflow run completed locally.");
  };

  const saveWorkflow = () => {
    if (!result) {
      setMessage("Run the workflow before saving its output.");
      return;
    }
    window.localStorage.setItem(
      "techverse-workflow-run",
      JSON.stringify({
        templateId,
        context: context.trim(),
        result,
        savedAt: new Date().toISOString(),
      }),
    );
    setMessage("Workflow run saved in this browser.");
  };

  const resetWorkflow = () => {
    setTemplateId(templates[0].id);
    setContext("");
    setResult("");
    setMessage("");
  };

  return (
    <section className="integration-panel" id="integrations" aria-labelledby="integration-title">
      <div className="integration-heading">
        <div>
          <span className="panel-eyebrow">STAGE 08 · INTEGRATIONS AND AUTOMATION</span>
          <h2 id="integration-title">Workflow workbench</h2>
          <p>Connect platform capabilities into repeatable, browser-local run summaries.</p>
        </div>
        <span className="integration-icon"><Workflow size={20} aria-hidden="true" /></span>
      </div>

      <div className="integration-status-grid">
        <div><span>API</span><strong>{status?.api ?? "Checking"}</strong></div>
        <div><span>AI</span><strong>{status?.ai_configured ? "Configured" : "Not configured"}</strong></div>
        <div><span>Assets</span><strong>{status?.assets ?? "Checking"}</strong></div>
        <div><span>Tools</span><strong>{status?.module_workbenches ?? "Browser-local"}</strong></div>
      </div>

      <form className="integration-form" onSubmit={runWorkflow}>
        <label>
          Workflow template
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            {templates.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <p>{template.description}</p>
        <label className="integration-context">
          Run context
          <textarea
            value={context}
            maxLength={4000}
            placeholder="Add requirements, scope, or inputs for this workflow..."
            onChange={(event) => setContext(event.target.value)}
          />
        </label>
        <div className="integration-step-list">
          {template.steps.map((step, index) => (
            <span key={step}><i>{index + 1}</i>{step}</span>
          ))}
        </div>
        <div className="integration-actions">
          <button className="asset-primary-button" type="submit"><Play size={14} />Run workflow</button>
          <button className="asset-text-button" type="button" onClick={saveWorkflow}><Save size={13} />Save run</button>
          <button className="asset-text-button" type="button" onClick={resetWorkflow}><RotateCcw size={13} />Reset</button>
        </div>
      </form>

      {message && <p className="developer-feedback developer-feedback-success" role="status">{message}</p>}
      {result && (
        <pre className="integration-result"><code>{result}</code></pre>
      )}
    </section>
  );
}
