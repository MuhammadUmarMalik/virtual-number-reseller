import { notFound } from "next/navigation";
import { DesignSystemReview } from "@/components/design-system-review";

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DesignSystemReview />;
}
