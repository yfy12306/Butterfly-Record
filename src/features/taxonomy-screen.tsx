import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, Leaf, Search } from "lucide-react-native";

import { Screen, ScreenHeader } from "@/components/layout";
import { Button, Card, CardContent, EmptyState, Input, LoadingState } from "@/components/ui";
import { useButterflyData } from "@/state/butterfly-data";
import { theme } from "@/theme";

export function TaxonomyScreen() {
  const router = useRouter();
  const { ready, loading, taxonomy } = useButterflyData();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  const filteredFamilies = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) {
      return taxonomy.families;
    }

    return taxonomy.families.filter((family) => family.name.toLowerCase().includes(search));
  }, [searchQuery, taxonomy.families]);

  if (!ready || loading) {
    return (
      <Screen>
        <LoadingState title="正在整理分类" description="本地分类树马上就好。" />
      </Screen>
    );
  }

  return (
    <Screen scrollable padded={false}>
      <ScreenHeader
        sticky={false}
        title="蝴蝶分类"
        subtitle="Family → Genus → Species"
        leading={
          <Button variant="ghost" size="icon-sm" onPress={() => router.back()}>
            <ArrowLeft size={18} color={theme.colors.foreground} />
          </Button>
        }
      />

      <View className="gap-6 px-4 pt-4 pb-8">
        <View className="flex-row gap-3">
          <StatCard label="标本数" value={taxonomy.count} />
          <StatCard label="科数" value={taxonomy.family_count} />
          <StatCard label="属数" value={taxonomy.genus_count} />
        </View>

        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="搜索科名..."
          startAdornment={<Search size={16} color={theme.colors.mutedForeground} />}
        />

        {filteredFamilies.length === 0 ? (
          <EmptyState
            title="没有匹配的分类"
            description="换个科名试试，或者先回首页继续添加标本。"
            icon={<Leaf size={36} color={theme.colors.primary} />}
          />
        ) : (
          <View className="gap-3">
            {filteredFamilies.map((family) => {
              const expanded = expandedFamilies[family.name] ?? false;
              return (
                <Card key={family.name}>
                  <Pressable
                    onPress={() =>
                      setExpandedFamilies((current) => ({
                        ...current,
                        [family.name]: !expanded,
                      }))
                    }
                    className="flex-row items-center justify-between px-5 py-4"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                        <Leaf size={18} color={theme.colors.primary} />
                      </View>
                      <View>
                        <Text className="font-serif text-[17px] text-foreground">{family.name}</Text>
                        <Text className="text-[12px] text-muted-foreground">
                          {family.count} 标本 · {family.species_count} 种
                        </Text>
                      </View>
                    </View>
                    <ChevronDown
                      size={18}
                      color={theme.colors.mutedForeground}
                      style={{ transform: [{ rotate: expanded ? "0deg" : "-90deg" }] }}
                    />
                  </Pressable>

                  {expanded ? (
                    <CardContent className="gap-4 border-t border-border/60 pt-4">
                      {family.genera.map((genus) => (
                        <View key={`${family.name}-${genus.name}`} className="gap-2">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-[14px] font-medium text-foreground">{genus.name}</Text>
                            <Text className="text-[12px] text-muted-foreground">{genus.count} 标本</Text>
                          </View>
                          <View className="gap-2">
                            {genus.species.map((species) => (
                              <Pressable
                                key={species.representative.id}
                                onPress={() => router.push(`/butterfly/${species.representative.id}`)}
                                className="rounded-2xl bg-muted/60 px-3 py-3"
                              >
                                <View className="flex-row items-center justify-between gap-3">
                                  <View className="flex-1">
                                    <Text className="text-[14px] font-medium text-foreground">
                                      {species.name_cn}
                                    </Text>
                                    {species.representative.latin_name ? (
                                      <Text className="mt-1 text-[12px] italic text-muted-foreground">
                                        {species.representative.latin_name}
                                      </Text>
                                    ) : null}
                                  </View>
                                  <Text className="text-[12px] text-muted-foreground">
                                    {species.count} 条
                                  </Text>
                                </View>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      ))}
                    </CardContent>
                  ) : null}
                </Card>
              );
            })}
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
        <Text className="font-serif text-[24px] text-primary">{value}</Text>
        <Text className="mt-2 text-[12px] text-muted-foreground">{label}</Text>
      </CardContent>
    </Card>
  );
}
