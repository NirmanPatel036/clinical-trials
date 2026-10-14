"use client";

import { useEffect, useRef } from "react";

import { s } from "@/lib/s";

export const CODE_LENGTH = 6;
const BOX = "width:48px;height:56px;text-align:center;font-family:var(--font-mono),ui-monospace,monospace;font-size:22px;border:1px solid #D6D2C6;border-radius:12px;background:#FFFFFF;color:#142237;padding:0";

/** Six one-digit boxes for a one-time code. Typing advances, Backspace goes back, a pasted or autofilled code fills them all. */
export function CodeInput({ value, onChange, label }: { value: string; onChange: (code: string) => void; label: string }) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => boxes.current[Math.max(0, Math.min(i, CODE_LENGTH - 1))]?.focus();
  // Move focus only after the new value has rendered; focusing earlier runs onFocus against the old value, which bounces it back.
  const target = useRef<number | null>(null);
  useEffect(() => {
    if (target.current == null) return;
    focus(target.current);
    target.current = null;
  }, [value]);
  const change = (next: string, focusAt: number) => {
    if (next === value) return focus(focusAt);
    target.current = focusAt;
    onChange(next);
  };

  function put(i: number, typed: string) {
    const digits = typed.replace(/\D/g, "");
    if (!digits) return;
    change((value.slice(0, i) + digits + value.slice(i + digits.length)).slice(0, CODE_LENGTH), i + digits.length);
  }

  function key(i: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft") return focus(i - 1);
    if (event.key === "ArrowRight") return focus(i + 1);
    if (event.key !== "Backspace") return;
    event.preventDefault();
    const at = value[i] ? i : i - 1;
    if (at < 0) return;
    change(value.slice(0, at) + value.slice(at + 1), at);
  }

  return (
    <div role="group" aria-label={label} style={s("display:flex;gap:8px")}>
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <input key={i} ref={(el) => { boxes.current[i] = el; }} className="field" value={value[i] ?? ""} aria-label={`${label}, digit ${i + 1} of ${CODE_LENGTH}`}
          inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} autoFocus={i === 0}
          // Boxes fill left to right; clicking past the first empty one lands on it.
          onFocus={(e) => { if (i > value.length) focus(value.length); else e.target.select(); }}
          onChange={(e) => put(i, e.target.value)} onKeyDown={(e) => key(i, e)}
          onPaste={(e) => { e.preventDefault(); put(0, e.clipboardData.getData("text")); }} style={s(BOX)} />
      ))}
    </div>
  );
}
