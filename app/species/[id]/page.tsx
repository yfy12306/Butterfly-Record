import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/empty-state";
import { ImageUploadForm } from "@/components/forms/image-upload-form";
import { SpeciesFlagsForm } from "@/components/forms/species-flags-form";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function SpeciesDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const species = await prisma.species.findUnique({
    where: { id },
    include: {
      aliases: true,
      distributions: { include: { region: true } },
      records: { include: { region: true }, orderBy: { observedAt: "desc" } },
      images: { orderBy: [{ isCover: "desc" }, { createdAt: "desc" }] },
      userStatus: true
    }
  });

  if (!species) notFound();

  const collected = species.records.some((record) => record.status === "confirmed");

  return (
    <>
      <PageHeader
        eyebrow="Species Detail"
        title={species.chineseName}
        description={`${species.scientificName} · ${species.family} / ${species.genus}`}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="基本信息" description="物种分类、备注、分布与个人收集状态">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">分类层级</p>
              <p className="mt-2 text-sm text-ink">目：{species.orderName ?? "鳞翅目"}</p>
              <p className="mt-1 text-sm text-ink">科：{species.family}</p>
              <p className="mt-1 text-sm text-ink">属：{species.genus}</p>
              {species.subfamily ? <p className="mt-1 text-sm text-ink">亚科：{species.subfamily}</p> : null}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">收集状态</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge text={collected ? "已收集" : "未收集"} tone={collected ? "success" : "default"} />
                {species.userStatus?.isTarget ? <StatusBadge text="目标种" tone="accent" /> : null}
                {species.userStatus?.isPendingIdentify ? <StatusBadge text="待鉴定" tone="warn" /> : null}
                {species.userStatus?.isNewDiscovery ? <StatusBadge text="新发现" tone="success" /> : null}
              </div>
              <p className="mt-3 text-sm text-slate-500">别名：{species.aliases.map((item) => item.alias).join("、") || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p className="text-sm text-slate-500">备注</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{species.notes || species.description || "暂无备注"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p className="text-sm text-slate-500">地区分布</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {species.distributions.map((item) => (
                  <StatusBadge key={item.id} text={item.region.name} />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="个人标签" description="目标种、待鉴定、新发现等手动状态">
          <SpeciesFlagsForm
            speciesId={species.id}
            current={{
              isTarget: species.userStatus?.isTarget ?? false,
              isPendingIdentify: species.userStatus?.isPendingIdentify ?? false,
              isNewDiscovery: species.userStatus?.isNewDiscovery ?? false,
              personalNote: species.userStatus?.personalNote
            }}
          />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="图片画廊" description="图片存储于本地 uploads 目录，通过本地 API 提供访问">
          {species.images.length === 0 ? (
            <EmptyState title="暂时没有图片" description="上传几张物种或采集现场照片后会展示在这里。" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {species.images.map((image) => (
                <article key={image.id} className="overflow-hidden rounded-2xl bg-slate-50">
                  <img src={`/api/uploads/${image.fileName}`} alt={image.title ?? image.originalName} className="h-48 w-full object-cover" />
                  <div className="space-y-1 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-ink">{image.title ?? image.originalName}</p>
                      {image.isCover ? <StatusBadge text="封面" tone="accent" /> : null}
                    </div>
                    <p className="text-xs text-slate-500">{image.description || "暂无说明"}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="上传图片" description="可直接绑定当前物种，也可选填关联记录">
          <ImageUploadForm
            speciesId={species.id}
            recordOptions={species.records.map((record) => ({
              id: record.id,
              label: `${formatDate(record.observedAt)} · ${record.region.name} · ${record.locationDetail}`
            }))}
          />
        </SectionCard>
      </section>

      <SectionCard title="关联记录列表" description="confirmed 记录计入正式完成度，pending_identification 不计入">
        {species.records.length === 0 ? (
          <EmptyState title="还没有关联记录" description="前往收集记录页新增后，这里会自动展示。" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>地区</th>
                <th>地点</th>
                <th>状态</th>
                <th>数量</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {species.records.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.observedAt)}</td>
                  <td>{record.region.name}</td>
                  <td>{record.locationDetail}</td>
                  <td>
                    <StatusBadge
                      text={record.status === "confirmed" ? "已确认" : record.status === "pending_identification" ? "待鉴定" : "观察"}
                      tone={record.status === "confirmed" ? "success" : "warn"}
                    />
                  </td>
                  <td>{record.quantity}</td>
                  <td>{record.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </>
  );
}
