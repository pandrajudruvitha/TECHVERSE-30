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
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
