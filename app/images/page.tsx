import { EmptyState } from "@/components/empty-state";
import { ImageActions } from "@/components/forms/image-actions";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { prisma } from "@/lib/prisma";

export default async function ImagesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const speciesId = typeof params.speciesId === "string" ? params.speciesId : undefined;
  const regionId = typeof params.regionId === "string" ? params.regionId : undefined;
  const date = typeof params.date === "string" ? params.date : undefined;

  const [images, species, regions] = await Promise.all([
    prisma.imageAsset.findMany({
      where: {
        speciesId: speciesId || undefined,
        collectionRecord: {
          regionId: regionId || undefined
        },
        shotAt: date
          ? {
              gte: new Date(`${date}T00:00:00`),
              lt: new Date(`${date}T23:59:59`)
            }
          : undefined,
        OR: q
          ? [
              { title: { contains: q } },
              { originalName: { contains: q } },
              { species: { chineseName: { contains: q } } }
            ]
          : undefined
      },
      include: {
        species: true,
        collectionRecord: { include: { region: true } }
      },
      orderBy: [{ isCover: "desc" }, { createdAt: "desc" }]
    }),
    prisma.species.findMany({ orderBy: { chineseName: "asc" } }),
    prisma.region.findMany({ orderBy: [{ level: "asc" }, { name: "asc" }] })
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Images"
        title="图片管理"
        description="浏览所有图片，按物种、地区、日期筛选，并支持封面设置和元数据修改。"
      />

      <SectionCard title="筛选图片" description="条件筛选基于图片标题、物种、记录地区和拍摄日期">
        <form className="grid gap-3 lg:grid-cols-4">
          <input name="q" placeholder="标题 / 文件名 / 物种" defaultValue={q} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
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

      <SectionCard title="全部图片" description="封面图会优先显示在物种详情页">
        {images.length === 0 ? (
          <EmptyState title="当前没有图片" description="可以从物种详情页上传图片后回到这里统一管理。" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <article key={image.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <img src={`/api/uploads/${image.fileName}`} alt={image.title ?? image.originalName} className="h-56 w-full object-cover" />
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{image.species?.chineseName ?? "未绑定物种"}</p>
                    <p className="text-xs text-slate-500">{image.collectionRecord?.region.name ?? "未绑定地区"}</p>
                  </div>
                  <ImageActions
                    imageId={image.id}
                    initialTitle={image.title}
                    initialDescription={image.description}
                    isCover={image.isCover}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
