"use client";

import { useState } from "react";

export function ImageUploadForm({
  speciesId,
  recordOptions
}: {
  speciesId: string;
  recordOptions: Array<{ id: string; label: string }>;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const response = await fetch(`/api/species/${speciesId}/images`, {
      method: "POST",
      body: formData
    });
    setPending(false);

    if (response.ok) {
      window.location.reload();
      return;
    }

    alert("上传失败，请确认文件和信息。");
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <input name="file" type="file" accept="image/*,.svg" required className="block w-full text-sm" />
      <select name="collectionRecordId" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
        <option value="">不绑定具体记录</option>
        {recordOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <input name="title" placeholder="图片标题" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
      <textarea name="description" placeholder="图片说明" className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
      <button disabled={pending} className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
        {pending ? "上传中..." : "上传图片"}
      </button>
    </form>
  );
}
