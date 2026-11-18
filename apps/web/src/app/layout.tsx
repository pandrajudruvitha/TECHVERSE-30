import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMNIVERSE AI | Technology & Industry Intelligence",
  description:
    "Explore connected technology domains and industries in an intelligent, futuristic workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
