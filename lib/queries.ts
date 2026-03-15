import { RecordStatus, RegionLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { percentage } from "@/lib/utils";

export async function getDashboardSummary() {
  const [species, records, images, recentRecords, recentImages, targetCount, pendingCount] =
    await Promise.all([
      prisma.species.findMany({
        include: {
          records: { select: { status: true } },
          userStatus: true
        }
      }),
      prisma.collectionRecord.count(),
      prisma.imageAsset.count(),
      prisma.collectionRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { species: true, region: true }
      }),
      prisma.imageAsset.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { species: true }
      }),
      prisma.speciesUserStatus.count({ where: { isTarget: true } }),
      prisma.speciesUserStatus.count({ where: { isPendingIdentify: true } })
    ]);

  const collectedCount = species.filter((item) =>
    item.records.some((record) => record.status === RecordStatus.confirmed)
  ).length;

  return {
    totalSpecies: species.length,
    collectedCount,
    uncollectedCount: species.length - collectedCount,
    completionRate: percentage(collectedCount, species.length),
    totalRecords: records,
    totalImages: images,
    targetCount,
    pendingCount,
    recentRecords,
    recentImages
  };
}

export async function getSpeciesList(params: {
  q?: string;
  family?: string;
  status?: "all" | "collected" | "uncollected";
  target?: "all" | "true" | "false";
}) {
  const q = params.q?.trim();
  const species = await prisma.species.findMany({
    where: {
      OR: q
        ? [
            { chineseName: { contains: q } },
            { scientificName: { contains: q } },
            { family: { contains: q } },
            { genus: { contains: q } },
            { aliases: { some: { alias: { contains: q } } } }
          ]
        : undefined,
      family: params.family ? { equals: params.family } : undefined
    },
    include: {
      userStatus: true,
      records: { select: { status: true } },
      distributions: { include: { region: true } },
      images: true
    },
    orderBy: [{ family: "asc" }, { genus: "asc" }, { chineseName: "asc" }]
  });

  return species.filter((item) => {
    const collected = item.records.some((record) => record.status === RecordStatus.confirmed);
    const target = item.userStatus?.isTarget ?? false;

    if (params.status === "collected" && !collected) return false;
    if (params.status === "uncollected" && collected) return false;
    if (params.target === "true" && !target) return false;
    if (params.target === "false" && target) return false;
    return true;
  });
}

export async function getRegionOverview(level: RegionLevel, regionId?: string) {
  const regions = await prisma.region.findMany({
    where: { level, parentId: regionId ?? undefined },
    include: {
      children: true,
      distributions: { include: { species: { include: { records: true } } } }
    },
    orderBy: { name: "asc" }
  });

  return regions.map((region) => {
    const total = region.distributions.length;
    const collected = region.distributions.filter((distribution) =>
      distribution.species.records.some((record) => record.status === RecordStatus.confirmed)
    ).length;

    return {
      ...region,
      totalSpecies: total,
      collectedSpecies: collected,
      completionRate: percentage(collected, total)
    };
  });
}

export async function getStatsData() {
  const [regions, species, records] = await Promise.all([
    prisma.region.findMany({
      include: {
        distributions: { include: { species: { include: { records: true } } } }
      },
      orderBy: [{ level: "asc" }, { name: "asc" }]
    }),
    prisma.species.findMany({
      include: {
        records: true,
        userStatus: true
      }
    }),
    prisma.collectionRecord.findMany({
      orderBy: { observedAt: "asc" },
      include: { species: true }
    })
  ]);

  const byRegion = regions.map((region) => {
    const total = region.distributions.length;
    const collected = region.distributions.filter((distribution) =>
      distribution.species.records.some((record) => record.status === RecordStatus.confirmed)
    ).length;

    return {
      id: region.id,
      name: region.name,
      level: region.level,
      total,
      collected,
      rate: percentage(collected, total)
    };
  });

  const familyMap = new Map<string, { total: number; collected: number }>();
  for (const item of species) {
    const current = familyMap.get(item.family) ?? { total: 0, collected: 0 };
    current.total += 1;
    if (item.records.some((record) => record.status === RecordStatus.confirmed)) {
      current.collected += 1;
    }
    familyMap.set(item.family, current);
  }

  const byFamily = Array.from(familyMap.entries()).map(([family, data]) => ({
    family,
    ...data,
    rate: percentage(data.collected, data.total)
  }));

  const trendMap = new Map<string, number>();
  for (const record of records) {
    const key = record.observedAt.toISOString().slice(0, 10);
    trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }

  const targetSpecies = species.filter((item) => item.userStatus?.isTarget);
  const targetCompleted = targetSpecies.filter((item) =>
    item.records.some((record) => record.status === RecordStatus.confirmed)
  ).length;

  return {
    byRegion,
    byFamily,
    trend: Array.from(trendMap.entries()).map(([date, count]) => ({ date, count })),
    target: {
      total: targetSpecies.length,
      completed: targetCompleted,
      rate: percentage(targetCompleted, targetSpecies.length)
    }
  };
}
