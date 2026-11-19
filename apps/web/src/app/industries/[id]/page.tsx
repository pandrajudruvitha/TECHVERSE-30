import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  industryModules,
  subindustryCatalog,
} from "@/data/industries";
import IndustryWorkspace from "@/components/IndustryWorkspace";

type IndustryPageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export function generateStaticParams() {
  return industryModules.map((industry) => ({ id: industry.id }));
}

export async function generateMetadata({
  params,
}: IndustryPageProps): Promise<Metadata> {
  const { id } = await params;
  const industry = industryModules.find((item) => item.id === id);
  if (!industry) return { title: "Industry Not Found | OMNIVERSE AI" };
  return {
    title: `${industry.name} | OMNIVERSE AI`,
    description: industry.description,
  };
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { id } = await params;
  const industry = industryModules.find((item) => item.id === id);
  if (!industry) notFound();

  const subindustries = subindustryCatalog[industry.id] ?? [];
  const related = industryModules
    .filter((item) => item.id !== industry.id)
    .filter((item) =>
      item.tags.some((tag) =>
        industry.tags.some(
          (industryTag) =>
            industryTag.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(industryTag.toLowerCase()),
        ),
      ),
    )
    .slice(0, 4);

  return (
    <main className="industry-page">
      <header className="industry-page-header">
        <Link href="/#industry-library" className="industry-back-link">
          ← Back to the industry universe
        </Link>
        <nav className="industry-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">OMNIVERSE AI</Link>
          <span>/</span>
          <Link href="/#industry-library">Industries</Link>
          <span>/</span>
          <strong>{industry.shortName}</strong>
        </nav>
      </header>

      <section className="industry-page-hero">
        <div>
          <span className="panel-eyebrow">GLOBAL INDUSTRY UNIVERSE · 20</span>
          <h1>{industry.name}</h1>
          <p>{industry.description}</p>
        </div>
        <div className="industry-page-count">
          <strong>{subindustries.length}</strong>
          <span>{industry.id === "future-frontier-innovation" ? "Maturity groups" : "Subindustries"}</span>
        </div>
      </section>

      <IndustryWorkspace
        industry={industry}
        subindustries={subindustries}
        related={related}
      />
    </main>
  );
}
