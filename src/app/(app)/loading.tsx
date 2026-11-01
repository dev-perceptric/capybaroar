import { Loading } from "@/components/ui";

// Shows the moment a tab is clicked, while the page loads.
export default function AppLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <Loading />
    </div>
  );
}
