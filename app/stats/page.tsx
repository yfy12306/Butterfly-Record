import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { SectionCard } from "@/components/section-card";
import { getStatsData } from "@/lib/queries";

export default async function StatsPage() {
  const stats = await getStatsData();

  return (
    <>
      <PageHeader
        eyebrow="Statistics"
        title="统计可视化"
        description="展示地区完成率、按科完成度、最近新增趋势和目标种推进情况。"
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="全国 / 省 / 市完成率" description="按地区统计名录总数与已收集数">
          <div className="space-y-4">
            {stats.byRegion.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium text-ink">
                    {item.name}
                    <span className="ml-2 text-xs text-slate-500">{item.level}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.collected} / {item.total}
                  </p>
                </div>
                <ProgressBar value={item.rate} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="按科统计完成度" description="观察不同科的收集覆盖差异">
          <div className="space-y-4">
            {stats.byFamily.map((item) => (
              <div key={item.family} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium text-ink">{item.family}</p>
                  <p className="text-sm text-slate-500">
                    {item.collected} / {item.total}
                  </p>
                </div>
                <ProgressBar value={item.rate} />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="最近新增趋势" description="按日期汇总新增记录量">
          <div className="space-y-3">
            {stats.trend.map((item) => (
              <div key={item.date} className="grid grid-cols-[120px_1fr_60px] items-center gap-3">
                <p className="text-sm text-slate-600">{item.date}</p>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-ember" style={{ width: `${Math.min(item.count * 30, 100)}%` }} />
                </div>
                <p className="text-right text-sm text-slate-600">{item.count}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="目标种完成进度" description="仅统计手动标记为目标种的物种">
          <div className="rounded-3xl bg-slate-50 p-6">
            <p className="text-sm text-slate-500">已完成目标种</p>
            <p className="mt-2 text-4xl font-semibold text-ink">
              {stats.target.completed} / {stats.target.total}
            </p>
            <div className="mt-6">
              <ProgressBar value={stats.target.rate} />
            </div>
          </div>
        </SectionCard>
      </section>
    </>
  );
}
