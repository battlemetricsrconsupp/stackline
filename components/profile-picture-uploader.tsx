"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";

type Props = {
  initialImage?: string | null;
};

export function ProfilePictureUploader({ initialImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(initialImage || "");
  const [pending, startTransition] = useTransition();

  async function upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) return;

    const data = (await response.json()) as { url: string };
    setImage(data.url);
  }

  return (
    <div className="panel rounded-[2rem] p-5">
      <div className="mb-4 flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          {image ? (
            <Image src={image} alt="Profile preview" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-soft)]">
              No photo
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-white">Profile picture</p>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            Upload an avatar so teammates can spot you quickly.
          </p>
        </div>
      </div>

      <input type="hidden" name="image" value={image} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          startTransition(async () => {
            await upload(file);
          });
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-[var(--accent)]/40"
      >
        <ImagePlus className="h-4 w-4" />
        {pending ? "Uploading..." : "Upload image"}
      </button>
    </div>
  );
}
