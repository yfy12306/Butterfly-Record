import { PrismaClient, RecordStatus, RegionLevel } from "@prisma/client";
import { ensureUploadsDir, saveUpload } from "../lib/uploads";

const prisma = new PrismaClient();

async function main() {
  await ensureUploadsDir();

  await prisma.imageAsset.deleteMany();
  await prisma.collectionRecord.deleteMany();
  await prisma.speciesRegionDistribution.deleteMany();
  await prisma.speciesAlias.deleteMany();
  await prisma.speciesUserStatus.deleteMany();
  await prisma.region.deleteMany();
  await prisma.species.deleteMany();
  await prisma.importExportLog.deleteMany();

  const china = await prisma.region.create({
    data: {
      name: "中国",
      slug: "china",
      level: RegionLevel.country
    }
  });

  const yunnan = await prisma.region.create({
    data: {
      name: "云南",
      slug: "yunnan",
      level: RegionLevel.province,
      parentId: china.id
    }
  });

  const sichuan = await prisma.region.create({
    data: {
      name: "四川",
      slug: "sichuan",
      level: RegionLevel.province,
      parentId: china.id
    }
  });

  const kunming = await prisma.region.create({
    data: {
      name: "昆明",
      slug: "kunming",
      level: RegionLevel.city,
      parentId: yunnan.id
    }
  });

  const dali = await prisma.region.create({
    data: {
      name: "大理",
      slug: "dali",
      level: RegionLevel.city,
      parentId: yunnan.id
    }
  });

  const chengdu = await prisma.region.create({
    data: {
      name: "成都",
      slug: "chengdu",
      level: RegionLevel.city,
      parentId: sichuan.id
    }
  });

  const species = await Promise.all([
    prisma.species.create({
      data: {
        chineseName: "金斑喙凤蝶",
        scientificName: "Teinopalpus aureus",
        family: "凤蝶科",
        genus: "喙凤蝶属",
        description: "中国珍稀大型蝶类，翅面具金绿色光泽。",
        notes: "常见于山地常绿阔叶林。",
        aliases: {
          create: [{ alias: "金凤蝶" }]
        },
        userStatus: {
          create: {
            isTarget: true
          }
        }
      }
    }),
    prisma.species.create({
      data: {
        chineseName: "巴黎翠凤蝶",
        scientificName: "Papilio paris",
        family: "凤蝶科",
        genus: "凤蝶属",
        description: "常见绿闪蝶类之一。",
        userStatus: {
          create: {
            isTarget: true,
            isPendingIdentify: true
          }
        }
      }
    }),
    prisma.species.create({
      data: {
        chineseName: "中华虎凤蝶",
        scientificName: "Luehdorfia chinensis",
        family: "凤蝶科",
        genus: "虎凤蝶属",
        description: "春季较早出现的中国特有种。",
        userStatus: {
          create: {
            isNewDiscovery: true
          }
        }
      }
    }),
    prisma.species.create({
      data: {
        chineseName: "菜粉蝶",
        scientificName: "Pieris rapae",
        family: "粉蝶科",
        genus: "粉蝶属",
        description: "常见农田与园林蝶类。"
      }
    })
  ]);

  await prisma.speciesRegionDistribution.createMany({
    data: [
      { speciesId: species[0].id, regionId: yunnan.id },
      { speciesId: species[0].id, regionId: kunming.id },
      { speciesId: species[1].id, regionId: yunnan.id },
      { speciesId: species[1].id, regionId: dali.id },
      { speciesId: species[2].id, regionId: sichuan.id },
      { speciesId: species[2].id, regionId: chengdu.id },
      { speciesId: species[3].id, regionId: china.id },
      { speciesId: species[3].id, regionId: yunnan.id },
      { speciesId: species[3].id, regionId: sichuan.id }
    ]
  });

  const record1 = await prisma.collectionRecord.create({
    data: {
      speciesId: species[0].id,
      regionId: kunming.id,
      observedAt: new Date("2025-05-18"),
      locationDetail: "西山林区步道",
      status: RecordStatus.confirmed,
      quantity: 1,
      note: "上午 10 点见雄蝶访花。"
    }
  });

  const record2 = await prisma.collectionRecord.create({
    data: {
      speciesId: species[1].id,
      regionId: dali.id,
      observedAt: new Date("2025-07-09"),
      locationDetail: "苍山中段灌木带",
      status: RecordStatus.pending_identification,
      quantity: 2,
      note: "照片待进一步核对。"
    }
  });

  const record3 = await prisma.collectionRecord.create({
    data: {
      speciesId: species[3].id,
      regionId: chengdu.id,
      observedAt: new Date("2025-04-02"),
      locationDetail: "城市公园花圃",
      status: RecordStatus.confirmed,
      quantity: 3
    }
  });

  await saveUpload(
    "sample-golden-birdwing.svg",
    Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#f6f3ea"/>
  <ellipse cx="400" cy="400" rx="220" ry="140" fill="#102030"/>
  <ellipse cx="800" cy="400" rx="220" ry="140" fill="#102030"/>
  <ellipse cx="390" cy="380" rx="160" ry="90" fill="#bda54b"/>
  <ellipse cx="810" cy="380" rx="160" ry="90" fill="#bda54b"/>
  <rect x="575" y="230" width="50" height="340" rx="24" fill="#4a6b3f"/>
  <line x1="600" y1="230" x2="545" y2="120" stroke="#4a6b3f" stroke-width="10"/>
  <line x1="600" y1="230" x2="655" y2="120" stroke="#4a6b3f" stroke-width="10"/>
</svg>`)
  );

  await saveUpload(
    "sample-cabbage-white.svg",
    Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#eef4dd"/>
  <ellipse cx="420" cy="400" rx="220" ry="160" fill="#ffffff" stroke="#ccd4bf" stroke-width="8"/>
  <ellipse cx="780" cy="400" rx="220" ry="160" fill="#ffffff" stroke="#ccd4bf" stroke-width="8"/>
  <circle cx="490" cy="325" r="25" fill="#102030"/>
  <circle cx="710" cy="325" r="25" fill="#102030"/>
  <rect x="575" y="240" width="50" height="320" rx="24" fill="#7d9b62"/>
</svg>`)
  );

  await prisma.imageAsset.createMany({
    data: [
      {
        speciesId: species[0].id,
        collectionRecordId: record1.id,
        fileName: "sample-golden-birdwing.svg",
        originalName: "sample-golden-birdwing.svg",
        mimeType: "image/svg+xml",
        title: "金斑喙凤蝶示例图",
        description: "seed 自动生成的本地示例图",
        shotAt: new Date("2025-05-18"),
        isCover: true
      },
      {
        speciesId: species[3].id,
        collectionRecordId: record3.id,
        fileName: "sample-cabbage-white.svg",
        originalName: "sample-cabbage-white.svg",
        mimeType: "image/svg+xml",
        title: "菜粉蝶示例图",
        description: "seed 自动生成的本地示例图",
        shotAt: new Date("2025-04-02"),
        isCover: true
      }
    ]
  });

  await prisma.importExportLog.create({
    data: {
      type: "import_species",
      fileName: "seed",
      itemCount: species.length,
      status: "success",
      message: "初始示例数据写入完成"
    }
  });

  console.log("Seed complete.");
  console.log(`Regions: ${[china, yunnan, sichuan, kunming, dali, chengdu].length}`);
  console.log(`Species: ${species.length}`);
  console.log(`Records: ${[record1, record2, record3].length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
