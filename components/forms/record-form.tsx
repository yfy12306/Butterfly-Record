"use client";

import { useState } from "react";

type RecordFormProps = {
  speciesOptions: Array<{ id: string; label: string }>;
  regionOptions: Array<{ id: string; label: string }>;
  defaultValues?: {
    id?: string;
    speciesId?: string;
    regionId?: string;
    observedAt?: string;
    locationDetail?: string;
    status?: string;
    quantity?: number;
    note?: string;
  };
};

export function RecordForm({ speciesOptions, regionOptions, defaultValues }: RecordFormProps) {
  const [pending, setPending] = useState(false);
  const isEditing = Boolean(defaultValues?.id);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(isEditing ? `/api/records/${defaultValues?.id}` : "/api/records", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setPending(false);

    if (response.ok) {
      window.location.reload();
      return;
    }

    alert("保存记录失败，请检查输入后重试。");
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2"
    >
      <select name="speciesId" defaultValue={defaultValues?.speciesId} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
        <option value="">选择物种</option>
        {speciesOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <select name="regionId" defaultValue={defaultValues?.regionId} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
        <option value="">选择地区</option>
        {regionOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <input
        name="observedAt"
        type="date"
        defaultValue={defaultValues?.observedAt}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      <select name="status" defaultValue={defaultValues?.status ?? "confirmed"} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
        <option value="confirmed">已确认</option>
        <option value="pending_identification">待鉴定</option>
        <option value="observed">观察记录</option>
      </select>
      <input
        name="locationDetail"
        defaultValue={defaultValues?.locationDetail}
        placeholder="地点描述"
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="quantity"
        type="number"
        min={1}
        defaultValue={defaultValues?.quantity ?? 1}
        placeholder="数量"
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        name="note"
        defaultValue={defaultValues?.note}
        placeholder="备注"
        className="min-h-28 rounded-xl border border-slate-300 px-3 py-2 text-sm lg:col-span-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "保存中..." : isEditing ? "更新记录" : "新增记录"}
      </button>
    </form>
  );
}
