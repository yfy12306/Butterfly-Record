"use client";

import { useState } from "react";

export function ImageActions({
  imageId,
  initialTitle,
  initialDescription,
  isCover
}: {
  imageId: string;
  initialTitle?: string | null;
  initialDescription?: string | null;
  isCover: boolean;
}) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [pending, setPending] = useState(false);

  async function updateImage(payload: Record<string, unknown>) {
    setPending(true);
    const response = await fetch(`/api/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setPending(false);
    if (response.ok) {
      window.location.reload();
      return;
    }
    alert("图片更新失败。");
  }

  async function removeImage() {
    if (!window.confirm("确认删除这张图片吗？")) return;

    setPending(true);
    const response = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
    setPending(false);
    if (response.ok) {
      window.location.reload();
      return;
    }
    alert("删除失败。");
  }

  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        placeholder="标题"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        placeholder="说明"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => updateImage({ title, description })}
          className="rounded-xl bg-ink px-3 py-2 text-sm text-white"
        >
          保存信息
        </button>
        <button
          type="button"
          disabled={pending || isCover}
          onClick={() => updateImage({ isCover: true })}
          className="rounded-xl bg-moss px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {isCover ? "当前封面" : "设为封面"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={removeImage}
          className="rounded-xl bg-ember px-3 py-2 text-sm text-white"
        >
          删除
        </button>
      </div>
    </div>
  );
}
