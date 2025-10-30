"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type OpsData = {
  date: string;
  users: { newUsers: number; dau: number };
  views: { totalViews: number };
  matches: { created: number; accepted: number; contacteds: number };
  feedbacks: { created: number; interviewsDone: number };
};

export default function OpsReportPage() {
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const [date, setDate] = useState<string>(todayStr);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OpsData | null>(null);

  async function fetchData(targetDate: string) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/ops-report?date=${encodeURIComponent(targetDate)}`);
      const json = await res.json();
      if (!json?.success) {
        throw new Error(json?.message || "加载失败");
      }
      setData(json.data as OpsData);
    } catch (e: any) {
      setError(e?.message || "加载失败");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setDate(v);
  }

  function onApply() {
    fetchData(date);
  }

  function onExportCSV() {
    if (!data) return;
    const headers = [
      "date",
      "newUsers",
      "dau",
      "totalViews",
      "matchesCreated",
      "matchesAccepted",
      "contacteds",
      "feedbacksCreated",
      "interviewsDone",
    ];
    const row = [
      data.date,
      String(data.users.newUsers),
      String(data.users.dau),
      String(data.views.totalViews),
      String(data.matches.created),
      String(data.matches.accepted),
      String(data.matches.contacteds),
      String(data.feedbacks.created),
      String(data.feedbacks.interviewsDone),
    ];
    const csv = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ops-report-${data.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">每日运营报表</h1>
          <p className="text-sm text-muted-foreground mt-1">切换日期查看当日核心指标</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-sm mb-1">选择日期</label>
            <Input type="date" value={date} onChange={onDateChange} className="w-[180px]" />
          </div>
          <Button onClick={onApply} disabled={loading}>应用</Button>
          <Button variant="secondary" onClick={onExportCSV} disabled={!data}>导出CSV</Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">加载中…</CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">加载失败</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      )}

      {data && !loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="新增注册" value={data.users.newUsers} subtitle={data.date} />
            <MetricCard title="DAU（日活）" value={data.users.dau} subtitle={data.date} />
            <MetricCard title="当天浏览总次数" value={data.views.totalViews} subtitle={data.date} />
            <MetricCard title="匹配创建" value={data.matches.created} subtitle={data.date} />
            <MetricCard title="匹配成功（accepted）" value={data.matches.accepted} subtitle={data.date} />
            <MetricCard title="实际联系（contacted）" value={data.matches.contacteds} subtitle={data.date} />
            <MetricCard title="反馈提交" value={data.feedbacks.created} subtitle={data.date} />
            <MetricCard title="完成面试（反馈yes）" value={data.feedbacks.interviewsDone} subtitle={data.date} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>DAU 基于 `user_daily_views` 当日去重用户数。</p>
              <p>匹配成功为当日 `matches.status = accepted` 且创建时间落在当日。</p>
              <p>联系人数以 `matches.contactStatus = contacted` 且 `contactUpdatedAt` 为当日统计。</p>
              <p>反馈数据以 `feedbacks.created_at` 为当日统计，完成面试为 `interview_status = yes`。</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {subtitle ? <div className="text-xs text-muted-foreground mt-1">{subtitle}</div> : null}
      </CardContent>
    </Card>
  );
}


