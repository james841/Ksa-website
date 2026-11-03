"use client";

import { useState } from "react";
import { Play } from "@/components/ui/icons";
import { useLite } from "@/lib/lite";

/**
 * Click-to-load video. Nothing from YouTube or Vimeo is downloaded until the
 * learner presses play, and the button shows roughly how much data it will use.
 */
export function LessonVideo({ embed, title, minutes, hasLightOption }: { embed: string; title: string; minutes: number | null; hasLightOption: boolean }) {
  const [on, setOn] = useState(false);
  const lite = useLite(false);

  // Rough figures: 240p-360p streams use about 3-5 MB a minute, HD about 15 MB or more.
  const low = minutes ? `${minutes * 3}-${minutes * 5} MB` : "3-5 MB a minute";
  const hd = minutes ? `${minutes * 15} MB or more` : "15 MB a minute or more";

  if (on) {
    const sep = embed.includes("?") ? "&" : "?";
    // Vimeo accepts a starting quality. YouTube picks quality itself (use the gear icon to lower it).
    const quality = lite && embed.includes("player.vimeo.com") ? "&quality=240p" : "";
    return (
      <iframe
        src={`${embed}${sep}autoplay=1${quality}`}
        title={title}
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 bg-ink px-6 text-center text-white">
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOn(true)}
        className="group grid size-20 place-items-center rounded-full bg-blue text-white transition-transform hover:scale-105 focus-visible:outline-white sm:size-24"
        aria-label={`Play video: ${title}`}
      >
        <Play size={30} className="translate-x-0.5" />
      </button>
      <div>
        <p className="font-display text-lg font-semibold">Play the video</p>
        <p className="mt-1 text-sm text-white/70">
          About {low} at low quality (240p or 360p), {hd} in HD.
        </p>
        <p className="mt-1 text-xs text-white/55">Lower the quality with the gear icon in the player to save data.</p>
        {lite && hasLightOption ? (
          <p className="mx-auto mt-3 max-w-md rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/85">Data saver is on. The notes and audio below cover this lesson without video.</p>
        ) : null}
      </div>
    </div>
  );
}
