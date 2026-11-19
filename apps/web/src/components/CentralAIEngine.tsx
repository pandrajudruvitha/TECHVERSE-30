"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BrainCircuit, Send } from "lucide-react";

type AIStatus = {
  configured: boolean;
  model: string;
};

type AIResult = {
  message: string;
  model: string;
  provider: string;
};

type OmniTask = {
  id: string;
  prompt: string;
  route: string;
  status: "pending_approval" | "approved" | "completed" | "failed";
  result?: string;
  createdAt: string;
};

const omniTaskStorageKey = "omniverse-ai:omni-tasks";

function routePrompt(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("industry") || normalized.includes("healthcare") ||
    normalized.includes("finance") || normalized.includes("education")) {
    return "Industry Workspace";
  }
  if (normalized.includes("security") || normalized.includes("incident")) {
    return "Security Operations";
  }
  if (normalized.includes("data") || normalized.includes("database")) {
    return "Data & Intelligence";
  }
  return "Technology Workspace";
}

export default function CentralAIEngine() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [prompt, setPrompt] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a concise, accurate technology assistant.",
  );
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<OmniTask[]>([]);

  useEffect(() => {
    let saved: OmniTask[] = [];
    try {
      saved = JSON.parse(
        window.localStorage.getItem(omniTaskStorageKey) ?? "[]",
      ) as OmniTask[];
    } catch {
      saved = [];
    }
    const timer = window.setTimeout(() => setTasks(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const saveTasks = (next: OmniTask[]) => {
    setTasks(next);
    window.localStorage.setItem(omniTaskStorageKey, JSON.stringify(next));
  };

  useEffect(() => {
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");

    void fetch(`${baseUrl}/ai/status`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("AI status unavailable");
        const nextStatus = (await response.json()) as AIStatus;
        setStatus(nextStatus);
        setDemoMode(!nextStatus.configured);
      })
      .catch(() => {
        setStatus({ configured: false, model: "not configured" });
        setDemoMode(true);
      });
  }, []);

  const submitPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = prompt.trim();
    if (!message) {
      setError("Enter a prompt before sending.");
      return;
    }

    const task: OmniTask = {
      id: crypto.randomUUID(),
      prompt: message,
      route: routePrompt(message),
      status: "pending_approval",
      createdAt: new Date().toISOString(),
    };
    saveTasks([task, ...tasks].slice(0, 12));
    setPrompt("");
    setError("");
    setResult(null);
  };

  const runTask = async (task: OmniTask) => {
    setLoading(true);
    setError("");
    saveTasks(tasks.map((item) =>
      item.id === task.id ? { ...item, status: "approved" } : item,
    ));

    if (demoMode || status?.configured === false) {
      setTimeout(() => {
        const message =
          `Local OMNI route: ${task.route}\n\n` +
          "1. Clarify the objective and expected output.\n" +
          "2. Identify relevant inputs, constraints, and responsible owners.\n" +
          "3. Execute a bounded first pass with measurable checkpoints.\n" +
          "4. Review risks, assumptions, and next actions.\n\n" +
          `Task: ${task.prompt}`;
        setResult({ message, model: "OMNI local demo", provider: "Browser-local" });
        saveTasks(tasks.map((item) =>
          item.id === task.id
            ? { ...item, status: "completed", result: message }
            : item,
        ));
        setLoading(false);
      }, 350);
      return;
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");

    try {
      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: task.prompt,
          system_prompt: systemPrompt.trim() ||
            "You are a concise, accurate technology assistant.",
        }),
      });
      const payload = (await response.json()) as AIResult & { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "The AI request failed.");
      }
      setResult(payload);
      saveTasks(tasks.map((item) =>
        item.id === task.id
          ? { ...item, status: "completed", result: payload.message }
          : item,
      ));
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : "The AI request failed.";
      setError(message);
      saveTasks(tasks.map((item) =>
        item.id === task.id
          ? { ...item, status: "failed", result: message }
          : item,
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-engine-panel" id="ai-engine" aria-labelledby="ai-engine-title">
      <div className="ai-engine-heading">
        <span className="panel-eyebrow">STAGE 07 · CENTRAL AI ENGINE</span>
        <div>
          <span className="ai-engine-icon"><BrainCircuit size={20} aria-hidden="true" /></span>
          <h2 id="ai-engine-title">AI orchestration</h2>
        </div>
        <p>
          Route prompts through the provider or use the browser-local demo. API keys remain in backend configuration.
        </p>
      </div>

      <div className="ai-engine-status">
        <span className={status?.configured ? "ai-status-ready" : "ai-status-offline"}>
          {status?.configured ? "Configured" : "Not configured"}
        </span>
        <span>{status?.model ?? "Checking provider..."}</span>
      </div>

      <form className="ai-engine-form" onSubmit={submitPrompt}>
        <label>
          Execution mode
          <select
            value={demoMode ? "demo" : "provider"}
            onChange={(event) => setDemoMode(event.target.value === "demo")}
          >
            <option value="provider" disabled={!status?.configured}>
              Provider
            </option>
            <option value="demo">Local OMNI demo</option>
          </select>
        </label>
        <label>
          System prompt
          <textarea
            value={systemPrompt}
            maxLength={2000}
            onChange={(event) => setSystemPrompt(event.target.value)}
          />
        </label>
        <label>
          Prompt
          <textarea
            value={prompt}
            maxLength={8000}
            placeholder="Ask for an architecture, implementation plan, or technical explanation..."
            onChange={(event) => setPrompt(event.target.value)}
          />
        </label>
        <button className="asset-primary-button" disabled={loading}>
          <Send size={14} aria-hidden="true" />
          Create approval task
        </button>
      </form>

      {error && <p className="developer-feedback developer-feedback-error" role="alert">{error}</p>}
      {tasks.length > 0 && (
        <article className="omni-task-panel" aria-label="OMNI task tracking">
          <div className="omni-task-heading">
            <span className="panel-eyebrow">TASK TRACKING</span>
            <button
              type="button"
              className="asset-text-button"
              onClick={() => saveTasks([])}
            >
              Clear history
            </button>
          </div>
          <div className="omni-task-list">
            {tasks.map((task) => (
              <div className="omni-task-row" key={task.id}>
                <div>
                  <strong>{task.route}</strong>
                  <span>{task.prompt}</span>
                </div>
                <span className={`omni-task-status omni-task-status-${task.status}`}>
                  {task.status.replace("_", " ")}
                </span>
                {task.status === "pending_approval" && (
                  <button
                    type="button"
                    className="asset-primary-button"
                    onClick={() => void runTask(task)}
                    disabled={loading}
                  >
                    Approve & run
                  </button>
                )}
              </div>
            ))}
          </div>
        </article>
      )}
      {result && (
        <article className="ai-engine-result" aria-live="polite">
          <div>
            <strong>Assistant</strong>
            <span>{result.provider} · {result.model}</span>
          </div>
          <p>{result.message}</p>
        </article>
      )}
    </section>
  );
}
