"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export function NewTopicForm() {
  const t = useTranslations("forum");
  const locale = useLocale();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, locale }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("createError"));
      return;
    }
    router.push(`/forum/${data.topic.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("topicTitlePlaceholder")}
        required
        minLength={5}
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("topicBodyPlaceholder")}
        rows={8}
        required
        minLength={10}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("posting") : t("postTopic")}
      </Button>
    </form>
  );
}
