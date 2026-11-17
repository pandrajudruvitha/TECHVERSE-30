export const moduleCategories = [
  "AI & intelligence",
  "Engineering",
  "Data",
  "Cloud & operations",
  "Security & governance",
  "Emerging & physical",
] as const;

export type ModuleCategory = (typeof moduleCategories)[number];

export type TechnologyModule = {
  id: string;
  name: string;
  shortName: string;
  category: ModuleCategory;
  icon: string;
  stage: number;
};

const entries: readonly [string, string, ModuleCategory, string][] = [
  ["Information Technology Management", "IT management", "Cloud & operations", "settings"],
  ["Software Development", "Software development", "Engineering", "code"],
  ["Artificial Intelligence", "Artificial intelligence", "AI & intelligence", "brain"],
  ["Generative AI", "Generative AI", "AI & intelligence", "sparkles"],
  ["Machine Learning", "Machine learning", "AI & intelligence", "chart"],
  ["Deep Learning", "Deep learning", "AI & intelligence", "layers"],
  ["Data Science", "Data science", "AI & intelligence", "flask"],
  ["Data Analytics", "Data analytics", "Data", "analytics"],
  ["Big Data", "Big data", "Data", "database"],
  ["Cloud Computing", "Cloud computing", "Cloud & operations", "cloud"],
  ["Cybersecurity", "Cybersecurity", "Security & governance", "shield"],
  ["Information Security", "Information security", "Security & governance", "lock"],
  ["Blockchain", "Blockchain", "Security & governance", "blocks"],
  ["Web Development", "Web development", "Engineering", "globe"],
  ["Mobile App Development", "Mobile apps", "Engineering", "mobile"],
  ["Game Development", "Game development", "Engineering", "game"],
  ["Internet of Things", "Internet of things", "Emerging & physical", "radio"],
  ["Robotics", "Robotics", "Emerging & physical", "robot"],
  ["Automation", "Automation", "Engineering", "workflow"],
  ["Quantum Computing", "Quantum computing", "Emerging & physical", "atom"],
  ["Computer Hardware", "Computer hardware", "Emerging & physical", "cpu"],
  ["Semiconductor Technology", "Semiconductors", "Emerging & physical", "chip"],
  ["Networking", "Networking", "Cloud & operations", "network"],
  ["Database Management", "Database management", "Data", "database"],
  ["IT Consulting", "IT consulting", "Security & governance", "briefcase"],
  ["AR/VR/XR", "AR / VR / XR", "Emerging & physical", "vr"],
  ["Edge Computing", "Edge computing", "Cloud & operations", "edge"],
  ["DevOps", "DevOps", "Cloud & operations", "devops"],
  ["SaaS Management", "SaaS management", "Security & governance", "layers"],
  ["Telecommunications", "Telecommunications", "Emerging & physical", "radio"],
];

export const technologyModules: TechnologyModule[] = entries.map(
  ([name, shortName, category, icon], index) => ({
    id: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, ""),
    name,
    shortName,
    category,
    icon,
    stage: index === 0 ? 4 : index <= 15 ? 5 : 6,
  }),
);

export const categoryColors: Record<ModuleCategory, string> = {
  "AI & intelligence": "#a78bfa",
  Engineering: "#61ddee",
  Data: "#78a7ff",
  "Cloud & operations": "#39c5ad",
  "Security & governance": "#f0ac68",
  "Emerging & physical": "#e479c5",
};

export const categoryCounts = moduleCategories.map((category) => ({
  category,
  count: technologyModules.filter((module) => module.category === category)
    .length,
}));
