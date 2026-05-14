import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { View } from "react-native";
import { MapPin } from "lucide-react-native";
import { z } from "zod";

import { Button, Input, Textarea } from "@/components/ui";
import { theme } from "@/theme";

export const butterflyFormSchema = z.object({
  name_cn: z.string().trim().min(1, "请输入中文名称"),
  name_en: z.string(),
  latin_name: z.string(),
  family: z.string(),
  subfamily: z.string(),
  genus: z.string(),
  distribution: z.string(),
  habitat: z.string(),
  wingspan: z.string(),
  description: z.string(),
  location: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  notes: z.string(),
});

export type ButterflyFormValues = z.infer<typeof butterflyFormSchema>;

export function createButterflyFormDefaults(values?: Partial<ButterflyFormValues>): ButterflyFormValues {
  return {
    name_cn: values?.name_cn ?? "",
    name_en: values?.name_en ?? "",
    latin_name: values?.latin_name ?? "",
    family: values?.family ?? "",
    subfamily: values?.subfamily ?? "",
    genus: values?.genus ?? "",
    distribution: values?.distribution ?? "",
    habitat: values?.habitat ?? "",
    wingspan: values?.wingspan ?? "",
    description: values?.description ?? "",
    location: values?.location ?? "",
    latitude: values?.latitude ?? "",
    longitude: values?.longitude ?? "",
    notes: values?.notes ?? "",
  };
}

type ButterflyRecordFormFieldsProps = {
  control: Control<ButterflyFormValues>;
  errors: FieldErrors<ButterflyFormValues>;
  locating?: boolean;
  onLocatePress?: () => void;
};

function fieldError(errors: FieldErrors<ButterflyFormValues>, field: keyof ButterflyFormValues) {
  const value = errors[field];
  return typeof value?.message === "string" ? value.message : undefined;
}

export function ButterflyRecordFormFields({
  control,
  errors,
  locating = false,
  onLocatePress,
}: ButterflyRecordFormFieldsProps) {
  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="name_cn"
        render={({ field }) => (
          <Input
            label="中文名称 *"
            placeholder="如：枯叶蛱蝶"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldError(errors, "name_cn")}
          />
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="name_en"
            render={({ field }) => (
              <Input
                label="英文名"
                placeholder="如：Common Sergeant"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldError(errors, "name_en")}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="latin_name"
            render={({ field }) => (
              <Input
                label="拉丁学名"
                placeholder="如：Kallima inachus"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldError(errors, "latin_name")}
                inputClassName="italic"
              />
            )}
          />
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="family"
            render={({ field }) => (
              <Input
                label="科"
                placeholder="如：蛱蝶科（Nymphalidae）"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldError(errors, "family")}
                inputClassName="italic"
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="subfamily"
            render={({ field }) => (
              <Input
                label="亚科"
                placeholder="如：蛱蝶亚科（Nymphalinae）"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldError(errors, "subfamily")}
                inputClassName="italic"
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="genus"
            render={({ field }) => (
              <Input
                label="属"
                placeholder="如：蛱蝶属（Kallima）"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldError(errors, "genus")}
                inputClassName="italic"
              />
            )}
          />
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="distribution"
            render={({ field }) => (
              <Input
                label="分布地区"
                placeholder="如：中国南方"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldError(errors, "distribution")}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="habitat"
            render={({ field }) => (
              <Input
                label="栖息环境"
                placeholder="如：热带雨林"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldError(errors, "habitat")}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="wingspan"
        render={({ field }) => (
          <Input
            label="翅展"
            placeholder="如：60-80mm"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldError(errors, "wingspan")}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <Textarea
            label="形态特征描述"
            placeholder="描述蝴蝶的外观、颜色和典型特征..."
            value={field.value}
            onChangeText={field.onChange}
            error={fieldError(errors, "description")}
          />
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <Input
            label="采集地点（可选）"
            placeholder="直接输入，或点击右侧定位"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldError(errors, "location")}
            endAdornment={
              onLocatePress ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  loading={locating}
                  onPress={onLocatePress}
                  accessibilityLabel="获取当前位置"
                >
                  <MapPin size={16} color={theme.colors.primary} />
                </Button>
              ) : null
            }
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <Textarea
            label="备注（可选）"
            placeholder="补充你观察到的内容..."
            value={field.value}
            onChangeText={field.onChange}
            error={fieldError(errors, "notes")}
          />
        )}
      />
    </View>
  );
}
