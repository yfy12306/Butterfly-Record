import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ImportExportPage() {
  const logs = await prisma.importExportLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <>
      <PageHeader
        eyebrow="Import / Export"
        title="导入导出与备份"
        description="支持 CSV 导入物种、地区分布、个人记录，支持导出全部数据和数据库备份。"
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="CSV 导入" description="上传文件后调用对应 Route Handler 完成写入，并记录日志">
          <div className="space-y-4">
            {[
              { label: "导入物种", action: "/api/import/species" },
              { label: "导入地区分布", action: "/api/import/distributions" },
              { label: "导入个人记录", action: "/api/import/records" }
            ].map((item) => (
              <form key={item.action} action={item.action} method="post" encType="multipart/form-data" className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-3 text-sm font-medium text-ink">{item.label}</p>
                <input name="file" type="file" accept=".csv,text/csv" required className="block w-full text-sm" />
                <button className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">上传并导入</button>
              </form>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="导出与备份" description="导出当前数据库中的全部核心数据">
          <div className="grid gap-4">
            <a href="/api/export/all" className="rounded-2xl bg-moss px-4 py-3 text-sm font-medium text-white">
              导出全部数据 JSON
            </a>
            <a href="/api/backup" className="rounded-2xl bg-ember px-4 py-3 text-sm font-medium text-white">
              下载 SQLite 备份
            </a>
          </div>
        </SectionCard>
      </section>

      <SectionCard title="最近导入导出日志" description="帮助你追踪导入、导出和备份行为">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>文件</th>
              <th>数量</th>
              <th>状态</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{log.type}</td>
                <td>{log.fileName ?? "-"}</td>
                <td>{log.itemCount}</td>
                <td>{log.status}</td>
                <td>{log.message ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </>
  );
}
