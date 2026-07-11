import { PageHeader } from "@/components/layout/PageHeader";
import { ContactSection } from "@/components/contact/ContactSection";

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact"
        description="Submissions from the website's contact form."
      />
      <ContactSection />
    </>
  );
}
