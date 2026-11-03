"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLessonComplete } from "@/app/actions/learning";
import { Check } from "@/components/ui/icons";

export function LessonCompleteButton({ lessonId, done, nextHref }: { lessonId: string; done: boolean; nextHref: string | null }) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button suppressHydrationWarning
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await setLessonComplete(lessonId, !optimistic);
          if (!optimistic && nextHref) router.push(nextHref);
          else router.refresh();
        })
      }
      className={`btn ${optimistic ? "btn-ghost text-success" : "btn-primary"}`}
    >
      <Check size={18} />
      {optimistic ? "Completed" : nextHref ? "Mark complete and continue" : "Mark complete"}
    </button>
  );
}
