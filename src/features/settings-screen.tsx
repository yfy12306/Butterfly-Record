import { zodResolver } from "@hookform/resolvers/zod";
import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { ArrowLeft, Bot, Download, FileJson, Globe, Key, RefreshCw, Save, Upload } from "lucide-react-native";

import { Screen, ScreenHeader } from "@/components/layout";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, LoadingState } from "@/components/ui";
import { useAiSettings } from "@/hooks/use-ai-settings";
import { exportBackupArchive, importBackupArchive } from "@/lib/backup-archive";
import { createExportFileUri, deleteFileIfExists, downloadRemotePhotoToSandbox, readTextFile, writeTextFile } from "@/lib/files";
import { useButterflyData } from "@/state/butterfly-data";
import { toLegacyButterflyExport } from "@/types";
import { theme } from "@/theme";

const settingsSchema = z.object({
  apiUrl: z.string().trim().url("请输入有效的 API URL"),
  model: z.string().trim().min(1, "请输入模型名称"),
  apiKey: z.string().trim().min(1, "请输入 API Key"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsScreen() {
  const router = useRouter();
  const { ready, loading, records, importLegacyExport, replaceAll, updateRecord } = useButterflyData();
  const aiSettings = useAiSettings();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      apiUrl: "",
      model: "",
      apiKey: "",
    },
  });

  useEffect(() => {
    form.reset({
      apiUrl: aiSettings.settings.apiUrl,
      model: aiSettings.settings.model,
      apiKey: aiSettings.settings.apiKey,
    });
  }, [aiSettings.settings, form]);

  if (!ready || loading || aiSettings.loading) {
    return (
      <Screen>
        <LoadingState title="正在打开设置" description="本地配置和收藏数据正在准备。" />
      </Screen>
    );
  }

  async function handleSave(values: SettingsFormValues) {
    await aiSettings.save(values);
    setMessage("AI 设置已保存到本机。");
  }

  async function handleTest(values: SettingsFormValues) {
    await aiSettings.save(values);
    const result = await aiSettings.testConnection();
    setMessage(result.ok ? "连接测试成功。" : result.message);
  }

  async function handleExportLegacy() {
    setBusy("legacy-export");
    try {
      const legacyExport = toLegacyButterflyExport(records);
      const exportUri = await createExportFileUri(`butterfly-legacy-${new Date().toISOString().slice(0, 10)}.json`);
      await writeTextFile(exportUri, `${JSON.stringify(legacyExport, null, 2)}\n`);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportUri);
      }
      setMessage(`已导出 ${legacyExport.total_count} 条旧版 JSON 备份。`);
    } finally {
      setBusy(null);
    }
  }

  async function handleExportBackup() {
    setBusy("backup-export");
    try {
      const { uri, manifest } = await exportBackupArchive(records);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
      setMessage(`已导出完整备份：${manifest.record_count} 条记录，${manifest.file_count} 张照片。`);
    } finally {
      setBusy(null);
    }
  }

  async function pickAndImportLegacy() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/json"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setBusy("legacy-import");
    try {
      const raw = await readTextFile(result.assets[0].uri);
      const imported = await importLegacyExport(raw);
      let downloadedPhotos = 0;

      for (const record of imported) {
        if (!record.photo_remote_url) {
          continue;
        }

        try {
          const localUri = await downloadRemotePhotoToSandbox(record.photo_remote_url);
          try {
            await updateRecord(record.id, { photo_local_uri: localUri });
          } catch (updateError) {
            await deleteFileIfExists(localUri);
            throw updateError;
          }
          downloadedPhotos += 1;
        } catch {
          continue;
        }
      }

      setMessage(`已导入 ${imported.length} 条旧版记录，并补拉了 ${downloadedPhotos} 张远程照片。`);
    } finally {
      setBusy(null);
    }
  }

  async function pickAndImportBackup() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/zip", "application/x-zip-compressed"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setBusy("backup-import");
    try {
      const restored = await importBackupArchive(result.assets[0].uri);
      try {
        await replaceAll(restored.records);
      } catch (replaceError) {
        await Promise.allSettled(restored.records.map((record) => deleteFileIfExists(record.photo_local_uri)));
        throw replaceError;
      }
      setMessage(`已恢复完整备份：${restored.manifest.record_count} 条记录。`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen scrollable padded={false}>
      <ScreenHeader
        sticky={false}
        title="设置"
        subtitle="本地 AI 配置与备份恢复"
        leading={
          <Button variant="ghost" size="icon-sm" onPress={() => router.back()}>
            <ArrowLeft size={18} color={theme.colors.foreground} />
          </Button>
        }
      />

      <View className="gap-6 px-4 pt-4 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>识别模型配置</CardTitle>
            <CardDescription>AI Key 保存在 SecureStore，URL 和模型保存在普通本地设置中。</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <Input
              label="API URL"
              placeholder="https://ark.cn-beijing.volces.com/api/v3/chat/completions"
              value={form.watch("apiUrl")}
              onChangeText={(value) => form.setValue("apiUrl", value, { shouldValidate: true })}
              error={form.formState.errors.apiUrl?.message}
              startAdornment={<Globe size={16} color={theme.colors.mutedForeground} />}
            />
            <Input
              label="模型名称"
              placeholder="如：doubao-seed-1-6-vision-250815"
              value={form.watch("model")}
              onChangeText={(value) => form.setValue("model", value, { shouldValidate: true })}
              error={form.formState.errors.model?.message}
              startAdornment={<Bot size={16} color={theme.colors.mutedForeground} />}
            />
            <Input
              label="API Key"
              placeholder="输入你自己的 API Key"
              secureTextEntry
              value={form.watch("apiKey")}
              onChangeText={(value) => form.setValue("apiKey", value, { shouldValidate: true })}
              error={form.formState.errors.apiKey?.message}
              startAdornment={<Key size={16} color={theme.colors.mutedForeground} />}
            />

            <View className="flex-row gap-3">
              <Button
                className="flex-1"
                loading={aiSettings.saving}
                onPress={form.handleSubmit((values) => void handleSave(values))}
                startIcon={<Save size={16} color={theme.colors.primaryForeground} />}
              >
                保存
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                loading={aiSettings.testing}
                onPress={form.handleSubmit((values) => void handleTest(values))}
                startIcon={<RefreshCw size={16} color={theme.colors.secondaryForeground} />}
              >
                测试连接
              </Button>
            </View>

            <Button variant="ghost" onPress={() => void aiSettings.clear()}>
              清空本地配置
            </Button>

            {aiSettings.lastConnectionTest ? (
              <Badge variant={aiSettings.lastConnectionTest.ok ? "success" : "destructive"}>
                {aiSettings.lastConnectionTest.ok ? "连接成功" : "连接失败"}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>完整本地备份</CardTitle>
            <CardDescription>导出 `backup_v2.zip`，包含记录和本地照片。</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button loading={busy === "backup-export"} onPress={() => void handleExportBackup()} startIcon={<Download size={16} color={theme.colors.primaryForeground} />}>
              导出完整备份
            </Button>
            <Button variant="secondary" loading={busy === "backup-import"} onPress={() => void pickAndImportBackup()} startIcon={<Upload size={16} color={theme.colors.secondaryForeground} />}>
              恢复完整备份
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>旧网站 JSON 兼容</CardTitle>
            <CardDescription>兼容当前 Web 项目的导入导出格式，导入时会尝试下载旧 `photo_url`。</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button loading={busy === "legacy-export"} onPress={() => void handleExportLegacy()} startIcon={<FileJson size={16} color={theme.colors.primaryForeground} />}>
              导出旧版 JSON
            </Button>
            <Button variant="secondary" loading={busy === "legacy-import"} onPress={() => void pickAndImportLegacy()} startIcon={<Upload size={16} color={theme.colors.secondaryForeground} />}>
              导入旧版 JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>关于</CardTitle>
            <CardDescription>当前安装以 Android 为首发目标，长期维护为正式本地 App。</CardDescription>
          </CardHeader>
          <CardContent className="gap-2">
            <Text className="text-[14px] text-foreground">版本：{Constants.expoConfig?.version ?? "1.0.0"}</Text>
            <Text className="text-[13px] leading-5 text-muted-foreground">
              所有收藏数据和照片默认保存在 App 私有沙箱里，卸载应用后不会保留。
            </Text>
          </CardContent>
        </Card>

        {message ? (
          <Card className="bg-primary/5">
            <CardContent className="pt-4">
              <Text className="text-[13px] leading-5 text-foreground">{message}</Text>
            </CardContent>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
