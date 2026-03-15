import { EmptyState } from "@/components/empty-state";
import { RecordForm } from "@/components/forms/record-form";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function RecordsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const regionId = typeof params.regionId === "string" ? params.regionId : undefined;
  const speciesId = typeof params.speciesId === "string" ? params.speciesId : undefined;
  const date = typeof params.date === "string" ? params.date : undefined;

  const [records, species, regions] = await Promise.all([
    prisma.collectionRecord.findMany({
      where: {
        speciesId: speciesId || undefined,
        regionId: regionId || undefined,
        observedAt: date
          ? {
              gte: new Date(`${date}T00:00:00`),
              lt: new Date(`${date}T23:59:59`)
            }
          : undefined,
        OR: q
          ? [
              { species: { chineseName: { contains: q } } },
              { region: { name: { contains: q } } },
              { locationDetail: { contains: q } }
            ]
          : undefined
      },
      include: {
        species: true,
        region: true,
        images: true
      },
      orderBy: { observedAt: "desc" }
    }),
    prisma.species.findMany({ orderBy: { chineseName: "asc" } }),
    prisma.region.findMany({ orderBy: [{ level: "asc" }, { name: "asc" }] })
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="我的收集记录"
        description="支持新增、筛选，并通过 API 继续扩展编辑和删除流程。"
      />

      <SectionCard title="新增记录" description="第一版提供快速录入表单，保存后自动刷新页面">
        <RecordForm
          speciesOptions={species.map((item) => ({ id: item.id, label: `${item.chineseName} · ${item.scientificName}` }))}
          regionOptions={regions.map((item) => ({ id: item.id, label: item.name }))}
        />
      </SectionCard>

      <SectionCard title="筛选记录" description="支持按日期、物种、地区和关键词过滤">
        <form className="grid gap-3 lg:grid-cols-4">
          <input name="q" defaultValue={q} placeholder="关键词" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input name="date" type="date" defaultValue={date} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <select name="speciesId" defaultValue={speciesId} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="">全部物种</option>
            {species.map((item) => (
              <option key={item.id} value={item.id}>
                {item.chineseName}
              </option>
            ))}
          </select>
          <select name="regionId" defaultValue={regionId} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="">全部地区</option>
            {regions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white lg:col-span-4 lg:justify-self-start">应用筛选</button>
        </form>
      </SectionCard>

      <SectionCard title="记录列表" description="已预留 API，可继续接入编辑弹窗、批量操作等">
        {records.length === 0 ? (
          <EmptyState title="没有符合条件的记录" description="先新增一条记录，或者放宽筛选条件。" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>物种</th>
                <th>地区</th>
                <th>地点</th>
                <th>状态</th>
                <th>数量</th>
                <th>图片数</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.observedAt)}</td>
                  <td>{record.species.chineseName}</td>
                  <td>{record.region.name}</td>
                  <td>{record.locationDetail}</td>
                  <td>
                    <StatusBadge
                      text={record.status === "confirmed" ? "已确认" : record.status === "pending_identification" ? "待鉴定" : "观察"}
                      tone={record.status === "confirmed" ? "success" : "warn"}
                    />
                  </td>
                  <td>{record.quantity}</td>
                  <td>{record.images.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </>
  );
}
