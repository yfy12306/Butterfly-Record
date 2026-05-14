import type { ReactNode } from "react";
import { useDeferredValue, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Clock3, Grid2x2, Image as ImageIcon, Leaf, List, MapPin, Search, Settings, Layers3 } from "lucide-react-native";

import { Screen, ScreenHeader } from "@/components/layout";
import { Badge, Button, Card, CardContent, EmptyState, Input, LoadingState } from "@/components/ui";
import { getButterflyStatistics, groupButterfliesByNameCn } from "@/db";
import { formatDate, parseTaxonomy } from "@/lib/format";
import { useButterflyData } from "@/state/butterfly-data";
import { theme } from "@/theme";

type ViewMode = "grid" | "list";

export function HomeScreen() {
  const router = useRouter();
  const { ready, loading, error, records } = useButterflyData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const deferredSearch = useDeferredValue(searchQuery);

  const searchFilteredRecords = useMemo(() => {
    const search = deferredSearch.trim().toLowerCase();
    if (!search) {
      return records;
    }

    return records.filter((record) =>
      [record.name_cn, record.name_en, record.latin_name, record.family, record.genus]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search)),
    );
  }, [deferredSearch, records]);

  const filteredRecords = useMemo(() => {
    if (!selectedFamily) {
      return searchFilteredRecords;
    }

    return searchFilteredRecords.filter((record) => record.family === selectedFamily);
  }, [searchFilteredRecords, selectedFamily]);

  const filteredGroups = useMemo(() => groupButterfliesByNameCn(filteredRecords), [filteredRecords]);
  const stats = useMemo(() => getButterflyStatistics(filteredRecords), [filteredRecords]);
  const familyList = useMemo(() => {
    const familyCounts = new Map<string, number>();
    for (const record of searchFilteredRecords) {
      if (!record.family) {
        continue;
      }
      familyCounts.set(record.family, (familyCounts.get(record.family) ?? 0) + 1);
    }

    return [...familyCounts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 8);
  }, [searchFilteredRecords]);

  if (!ready || loading) {
    return (
      <Screen>
        <LoadingState title="正在加载收藏" description="本地蝴蝶图鉴马上就好。" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <EmptyState
          title="加载失败"
          description={error}
          icon={<Leaf size={32} color={theme.colors.primary} />}
          action={
            <Button onPress={() => void router.replace("/")}>
              重新打开
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable padded={false}>
      <ScreenHeader
        sticky={false}
        title="折腰"
        subtitle="Butterfly Collection"
        leading={
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Leaf size={20} color={theme.colors.primary} />
          </View>
        }
        trailing={
          <View className="flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onPress={() => setViewMode((current) => (current === "grid" ? "list" : "grid"))}
            >
              {viewMode === "grid" ? (
                <List size={18} color={theme.colors.foreground} />
              ) : (
                <Grid2x2 size={18} color={theme.colors.foreground} />
              )}
            </Button>
            <Button variant="ghost" size="icon-sm" onPress={() => router.push("/settings")}>
              <Settings size={18} color={theme.colors.foreground} />
            </Button>
            <Button size="icon-sm" onPress={() => router.push("/collect")}>
              <Camera size={18} color={theme.colors.primaryForeground} />
            </Button>
          </View>
        }
      />

      <View className="gap-6 px-4 pt-4 pb-8">
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="搜索蝴蝶名称、学名或科属..."
          startAdornment={<Search size={16} color={theme.colors.mutedForeground} />}
        />

        <View className="flex-row gap-3">
          <StatCard label="标本总数" value={stats.record_count} />
          <StatCard label="物种数" value={stats.species_count} />
          <StatCard label="科数" value={stats.family_count} />
        </View>

        <Button variant="secondary" onPress={() => router.push("/taxonomy")}>
          浏览分类体系
        </Button>

        <View className="flex-row flex-wrap gap-2">
          <FilterChip
            label="全部"
            active={selectedFamily === null}
            onPress={() => setSelectedFamily(null)}
          />
          {familyList.map(([family, count]) => (
            <FilterChip
              key={family}
              label={`${family} (${count})`}
              active={selectedFamily === family}
              onPress={() => setSelectedFamily((current) => (current === family ? null : family))}
            />
          ))}
        </View>

        {filteredGroups.length === 0 ? (
          <EmptyState
            title="开始你的收藏"
            description="拍摄或导入一张蝴蝶照片，AI 或手动录入都会保存在本机。"
            icon={<Leaf size={42} color={theme.colors.primary} />}
            action={<Button onPress={() => router.push("/collect")}>去采集</Button>}
          />
        ) : viewMode === "grid" ? (
          <View className="gap-4">
            {filteredGroups.map((group) => (
              <Pressable key={group.representative.id} onPress={() => router.push(`/butterfly/${group.representative.id}`)}>
                <Card className="overflow-hidden">
                    <View className="aspect-[4/3] bg-muted/40">
                    {resolveDisplayPhoto(group.representative) ? (
                      <Image
                        source={{ uri: resolveDisplayPhoto(group.representative) }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-full items-center justify-center">
                        <Leaf size={38} color={theme.colors.mutedForeground} />
                      </View>
                    )}
                    <View className="absolute left-3 top-3">
                      <Badge variant="default">{`${group.count} 标本`}</Badge>
                    </View>
                    {group.count > 1 ? (
                      <View className="absolute right-3 top-3">
                        <Badge variant="outline">{`${group.count} 张`}</Badge>
                      </View>
                    ) : null}
                  </View>
                  <CardContent className="gap-3 pt-4">
                    <View>
                      <Text className="font-serif text-[18px] text-foreground">{group.name_cn}</Text>
                      {group.representative.latin_name ? (
                        <Text className="mt-1 text-[13px] italic text-muted-foreground">
                          {group.representative.latin_name}
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row flex-wrap gap-3">
                      {group.family ? (
                        <InlineMeta
                          icon={<Layers3 size={14} color={theme.colors.mutedForeground} />}
                          text={formatTaxonomyText(group.family ?? undefined)}
                        />
                      ) : null}
                      {group.representative.location ? (
                        <InlineMeta
                          icon={<MapPin size={14} color={theme.colors.mutedForeground} />}
                          text={group.representative.location}
                        />
                      ) : null}
                    </View>
                    <InlineMeta
                      icon={<Clock3 size={14} color={theme.colors.mutedForeground} />}
                      text={formatDate(group.representative.collected_at)}
                    />
                  </CardContent>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="gap-3">
            {filteredGroups.map((group) => (
              <Pressable key={group.representative.id} onPress={() => router.push(`/butterfly/${group.representative.id}`)}>
                <Card className="px-4 py-3">
                  <View className="flex-row gap-3">
                    <View className="h-20 w-20 overflow-hidden rounded-2xl bg-muted/40">
                      {resolveDisplayPhoto(group.representative) ? (
                        <Image
                          source={{ uri: resolveDisplayPhoto(group.representative) }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="h-full items-center justify-center">
                          <Leaf size={28} color={theme.colors.mutedForeground} />
                        </View>
                      )}
                    </View>
                    <View className="min-w-0 flex-1 gap-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="flex-1 font-serif text-[17px] text-foreground">{group.name_cn}</Text>
                        <Badge variant="secondary">{`${group.count} 标本`}</Badge>
                      </View>
                      {group.representative.latin_name ? (
                        <Text className="text-[13px] italic text-muted-foreground">
                          {group.representative.latin_name}
                        </Text>
                      ) : null}
                      {group.family ? (
                        <InlineMeta
                          icon={<Layers3 size={14} color={theme.colors.mutedForeground} />}
                          text={formatTaxonomyText(group.family ?? undefined)}
                        />
                      ) : null}
                      <InlineMeta
                        icon={<Clock3 size={14} color={theme.colors.mutedForeground} />}
                        text={formatDate(group.representative.collected_at)}
                      />
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex-1">
      <CardContent className="items-center pt-5">
        <Text className="font-serif text-[26px] text-primary">{value}</Text>
        <Text className="mt-2 text-[12px] text-muted-foreground">{label}</Text>
      </CardContent>
    </Card>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button variant={active ? "default" : "subtle"} size="sm" onPress={onPress}>
      {label}
    </Button>
  );
}

function InlineMeta({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View className="max-w-full flex-row items-center gap-1.5">
      {icon}
      <Text className="shrink text-[12px] text-muted-foreground">{text}</Text>
    </View>
  );
}

function formatTaxonomyText(value: string) {
  const parsed = parseTaxonomy(value);
  return parsed.latin ? `${parsed.cn}（${parsed.latin}）` : parsed.cn;
}

function resolveDisplayPhoto(record: { photo_local_uri?: string | null; photo_remote_url?: string | null }) {
  return record.photo_local_uri ?? record.photo_remote_url ?? undefined;
}
