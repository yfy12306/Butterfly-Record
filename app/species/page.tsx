import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getSpeciesList } from "@/lib/queries";

export default async function SpeciesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const list = await getSpeciesList({
    q: typeof params.q === "string" ? params.q : undefined,
    family: typeof params.family === "string" ? params.family : undefined,
    status: typeof params.status === "string" ? (params.status as "all" | "collected" | "uncollected") : "all",
    target: typeof params.target === "string" ? (params.target as "all" | "true" | "false") : "all"
  });

  return (
    <>
      <PageHeader
        eyebrow="Species"
        title="蝴蝶名录列表"
        description="按中文名、学名、科属与收藏状态检索蝴蝶名录。点击名称进入物种详情页。"
      />
      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-panel">
        <form className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 lg:grid-cols-4">
          <input name="q" placeholder="搜索中文名 / 学名 / 别名" defaultValue={typeof params.q === "string" ? params.q : ""} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input name="family" placeholder="筛选科名" defaultValue={typeof params.family === "string" ? params.family : ""} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <select name="status" defaultValue={typeof params.status === "string" ? params.status : "all"} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="all">全部收集状态</option>
            <option value="collected">已收集</option>
            <option value="uncollected">未收集</option>
          </select>
          <select name="target" defaultValue={typeof params.target === "string" ? params.target : "all"} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="all">全部目标状态</option>
            <option value="true">仅目标种</option>
            <option value="false">排除目标种</option>
          </select>
          <button className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white lg:col-span-4 lg:justify-self-start">应用筛选</button>
        </form>

        {list.length === 0 ? (
          <EmptyState title="没有匹配的物种" description="试试调整搜索词或筛选条件。" />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>中文名</th>
                  <th>学名</th>
                  <th>科 / 属</th>
                  <th>地区摘要</th>
                  <th>收集状态</th>
                  <th>目标种</th>
                  <th>图片数</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => {
                  const collected = item.records.some((record) => record.status === "confirmed");
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/species/${item.id}`} className="font-medium text-ink underline-offset-4 hover:underline">
                          {item.chineseName}
                        </Link>
                      </td>
                      <td className="italic text-slate-600">{item.scientificName}</td>
                      <td>
                        {item.family}
                        <div className="text-xs text-slate-500">{item.genus}</div>
                      </td>
                      <td>{item.distributions.slice(0, 3).map((entry) => entry.region.name).join("、") || "-"}</td>
                      <td>
                        <StatusBadge text={collected ? "已收集" : "未收集"} tone={collected ? "success" : "default"} />
                      </td>
                      <td>
                        <StatusBadge
                          text={item.userStatus?.isTarget ? "目标种" : "普通"}
                          tone={item.userStatus?.isTarget ? "accent" : "default"}
                        />
                      </td>
                      <td>{item.images.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
