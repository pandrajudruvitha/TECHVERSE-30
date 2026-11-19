"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { IndustryModule } from "@/data/industries";

type IndustryWorkspaceProps = {
  industry: IndustryModule;
  subindustries: string[];
  related: IndustryModule[];
};

export default function IndustryWorkspace({
  industry,
  subindustries,
  related,
}: IndustryWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState("Education");
  const [plan, setPlan] = useState<string[]>([]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subindustries;
    return subindustries.filter((item) =>
      item.toLowerCase().includes(query),
    );
  }, [search, subindustries]);

  const frontier = industry.id === "future-frontier-innovation";

  const createPlan = () => {
    if (!selected) return;

    const plans: Record<string, string[]> = {
      Education: [
        `Map learners and roles involved in ${selected}.`,
        "Define three measurable learning outcomes.",
        "Prepare a fundamentals, applied practice, and review sequence.",
        "Add an assessment and knowledge-retention checkpoint.",
      ],
      Administrative: [
        `Identify the owner and approver for ${selected}.`,
        "Document required inputs, controls, and responsible teams.",
        "Create a review cadence and escalation route.",
        "Record outputs and exceptions for audit-ready follow-up.",
      ],
      Simulation: [
        `Define a bounded scenario for ${selected}.`,
        "State assumptions and explicitly exclude real-world guarantees.",
        "Test normal, constrained, and failure conditions.",
        "Review results with uncertainty and maturity labels.",
      ],
      Integration: [
        `Define the ${selected} system boundary.`,
        "Map source, transformation, destination, and validation steps.",
        "Specify retry, approval, logging, and failure behavior.",
        "Validate the workflow in a controlled environment.",
      ],
    };

    setPlan(plans[mode] ?? plans.Education);
  };

  return (
    <>
      {frontier && (
        <div className="industry-disclaimer" role="note">
          <strong>Maturity-labelled research catalog</strong>
          <span>
            Commercial availability, active research, prototypes, theory, and
            speculative concepts are separate categories. Simulations do not
            represent functioning real-world capabilities.
          </span>
        </div>
      )}

      <section className="industry-workspace-grid">
        <article className="industry-subindustry-panel">
          <div className="industry-section-heading">
            <div>
              <span className="panel-eyebrow">OFFICIAL CATALOG</span>
              <h2>Subindustries</h2>
            </div>
            <label className="industry-search">
              <Search size={15} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter subindustries"
                aria-label="Filter subindustries"
              />
            </label>
          </div>

          {visible.length > 0 ? (
            <div className="subindustry-grid">
              {visible.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={selected === item ? "subindustry-card-active" : ""}
                  onClick={() => {
                    setSelected(item);
                    setPlan([]);
                  }}
                  aria-pressed={selected === item}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <Search size={18} />
              <span>No subindustries match “{search}”.</span>
              <button type="button" onClick={() => setSearch("")}>
                Clear filter
              </button>
            </div>
          )}
        </article>

        <aside className="industry-workspace-side">
          <article className="industry-context-panel">
            <span className="panel-eyebrow">WORKSPACE</span>
            <h2>{selected ?? "Explore this industry"}</h2>
            <p>
              {selected
                ? `${selected} is cataloged within ${industry.name}. Choose a mode to generate a browser-local working plan.`
                : "Select a subindustry to add it to your current workspace context."}
            </p>
            {selected && (
              <div className="industry-mode-grid" aria-label="Workspace mode">
                {["Education", "Administrative", "Simulation", "Integration"].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      className={mode === item ? "industry-mode-active" : ""}
                      onClick={() => {
                        setMode(item);
                        setPlan([]);
                      }}
                      aria-pressed={mode === item}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            )}
            {selected && (
              <div className="industry-action-row">
                <button type="button" onClick={createPlan}>
                  Generate plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setPlan([]);
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </article>

          {plan.length > 0 && (
            <article className="industry-context-panel industry-plan-panel">
              <span className="panel-eyebrow">{mode.toUpperCase()} PLAN</span>
              <h2>{selected}</h2>
              <ol>
                {plan.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>
          )}

          <article className="industry-context-panel">
            <span className="panel-eyebrow">RELATED UNIVERSES</span>
            {related.length > 0 ? (
              <div className="related-industry-links">
                {related.map((item) => (
                  <Link key={item.id} href={`/industries/${item.id}`}>
                    {item.shortName}
                  </Link>
                ))}
              </div>
            ) : (
              <p>No strongly related universe was identified.</p>
            )}
          </article>
        </aside>
      </section>
    </>
  );
}
