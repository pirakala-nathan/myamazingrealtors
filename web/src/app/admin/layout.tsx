import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Admin keeps the light theme whatever the visitor picked for the site.
  return (
    <div data-theme="light" className="bg-mist-100 text-ink">
      <div className="container-site py-12 md:py-16">{children}</div>
    </div>
  );
}
