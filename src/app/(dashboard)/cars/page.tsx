import { PageHeader } from "@/components/layout/PageHeader";
import { CarsSection } from "@/components/cars/CarsSection";

export default function CarsPage() {
  return (
    <>
      <PageHeader
        title="Cars"
        description="Manage the car lineup the website displays."
      />
      <CarsSection />
    </>
  );
}
