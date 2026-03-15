import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardSummary } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="蝴蝶收藏总览"
        description="集中查看收藏进度、最近记录、图片上传情况和待处理目标种。"
        action={
          <Link href="/records" className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink">
            去录入新记录
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="总物种数" value={summary.totalSpecies} hint="系统当前已建物种名录" />
        <StatCard label="已收集数" value={summary.collectedCount} hint="至少有一条 confirmed 记录" />
        <StatCard label="未收集数" value={summary.uncollectedCount} hint="尚无正式确认记录的物种" />
        <StatCard label="完成率" value={`${summary.completionRate}%`} hint="已收集 / 名录总数" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <SectionCard title="近期动态" description="最近新增记录和最近上传图片">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-ink">最近新增记录</h4>
              {summary.recentRecords.map((record) => (
                <div key={record.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-ink">{record.species.chineseName}</p>
                    <StatusBadge
                      text={record.status === "confirmed" ? "已确认" : record.status === "pending_identification" ? "待鉴定" : "观察"}
                      tone={record.status === "confirmed" ? "success" : "warn"}
                    />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {record.region.name} · {record.locationDetail}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(record.observedAt)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-ink">最近上传图片</h4>
              <div className="grid grid-cols-2 gap-3">
                {summary.recentImages.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-2xl bg-slate-50">
                    <img src={`/api/uploads/${image.fileName}`} alt={image.title ?? image.originalName} className="h-32 w-full object-cover" />
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-medium text-ink">{image.species?.chineseName ?? "未绑定物种"}</p>
                      <p className="truncate text-xs text-slate-500">{image.title ?? image.originalName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="重点关注" description="目标种、待鉴定与资源概况">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="目标种数量" value={summary.targetCount} hint="手动标记为目标种" />
              <StatCard label="待鉴定数量" value={summary.pendingCount} hint="物种状态中标记待鉴定" />
            </div>
            <ProgressBar value={summary.completionRate} label="整体收集进度" />
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="收集记录数" value={summary.totalRecords} hint="包含观察与待鉴定记录" />
              <StatCard label="图片总数" value={summary.totalImages} hint="本地 uploads 中已登记图片" />
            </div>
          </div>
        </SectionCard>
      </section>
    </>
  );
}
