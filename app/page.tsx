import { defaultLocale } from "@/lib/i18n";
import { HomePageShell } from "@/components/marketing/HomePageShell";

export default function Home() {
  return <HomePageShell initialLocale={defaultLocale} />;
}
