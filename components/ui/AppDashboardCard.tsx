interface AppDashboardCardProps {
  title: string;
  description: string;
}

export function AppDashboardCard({ title, description }: AppDashboardCardProps) {
  return (
    <article className="rounded-2xl border border-[#d6e8f6] bg-white p-5">
      <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-xl font-bold text-[#003F60]">{title}</h2>
      <p className="mt-2 text-sm text-[#2b5876]">{description}</p>
    </article>
  );
}
