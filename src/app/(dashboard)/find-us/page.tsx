import { PageHeader } from "@/components/layout/PageHeader";
import { FindUsManager } from "@/components/findus/FindUsManager";

export default function FindUsPage() {
  return (
    <>
      <PageHeader
        title="Find us"
        description="Showroom and dealer locations across Iraq."
      />
      <FindUsManager />
    </>
  );
}
