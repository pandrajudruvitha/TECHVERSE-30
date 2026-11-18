"use client";

import { useEffect, useState } from "react";
import { Gauge, ShieldCheck } from "lucide-react";

type SecurityStatus = {
  security_headers: boolean;
  bearer_auth: boolean;
  cors_allowlist: boolean;
  request_limits: boolean;
  no_store_sensitive_routes: boolean;
};

export default function SecurityOptimizationPanel() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);

  useEffect(() => {
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");
    void fetch(`${baseUrl}/security/status`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Security status unavailable");
        setStatus((await response.json()) as SecurityStatus);
      })
      .catch(() => setStatus(null));
  }, []);

  const checks = [
    ["Security headers", status?.security_headers],
    ["Bearer authentication", status?.bearer_auth],
    ["CORS allowlist", status?.cors_allowlist],
    ["Request limits", status?.request_limits],
    ["Sensitive cache policy", status?.no_store_sensitive_routes],
  ];

  return (
    <section className="security-panel" id="security" aria-labelledby="security-title">
      <div className="security-heading">
        <div>
          <span className="panel-eyebrow">STAGE 09 · SECURITY, TESTING, AND OPTIMIZATION</span>
          <h2 id="security-title">Platform hardening</h2>
          <p>Security controls and response policies for the current local deployment.</p>
        </div>
        <span className="security-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
      </div>

      <div className="security-check-grid">
        {checks.map(([label, enabled]) => (
          <div key={String(label)}>
            <span className={enabled ? "security-check-ready" : "security-check-offline"}>
              {enabled ? "Enabled" : status ? "Review" : "Checking"}
            </span>
            <strong>{String(label)}</strong>
          </div>
        ))}
      </div>

      <div className="security-performance">
        <Gauge size={16} aria-hidden="true" />
        <span>
          <strong>Optimization baseline</strong>
          <small>Production build, API suite, lint, and cache-policy checks are recorded in repository automation.</small>
        </span>
      </div>
    </section>
  );
}
