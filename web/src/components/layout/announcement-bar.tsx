import Link from "next/link";

export function AnnouncementBar() {
  return (
    <Link
      href="/market-reports"
      className="block bg-navy-900 px-4 py-3 text-center text-sm text-on-dark hover:text-aqua-300"
    >
      New: this month’s <strong className="text-aqua-400">Durham Market Report</strong> is out. Get it free →
    </Link>
  );
}
