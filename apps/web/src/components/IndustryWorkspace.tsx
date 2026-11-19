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

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subindustries;
    return subindustries.filter((item) =>
      item.toLowerCase().includes(query),
    );
  }, [search, subindustries]);

  const frontier = industry.id === "future-frontier-innovation";

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
                  onClick={() => setSelected(item)}
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
                ? `${selected} is cataloged within ${industry.name}. Dedicated tools are planned for a later implementation stage.`
                : "Select a subindustry to add it to your current workspace context."}
            </p>
            {selected && (
              <button type="button" onClick={() => setSelected(null)}>
                Clear selection
              </button>
            )}
          </article>

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
