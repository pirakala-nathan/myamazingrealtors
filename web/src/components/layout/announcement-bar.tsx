import Link from "next/link";

export function AnnouncementBar() {
  return (
    <Link
      href="/home-evaluation"
      className="block bg-navy-900 px-4 py-3 text-center text-sm text-on-dark hover:text-aqua-300"
    >
      Thinking of selling? Get a <strong className="text-aqua-400">free home evaluation</strong> from PK →
    </Link>
  );
}
