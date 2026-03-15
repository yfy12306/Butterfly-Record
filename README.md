# 蝴蝶收藏管理网站

一个基于 Next.js App Router、TypeScript、Tailwind CSS、Prisma 和 SQLite 的个人蝴蝶收藏管理项目骨架。

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite
- 本地 `uploads/` 图片存储
- 单用户，无登录系统

## 已包含的页面

- `/` Dashboard
- `/species` 蝴蝶名录列表
- `/species/[id]` 物种详情页
- `/regions` 地区分布页
- `/records` 我的收集记录页
- `/images` 图片管理页
- `/stats` 统计页
- `/import-export` 导入导出与备份页

## 已包含的核心数据表

- `species`
- `species_alias`
- `region`
- `species_region_distribution`
- `collection_record`
- `image_asset`
- `species_user_status`
- `import_export_log`

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 初始化 Prisma Client、SQLite 数据库和示例数据

```bash
npm run setup
```

3. 启动开发环境

```bash
npm run dev
```

4. 打开浏览器

```text
http://localhost:3000
```

## 常用命令

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run build
```

## CSV 导入模板

参考 `examples/` 目录：

- `examples/species.csv`
- `examples/distributions.csv`
- `examples/records.csv`

## 业务规则实现说明

- 存在至少一条 `status=confirmed` 的记录即视为“已收集”
- `pending_identification` 不计入正式完成度
- 地区完成率 = 已收集物种数 / 地区名录总物种数
- 目标种、新发现、待鉴定标签为手动标记
- 图片可绑定物种，也可绑定具体记录

## 目录结构

```text
.
├─ app
│  ├─ api
│  │  ├─ backup
│  │  ├─ export
│  │  ├─ images
│  │  ├─ import
│  │  ├─ records
│  │  ├─ species
│  │  └─ uploads
│  ├─ images
│  ├─ import-export
│  ├─ records
│  ├─ regions
│  ├─ species
│  ├─ stats
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components
│  └─ forms
├─ examples
├─ lib
├─ prisma
│  ├─ schema.prisma
│  └─ seed.ts
├─ uploads
├─ middleware.ts
├─ next.config.ts
├─ package.json
└─ README.md
```
