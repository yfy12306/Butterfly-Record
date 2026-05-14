import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { AlertCircle, ArrowLeft, Bot, Camera, CheckCircle2, Image as ImageIcon, Keyboard, MapPin, Pencil, Settings } from "lucide-react-native";

import { Screen, ScreenHeader } from "@/components/layout";
import { Badge, Button, Card, CardContent, EmptyState, LoadingState } from "@/components/ui";
import { ButterflyRecordFormFields, butterflyFormSchema, createButterflyFormDefaults, type ButterflyFormValues } from "@/features/butterfly-form";
import { formatConfidencePercent } from "@/lib/ai-confidence";
import { deleteFileIfExists, persistPhotoToSandbox } from "@/lib/files";
import { useAiSettings } from "@/hooks/use-ai-settings";
import { useIdentifyImage } from "@/hooks/use-identify-image";
import { useOneShotLocation } from "@/hooks/use-one-shot-location";
import { useButterflyData } from "@/state/butterfly-data";
import { theme } from "@/theme";

type Step = "mode" | "photo" | "identifying" | "form" | "submitting" | "success";
type Mode = "ai" | "manual";

export function CollectScreen() {
  const router = useRouter();
  const { createRecord } = useButterflyData();
  const { settings } = useAiSettings();
  const identifyImage = useIdentifyImage();
  const location = useOneShotLocation();
  const form = useForm<ButterflyFormValues>({
    resolver: zodResolver(butterflyFormSchema),
    defaultValues: createButterflyFormDefaults(),
  });
  const persistedPhotoRef = useRef<string | null>(null);
  const photoUriRef = useRef<string | null>(null);

  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<Mode>("ai");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState<unknown>(null);
  const [isNotButterfly, setIsNotButterfly] = useState(false);

  async function cleanupUnsavedPhoto(targetUri?: string | null) {
    if (targetUri && targetUri !== persistedPhotoRef.current) {
      await deleteFileIfExists(targetUri);
    }
  }

  function handleBack() {
    if (step === "form") {
      setStep("photo");
      return;
    }

    if (step === "photo") {
      void resetFlow();
      return;
    }

    router.back();
  }

  useEffect(() => {
    photoUriRef.current = photoUri;
  }, [photoUri]);

  useEffect(() => {
    return () => {
      if (photoUriRef.current && photoUriRef.current !== persistedPhotoRef.current) {
        void deleteFileIfExists(photoUriRef.current).catch(() => undefined);
      }
    };
  }, []);

  async function openCameraAsync() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("没有相机权限，无法拍照。");
    }

    return ImagePicker.launchCameraAsync({
      mediaTypes: ["images"] as never,
      quality: 1,
      cameraType: ImagePicker.CameraType.back,
    });
  }

  async function pickImage(source: "camera" | "library") {
    try {
      setError(null);

      const result =
        source === "camera"
          ? await openCameraAsync()
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"] as never,
              quality: 1,
            });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setError("图片大小不能超过 10MB。");
        return;
      }

      const processed = await manipulateAsync(
        asset.uri,
        asset.width && asset.width > 1800 ? [{ resize: { width: 1800 } }] : [],
        {
          compress: 0.82,
          format: SaveFormat.JPEG,
        },
      );

      const localUri = await persistPhotoToSandbox(processed.uri, "jpg");
      await cleanupUnsavedPhoto(photoUri);
      setPhotoUri(localUri);
      setStep("photo");
      setIsNotButterfly(false);
      identifyImage.reset();
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : "选择图片失败。");
    }
  }

  async function handleIdentify() {
    if (!photoUri) {
      return;
    }

    if (!settings.apiKey || !settings.apiUrl || !settings.model) {
      setError("请先在设置里填写 AI 接口地址、模型和 API Key。");
      return;
    }

    setStep("identifying");
    setError(null);
    setIsNotButterfly(false);

    const result = await identifyImage.identifyWithRetry(
      {
        settings,
        imageUri: photoUri,
        imageMimeType: "image/jpeg",
      },
      {
        timeoutMs: 60_000,
        retries: 2,
      },
    );

    if (!result.ok || !result.response) {
      setError(result.error ?? "识别失败，请稍后再试。");
      setStep("photo");
      return;
    }

    if (result.response.is_not_butterfly) {
      setIsNotButterfly(true);
      setError("这张照片里没有识别到蝴蝶，请换一张更清晰的蝴蝶照片。");
      setStep("photo");
      return;
    }

    setAiConfidence(formatConfidencePercent(result.response.confidence));
    setAiRaw(result.response.raw);
    form.reset(
      createButterflyFormDefaults({
        name_cn: result.response.name_cn ?? "",
        name_en: result.response.name_en ?? "",
        latin_name: result.response.latin_name ?? "",
        family: result.response.family ?? "",
        subfamily: result.response.subfamily ?? "",
        genus: result.response.genus ?? "",
        distribution: result.response.distribution ?? "",
        habitat: result.response.habitat ?? "",
        wingspan: result.response.wingspan ?? "",
        description: result.response.description ?? "",
        location: form.getValues("location"),
        latitude: form.getValues("latitude"),
        longitude: form.getValues("longitude"),
        notes: "",
      }),
    );
    setStep("form");
  }

  async function handleLocate() {
    const result = await location.resolveWithRetry({ retries: 1, timeoutMs: 15_000 });
    if (result.status === "success") {
      form.setValue("location", result.locationText ?? "");
      form.setValue("latitude", `${result.coordinates.latitude}`);
      form.setValue("longitude", `${result.coordinates.longitude}`);
      setError(null);
      return;
    }

    setError(result.message);
  }

  async function handleSubmit(values: ButterflyFormValues) {
    if (!photoUri) {
      setError("请先选择一张照片。");
      return;
    }

    setStep("submitting");
    try {
      await createRecord({
        name_cn: values.name_cn.trim(),
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
        collected_at: new Date().toISOString(),
        photo_local_uri: photoUri,
        ai_confidence: aiConfidence || undefined,
        ai_details_json: aiRaw && typeof aiRaw === "object" ? (aiRaw as Record<string, unknown>) : undefined,
        notes: values.notes || undefined,
      });

      persistedPhotoRef.current = photoUri;
      setStep("success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败。");
      setStep("form");
    }
  }

  async function resetFlow() {
    await cleanupUnsavedPhoto(photoUri);
    persistedPhotoRef.current = null;
    setPhotoUri(null);
    setError(null);
    setAiConfidence(null);
    setAiRaw(null);
    setIsNotButterfly(false);
    identifyImage.reset();
    form.reset(createButterflyFormDefaults());
    setMode("ai");
    setStep("mode");
  }

  return (
    <Screen scrollable padded={false}>
      <ScreenHeader
        sticky={false}
        title={step === "success" ? "采集成功" : step === "mode" ? "添加蝴蝶" : "采集蝴蝶"}
        subtitle={step === "form" ? "确认并补全识别结果" : "拍照、识别并保存到本机"}
        leading={
          step === "mode" || step === "success" ? (
            <Button variant="ghost" size="icon-sm" onPress={handleBack}>
              <ArrowLeft size={18} color={theme.colors.foreground} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" onPress={handleBack}>
              <ArrowLeft size={18} color={theme.colors.foreground} />
            </Button>
          )
        }
      />

      <View className="gap-6 px-4 pt-4 pb-8">
        {step === "mode" ? (
          <>
            <Card>
              <CardContent className="gap-4 pt-5">
                <Text className="font-serif text-[24px] text-foreground">如何添加蝴蝶？</Text>
                <Text className="text-[14px] leading-6 text-muted-foreground">
                  你可以用 AI 识别自动回填信息，也可以直接手动录入，所有数据都会保存在手机本地私有空间。
                </Text>
              </CardContent>
            </Card>

            <ModeCard
              icon={<Bot size={24} color={theme.colors.primary} />}
              title="AI 智能识别"
              description="先拍照，再由你配置的 AI 接口识别蝴蝶种类。"
              onPress={() => {
                setMode("ai");
                setStep("photo");
              }}
            />
            <ModeCard
              icon={<Keyboard size={24} color={theme.colors.foreground} />}
              title="手动输入"
              description="跳过识别，直接拍照后填写完整信息。"
              onPress={() => {
                setMode("manual");
                setStep("photo");
              }}
            />

            <Button variant="ghost" onPress={() => router.push("/settings")} startIcon={<Settings size={16} color={theme.colors.foreground} />}>
              打开设置
            </Button>
          </>
        ) : null}

        {step === "photo" ? (
          <>
            <Badge variant={mode === "ai" ? "default" : "secondary"}>
              {mode === "ai" ? "AI 智能识别模式" : "手动输入模式"}
            </Badge>

            <Card className="overflow-hidden">
              <View className="aspect-[4/3] items-center justify-center bg-muted/40">
                {photoUri ? (
                  <Image source={{ uri: photoUri }} className="h-full w-full" resizeMode="contain" />
                ) : (
                  <View className="items-center gap-3">
                    <View className="h-16 w-16 items-center justify-center rounded-[20px] bg-primary/10">
                      <Camera size={30} color={theme.colors.primary} />
                    </View>
                    <Text className="font-serif text-[20px] text-foreground">选择一张照片</Text>
                    <Text className="text-[13px] text-muted-foreground">支持 JPG / PNG，最大 10MB</Text>
                  </View>
                )}
              </View>
            </Card>

            <View className="flex-row gap-3">
              <Button fullWidth className="flex-1" onPress={() => void pickImage("camera")} startIcon={<Camera size={18} color={theme.colors.primaryForeground} />}>
                拍照
              </Button>
              <Button fullWidth className="flex-1" variant="secondary" onPress={() => void pickImage("library")} startIcon={<ImageIcon size={18} color={theme.colors.secondaryForeground} />}>
                相册选择
              </Button>
            </View>

            {photoUri ? (
              <View className="gap-3">
                {mode === "ai" ? (
                  <Button onPress={() => void handleIdentify()} startIcon={<Bot size={18} color={theme.colors.primaryForeground} />}>
                    开始识别
                  </Button>
                ) : (
                  <Button onPress={() => setStep("form")} startIcon={<Pencil size={18} color={theme.colors.primaryForeground} />}>
                    填写信息
                  </Button>
                )}
                <Button variant="outline" onPress={() => void resetFlow()}>
                  重新开始
                </Button>
              </View>
            ) : null}
          </>
        ) : null}

        {step === "identifying" ? (
          <LoadingState title="AI 正在识别..." description="通常需要 10 到 30 秒，请稍等。" size="lg" />
        ) : null}

        {step === "form" ? (
          <>
            <Card className="overflow-hidden">
              <View className="aspect-[4/3] bg-muted/40">
                {photoUri ? <Image source={{ uri: photoUri }} className="h-full w-full" resizeMode="contain" /> : null}
              </View>
            </Card>

            {aiConfidence ? (
              <Card className="bg-primary/5">
                <CardContent className="flex-row items-center gap-3 pt-4">
                  <CheckCircle2 size={18} color={theme.colors.primary} />
                  <View className="flex-1">
                    <Text className="text-[14px] font-medium text-foreground">AI 已识别出蝴蝶</Text>
                    <Text className="text-[12px] text-muted-foreground">请核对信息后再保存。置信度：{aiConfidence}</Text>
                  </View>
                </CardContent>
              </Card>
            ) : null}

            <ButterflyRecordFormFields
              control={form.control}
              errors={form.formState.errors}
              locating={location.loading}
              onLocatePress={() => void handleLocate()}
            />

            <View className="gap-3">
              <Button onPress={form.handleSubmit((values) => void handleSubmit(values))}>
                保存到收藏
              </Button>
              <Button variant="outline" onPress={() => setStep("photo")}>
                返回照片页
              </Button>
            </View>
          </>
        ) : null}

        {step === "submitting" ? (
          <LoadingState title="正在保存..." description="本地照片和记录正在写入应用私有空间。" size="lg" />
        ) : null}

        {step === "success" ? (
          <EmptyState
            title={`已保存“${form.getValues("name_cn")}”`}
            description="这条记录已经写入本机收藏库，你可以继续采集，或者回到首页查看。"
            icon={<CheckCircle2 size={44} color={theme.colors.primary} />}
            action={
              <View className="w-full gap-3">
                <Button fullWidth onPress={() => router.replace("/")}>
                  返回首页
                </Button>
                <Button fullWidth variant="outline" onPress={() => void resetFlow()}>
                  继续采集
                </Button>
              </View>
            }
          />
        ) : null}

        {error ? (
          <Card className="border-destructive/20 bg-destructive/10">
            <CardContent className="flex-row items-start gap-3 pt-4">
              <AlertCircle size={18} color={theme.colors.destructive} />
              <View className="flex-1 gap-1">
                <Text className="text-[14px] font-medium text-destructive">发生了一点问题</Text>
                <Text className="text-[13px] leading-5 text-destructive">{error}</Text>
                {isNotButterfly ? (
                  <Button variant="ghost" className="self-start px-0" textClassName="text-destructive" onPress={() => setStep("photo")}>
                    换一张照片
                  </Button>
                ) : null}
              </View>
            </CardContent>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

function ModeCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <Button variant="ghost" className="justify-start px-0 py-0" contentClassName="justify-start" onPress={onPress}>
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-muted">{icon}</View>
            <View className="flex-1">
              <Text className="text-[16px] font-medium text-foreground">{title}</Text>
              <Text className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</Text>
            </View>
          </View>
        </Button>
      </CardContent>
    </Card>
  );
}
