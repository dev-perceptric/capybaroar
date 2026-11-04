import { Loading } from "@/components/ui";

// Shows the moment a tab is clicked, while the page loads: the header bar's place, then soft rows.
export default function AppLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-[52px] shrink-0 items-center gap-2 border-b border-line bg-panel px-4">
        <span className="bone size-4 rounded-xs" />
        <span className="bone h-3 w-28" />
      </div>
      <div className="mx-auto w-full max-w-[960px] md:p-2">
        <Loading />
      </div>
    </div>
  );
}
