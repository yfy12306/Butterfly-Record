import Link from "next/link";
import { RegionLevel } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { SectionCard } from "@/components/section-card";
import { prisma } from "@/lib/prisma";
import { getRegionOverview } from "@/lib/queries";
import { regionLevelLabel } from "@/lib/utils";

const levelOptions = [
  { value: RegionLevel.country, label: "全国" },
  { value: RegionLevel.province, label: "省级" },
  { value: RegionLevel.city, label: "市级" }
];

export default async function RegionsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const level = (typeof params.level === "string" ? params.level : RegionLevel.country) as RegionLevel;
  const parentId = typeof params.parentId === "string" ? params.parentId : undefined;
  const overview = await getRegionOverview(level, parentId);
  const regions = await prisma.region.findMany({ orderBy: [{ level: "asc" }, { name: "asc" }] });

  return (
    <>
      <PageHeader
        eyebrow="Regions"
        title="地区分布"
        description="支持全国、省、市三级查看地区名录、已收集数与完成率。"
      />

      <SectionCard title="切换层级" description="通过 level 和 parentId 实现三级切换">
        <form className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)_auto]">
          <select name="level" defaultValue={level} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            {levelOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select name="parentId" defaultValue={parentId} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="">无上级筛选</option>
            {regions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {regionLevelLabel(item.level)}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">切换视图</button>
        </form>
      </SectionCard>

      {overview.length === 0 ? (
        <EmptyState title="当前层级没有数据" description="切换层级或先导入地区分布数据。" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {overview.map((region) => {
            const collectedSpecies = region.distributions
              .filter((item) => item.species.records.some((record) => record.status === "confirmed"))
              .map((item) => item.species);
            const uncollectedSpecies = region.distributions
              .filter((item) => !item.species.records.some((record) => record.status === "confirmed"))
              .map((item) => item.species);

            return (
              <SectionCard
                key={region.id}
                title={region.name}
                description={`${regionLevelLabel(region.level)} · 名录 ${region.totalSpecies} 种，已收集 ${region.collectedSpecies} 种`}
              >
                <ProgressBar value={region.completionRate} />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-ink">已收集</p>
                    <div className="space-y-2">
                      {collectedSpecies.length === 0 ? (
                        <p className="text-sm text-slate-500">暂无已收集物种</p>
                      ) : (
                        collectedSpecies.map((species) => (
                          <Link key={species.id} href={`/species/${species.id}`} className="block rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {species.chineseName}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-ink">未收集</p>
                    <div className="space-y-2">
                      {uncollectedSpecies.length === 0 ? (
                        <p className="text-sm text-slate-500">已全部覆盖</p>
                      ) : (
                        uncollectedSpecies.map((species) => (
                          <Link key={species.id} href={`/species/${species.id}`} className="block rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
                            {species.chineseName}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </>
  );
}
