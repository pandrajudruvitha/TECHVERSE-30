"use client";

import { useEffect, useState } from "react";
import { Cloud, Container, Database, FileText } from "lucide-react";

type DeploymentStatus = {
  api: string;
  database_configured: boolean;
  jwt_configured: boolean;
  ai_configured: boolean;
  migrations: string;
};

export default function DeploymentDocumentationPanel() {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);

  useEffect(() => {
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");
    void fetch(`${baseUrl}/deployment/status`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Deployment status unavailable");
        setStatus((await response.json()) as DeploymentStatus);
      })
      .catch(() => setStatus(null));
  }, []);

  const items = [
    ["API service", status?.api ?? "Checking"],
    ["Database", status ? (status.database_configured ? "Configured" : "Required") : "Checking"],
    ["JWT secret", status ? (status.jwt_configured ? "Configured" : "Required") : "Checking"],
    ["AI provider", status ? (status.ai_configured ? "Configured" : "Optional") : "Checking"],
  ];

  return (
    <section className="deployment-panel" id="deployment" aria-labelledby="deployment-title">
      <div className="deployment-heading">
        <div>
          <span className="panel-eyebrow">STAGE 10 · DEPLOYMENT AND DOCUMENTATION</span>
          <h2 id="deployment-title">Production readiness</h2>
          <p>Containerized services, environment configuration, migrations, and operational checks.</p>
        </div>
        <span className="deployment-icon"><Cloud size={20} aria-hidden="true" /></span>
      </div>

      <div className="deployment-status-grid">
        {items.map(([label, value]) => (
          <div key={String(label)}>
            <span>{String(label)}</span>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </div>

      <div className="deployment-guides">
        <article>
          <Container size={16} aria-hidden="true" />
          <span><strong>Container stack</strong><small>PostgreSQL, Redis, FastAPI, and Next.js run under Docker Compose.</small></span>
        </article>
        <article>
          <Database size={16} aria-hidden="true" />
          <span><strong>Schema migrations</strong><small>The API container applies Alembic migrations before accepting traffic.</small></span>
        </article>
        <article>
          <FileText size={16} aria-hidden="true" />
          <span><strong>Runbook</strong><small>The README documents local setup, environment variables, checks, and release commands.</small></span>
        </article>
      </div>
    </section>
  );
}
