"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { AppLocale } from "@/i18n/routing";

type Post = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  published: boolean;
};

const emptyForm = {
  id: "",
  slug: "",
  locale: "en" as AppLocale,
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  published: false,
};

export default function AdminBlogPage() {
  const t = useTranslations("admin");
  const currentLocale = useLocale() as AppLocale;
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState({ ...emptyForm, locale: currentLocale });
  const [loading, setLoading] = useState(false);

  function load() {
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setLoading(true);
    const method = form.id ? "PUT" : "POST";
    await fetch("/api/admin/blog", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setForm({ ...emptyForm, locale: currentLocale });
    load();
  }

  async function remove(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
    load();
  }

  function edit(post: Post) {
    setForm({
      id: post.id,
      slug: post.slug,
      locale: post.locale as AppLocale,
      title: post.title,
      excerpt: post.excerpt ?? "",
      content: post.content,
      coverImage: post.coverImage ?? "",
      published: post.published,
    });
  }

  return (
    <AppShell showNav={false}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/admin" className="text-sm text-[var(--muted)]">
          ← Admin
        </Link>
      </div>

      <section className="mt-6 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-semibold">{form.id ? t("editPost") : t("newPost")}</h2>
        <Input
          placeholder={t("slug")}
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />
        <select
          className="w-full rounded-xl border border-[var(--border)] p-2"
          value={form.locale}
          onChange={(e) => setForm({ ...form, locale: e.target.value as AppLocale })}
        >
          <option value="en">English</option>
          <option value="mn">Монгол</option>
          <option value="mn-Inner">ᠮᠣᠩᠭᠣᠯ</option>
        </select>
        <Input
          placeholder={t("postTitle")}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Input
          placeholder={t("excerpt")}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />
        <Input
          placeholder={t("coverImage")}
          value={form.coverImage}
          onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
        />
        <Textarea
          placeholder={t("content")}
          rows={8}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          {t("published")}
        </label>
        <Button disabled={loading} onClick={save}>
          {t("savePost")}
        </Button>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">{t("postsList")}</h2>
        <ul className="space-y-2">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3 text-sm"
            >
              <span>
                [{p.locale}] {p.title} {p.published ? "✓" : "—"}
              </span>
              <div className="flex gap-2">
                <button type="button" className="text-[var(--primary)]" onClick={() => edit(p)}>
                  Edit
                </button>
                <button type="button" className="text-red-600" onClick={() => remove(p.id)}>
                  Del
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
