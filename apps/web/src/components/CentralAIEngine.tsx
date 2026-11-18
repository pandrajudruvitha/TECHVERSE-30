"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BrainCircuit, Send, Sparkles } from "lucide-react";

type AIStatus = {
  configured: boolean;
  model: string;
};

type AIResult = {
  message: string;
  model: string;
  provider: string;
};

export default function CentralAIEngine() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a concise, accurate technology assistant.",
  );
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");

    void fetch(`${baseUrl}/ai/status`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("AI status unavailable");
        setStatus((await response.json()) as AIStatus);
      })
      .catch(() => setStatus({ configured: false, model: "not configured" }));
  }, []);

  const submitPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = prompt.trim();
    if (!message) {
      setError("Enter a prompt before sending.");
      return;
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          system_prompt: systemPrompt.trim() ||
            "You are a concise, accurate technology assistant.",
        }),
      });
      const payload = (await response.json()) as AIResult & { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "The AI request failed.");
      }
      setResult(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The AI request failed.",
      );
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
          Send prompts through the server-side provider integration. API keys remain in backend configuration.
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
          {loading ? <Sparkles size={14} aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
          {loading ? "Generating..." : "Send to AI"}
        </button>
      </form>

      {error && <p className="developer-feedback developer-feedback-error" role="alert">{error}</p>}
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
