import { Homepage } from "@/components/homepage";
import { businessConfig } from "@/lib/business-config";

export default function Home() {
  return <Homepage config={businessConfig} />;
}
