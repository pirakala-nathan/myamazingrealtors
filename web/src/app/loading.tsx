import { HouseLoader } from "@/components/ui/house-loader";

/** Shown while a page is still loading after a click (header and footer stay in place). */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <HouseLoader size="lg" />
    </div>
  );
}
