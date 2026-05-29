"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export type DiscoverProfile = {
  userId: string;
  displayName: string;
  age: number;
  bio?: string | null;
  city?: string | null;
  jobTitle?: string | null;
  education?: string | null;
  photos: { url: string }[];
  promptAnswers?: { answer: string; prompt: { key: string } }[];
};

export function ProfileCard({ profile }: { profile: DiscoverProfile }) {
  const t = useTranslations("prompts");
  const photo = profile.photos[0]?.url;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
      <div className="relative aspect-[3/4] w-full bg-[var(--border)]">
        {photo ? (
          <Image src={photo} alt={profile.displayName} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--muted)]">No photo</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-24 text-white">
          <h2 className="text-2xl font-bold">
            {profile.displayName}, {profile.age}
          </h2>
          {(profile.jobTitle || profile.city) && (
            <p className="text-sm opacity-90">
              {[profile.jobTitle, profile.city].filter(Boolean).join(" · ")}
            </p>
          )}
          {profile.bio && <p className="mt-2 line-clamp-3 text-sm">{profile.bio}</p>}
        </div>
      </div>
      {profile.promptAnswers && profile.promptAnswers.length > 0 && (
        <div className="space-y-2 p-4">
          {profile.promptAnswers.map((pa) => (
            <div key={pa.prompt.key} className="rounded-xl bg-[var(--background)] p-3 text-sm">
              <p className="font-medium text-[var(--primary)]">{t(pa.prompt.key as never)}</p>
              <p className="mt-1">{pa.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
