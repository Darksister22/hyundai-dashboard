import { PageHeader } from "@/components/layout/PageHeader";
import { BannersManager } from "@/components/banners/BannersManager";

export default function HeroBannersPage() {
  return (
    <>
      <PageHeader
        title="Hero banners"
        description="Banner cards for the website's hero area, each optionally linked to a car."
      />
      <BannersManager />
    </>
  );
}
