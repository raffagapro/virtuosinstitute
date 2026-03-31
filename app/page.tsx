import { AppNavbar, AppFooter } from "@/components/layout";
import { getMarketingSections } from "@/components/marketing/sectionModules";

const homeSections = getMarketingSections();

export default function Home() {
  return (
    <>
      <AppNavbar />
      <main>
        {homeSections.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </main>
      <AppFooter />
    </>
  );
}
