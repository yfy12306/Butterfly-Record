"use client";

import { useState } from "react";

export function SpeciesFlagsForm({
  speciesId,
  current
}: {
  speciesId: string;
  current: {
    isTarget: boolean;
    isPendingIdentify: boolean;
    isNewDiscovery: boolean;
    personalNote?: string | null;
  };
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const payload = {
      isTarget: formData.get("isTarget") === "on",
      isPendingIdentify: formData.get("isPendingIdentify") === "on",
      isNewDiscovery: formData.get("isNewDiscovery") === "on",
      personalNote: String(formData.get("personalNote") ?? "")
    };
    const response = await fetch(`/api/species/${speciesId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setPending(false);

    if (response.ok) {
      window.location.reload();
      return;
    }

    alert("更新物种状态失败。");
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
        <input name="isTarget" type="checkbox" defaultChecked={current.isTarget} />
        设为目标种
      </label>
      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
        <input name="isPendingIdentify" type="checkbox" defaultChecked={current.isPendingIdentify} />
        标记为待鉴定
      </label>
      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
        <input name="isNewDiscovery" type="checkbox" defaultChecked={current.isNewDiscovery} />
        标记为新发现
      </label>
      <textarea
        name="personalNote"
        defaultValue={current.personalNote ?? ""}
        placeholder="个人备注"
        className="min-h-28 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
      />
      <button disabled={pending} className="rounded-xl bg-moss px-4 py-2 text-sm font-medium text-white">
        {pending ? "保存中..." : "保存标记"}
      </button>
    </form>
  );
}
