import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Ruler,
  Trash2,
  TreePine,
  X,
} from "lucide-react-native";

import { Screen, ScreenHeader } from "@/components/layout";
import { Badge, Button, Card, CardContent, EmptyState, LoadingState } from "@/components/ui";
import { ButterflyRecordFormFields, butterflyFormSchema, createButterflyFormDefaults, type ButterflyFormValues } from "@/features/butterfly-form";
import { formatDate, parseTaxonomy } from "@/lib/format";
import { useButterflyData } from "@/state/butterfly-data";
import { theme } from "@/theme";

export function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { ready, loading, findRecordById, findGroupByName, deleteGroupByName, deleteRecord, updateRecord } = useButterflyData();
  const record = params.id ? findRecordById(params.id) : null;
  const group = record ? findGroupByName(record.name_cn) : null;
  const photos = group?.records ?? (record ? [record] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRecord = photos[currentIndex] ?? record;
  const form = useForm<ButterflyFormValues>({
    resolver: zodResolver(butterflyFormSchema),
    defaultValues: createButterflyFormDefaults(),
  });

  useEffect(() => {
    if (!record) {
      return;
    }
    const nextIndex = photos.findIndex((photo) => photo.id === record.id);
    setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [photos, record]);

  useEffect(() => {
    if (!activeRecord) {
      return;
    }

    form.reset(
      createButterflyFormDefaults({
        name_cn: activeRecord.name_cn,
        name_en: activeRecord.name_en ?? "",
        latin_name: activeRecord.latin_name ?? "",
        family: activeRecord.family ?? "",
        subfamily: activeRecord.subfamily ?? "",
        genus: activeRecord.genus ?? "",
        distribution: activeRecord.distribution ?? "",
        habitat: activeRecord.habitat ?? "",
        wingspan: activeRecord.wingspan ?? "",
        description: activeRecord.description ?? "",
        location: activeRecord.location ?? "",
        latitude: activeRecord.latitude ?? "",
        longitude: activeRecord.longitude ?? "",
        notes: activeRecord.notes ?? "",
      }),
    );
  }, [activeRecord, form]);

  const title = useMemo(() => record?.name_cn ?? "蝴蝶详情", [record]);

  if (!ready || loading) {
    return (
      <Screen>
        <LoadingState title="正在打开详情" description="本地蝴蝶记录马上就好。" />
      </Screen>
    );
  }

  if (!record || !activeRecord) {
    return (
      <Screen>
        <EmptyState
          title="未找到这条记录"
          description="它可能已经被删除，或者当前链接已经失效。"
          icon={<AlertCircle size={36} color={theme.colors.destructive} />}
          action={<Button onPress={() => router.replace("/")}>返回首页</Button>}
        />
      </Screen>
    );
  }

  async function handleSave(values: ButterflyFormValues) {
    setSaving(true);
    setError(null);
    try {
      await updateRecord(activeRecord.id, {
        name_cn: values.name_cn,
        name_en: values.name_en || undefined,
        latin_name: values.latin_name || undefined,
        family: values.family || undefined,
        subfamily: values.subfamily || undefined,
        genus: values.genus || undefined,
        distribution: values.distribution || undefined,
        habitat: values.habitat || undefined,
        wingspan: values.wingspan || undefined,
        description: values.description || undefined,
        location: values.location || undefined,
        latitude: values.latitude || undefined,
        longitude: values.longitude || undefined,
        notes: values.notes || undefined,
      });
      setEditOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  function confirmDeletePhoto() {
    if (!record) {
      return;
    }
    const deletingCurrentRouteRecord = activeRecord.id === record.id;
    const nextRecord = photos.find((photo) => photo.id !== activeRecord.id) ?? null;
    Alert.alert(
      "删除这张照片",
      photos.length > 1 ? "这张照片会从当前物种组里移除，其余标本会保留。" : "这是最后一张照片，删除后会回到首页。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await deleteRecord(activeRecord.id);
              if (photos.length <= 1) {
                router.replace("/");
                return;
              }
              if (deletingCurrentRouteRecord && nextRecord) {
                router.replace(`/butterfly/${nextRecord.id}`);
              } else {
                setCurrentIndex((current) => Math.max(0, current - 1));
              }
            })();
          },
        },
      ],
    );
  }

  function confirmDeleteGroup() {
    if (!record) {
      return;
    }
    Alert.alert(
      "删除整个物种组",
      `会删除“${record.name_cn}”的全部 ${photos.length} 条记录。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除全部",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await deleteGroupByName(record.name_cn);
              router.replace("/");
            })();
          },
        },
      ],
    );
  }

  return (
    <>
      <Screen scrollable padded={false}>
        <ScreenHeader
          sticky={false}
          title={title}
          subtitle="本机私有收藏记录"
          leading={
            <Button variant="ghost" size="icon-sm" onPress={() => router.back()}>
              <ArrowLeft size={18} color={theme.colors.foreground} />
            </Button>
          }
          trailing={
            <View className="flex-row gap-2">
              <Button variant="ghost" size="icon-sm" onPress={() => setEditOpen(true)}>
                <Pencil size={18} color={theme.colors.foreground} />
              </Button>
              <Button variant="ghost" size="icon-sm" onPress={confirmDeleteGroup}>
                <Trash2 size={18} color={theme.colors.destructive} />
              </Button>
            </View>
          }
        />

        <View className="gap-6 px-4 pt-4 pb-8">
          <Card className="overflow-hidden">
            <View className="aspect-[4/3] bg-muted/40">
              {activeRecord.photo_local_uri || activeRecord.photo_remote_url ? (
                <Image
                  source={{ uri: activeRecord.photo_local_uri ?? activeRecord.photo_remote_url ?? undefined }}
                  className="h-full w-full"
                  resizeMode="contain"
                />
              ) : (
                <View className="h-full items-center justify-center">
                  <ImageIcon size={42} color={theme.colors.mutedForeground} />
                </View>
              )}

              {photos.length > 1 ? (
                <>
                  <Button
                    variant="subtle"
                    size="icon-sm"
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    onPress={() => setCurrentIndex((current) => (current === 0 ? photos.length - 1 : current - 1))}
                  >
                    <ChevronLeft size={18} color={theme.colors.foreground} />
                  </Button>
                  <Button
                    variant="subtle"
                    size="icon-sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onPress={() => setCurrentIndex((current) => (current === photos.length - 1 ? 0 : current + 1))}
                  >
                    <ChevronRight size={18} color={theme.colors.foreground} />
                  </Button>
                </>
              ) : null}

              <View className="absolute left-3 top-3">
                <Badge variant="default">{`${photos.length} 标本`}</Badge>
              </View>
              <View className="absolute right-3 top-3">
                <Button variant="subtle" size="icon-sm" onPress={confirmDeletePhoto}>
                  <Trash2 size={16} color={theme.colors.destructive} />
                </Button>
              </View>
            </View>
          </Card>

          {photos.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {photos.map((photo, index) => (
                  <Pressable
                    key={photo.id}
                    onPress={() => setCurrentIndex(index)}
                    className={`h-20 w-20 overflow-hidden rounded-2xl border ${index === currentIndex ? "border-primary" : "border-border"}`}
                  >
                    {photo.photo_local_uri || photo.photo_remote_url ? (
                      <Image
                        source={{ uri: photo.photo_local_uri ?? photo.photo_remote_url ?? undefined }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-full items-center justify-center bg-muted/40">
                        <ImageIcon size={20} color={theme.colors.mutedForeground} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : null}

          <View className="gap-2">
            <Text className="font-serif text-[28px] text-foreground">{activeRecord.name_cn}</Text>
            {activeRecord.latin_name ? (
              <Text className="text-[15px] italic text-muted-foreground">{activeRecord.latin_name}</Text>
            ) : null}
            {activeRecord.name_en ? (
              <Text className="text-[14px] text-muted-foreground">{activeRecord.name_en}</Text>
            ) : null}
            <View className="flex-row flex-wrap gap-2 pt-2">
              {activeRecord.ai_confidence ? <Badge variant="secondary">{`AI ${activeRecord.ai_confidence}`}</Badge> : null}
              {activeRecord.family ? <Badge variant="outline">{formatTaxonomyLabel(activeRecord.family)}</Badge> : null}
              {activeRecord.subfamily ? <Badge variant="outline">{formatTaxonomyLabel(activeRecord.subfamily)}</Badge> : null}
              {activeRecord.genus ? <Badge variant="outline">{formatTaxonomyLabel(activeRecord.genus)}</Badge> : null}
            </View>
          </View>

          <InfoCard icon={<MapPin size={18} color={theme.colors.primary} />} title="采集地点">
            {activeRecord.location || "未记录地点"}
          </InfoCard>
          <InfoCard icon={<Globe size={18} color={theme.colors.primary} />} title="分布地区">
            {activeRecord.distribution || "未记录"}
          </InfoCard>
          <InfoCard icon={<TreePine size={18} color={theme.colors.primary} />} title="栖息环境">
            {activeRecord.habitat || "未记录"}
          </InfoCard>
          <InfoCard
            icon={<Ruler size={18} color={theme.colors.primary} />}
            title="翅展与形态"
          >
            {`${activeRecord.wingspan ? `翅展：${activeRecord.wingspan}` : "未记录翅展"}${activeRecord.description ? `\n${activeRecord.description}` : ""}`}
          </InfoCard>
          <InfoCard
            icon={<FileText size={18} color={theme.colors.primary} />}
            title="采集时间与备注"
          >
            {`${activeRecord.collected_at ? `采集于 ${formatDate(activeRecord.collected_at)}` : "采集时间未记录"}${activeRecord.notes ? `\n${activeRecord.notes}` : ""}`}
          </InfoCard>

          {error ? (
            <Card className="border-destructive/20 bg-destructive/10">
              <CardContent className="flex-row items-start gap-3 pt-4">
                <AlertCircle size={18} color={theme.colors.destructive} />
                <Text className="flex-1 text-[13px] leading-5 text-destructive">{error}</Text>
              </CardContent>
            </Card>
          ) : null}
        </View>
      </Screen>

      <Modal visible={editOpen} animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <Screen scrollable padded={false}>
          <ScreenHeader
            sticky={false}
            title="编辑信息"
            subtitle="修改当前这条采集记录"
            leading={
              <Button variant="ghost" size="icon-sm" onPress={() => setEditOpen(false)}>
                <X size={18} color={theme.colors.foreground} />
              </Button>
            }
          />

          <View className="gap-6 px-4 pt-4 pb-8">
            <ButterflyRecordFormFields control={form.control} errors={form.formState.errors} />
            <Button loading={saving} onPress={form.handleSubmit((values) => void handleSave(values))}>
              保存修改
            </Button>
          </View>
        </Screen>
      </Modal>
    </>
  );
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: string }) {
  return (
    <Card>
      <CardContent className="flex-row gap-3 pt-5">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">{icon}</View>
        <View className="flex-1 gap-1">
          <Text className="text-[12px] text-muted-foreground">{title}</Text>
          <Text className="text-[14px] leading-6 text-foreground">{children}</Text>
        </View>
      </CardContent>
    </Card>
  );
}

function formatTaxonomyLabel(value: string) {
  const parsed = parseTaxonomy(value);
  return parsed.latin ? `${parsed.cn}（${parsed.latin}）` : parsed.cn;
}
