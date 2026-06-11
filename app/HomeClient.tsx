"use client";

import { useEffect, useRef, useState } from "react";

// ── Animated counter ──────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

export function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(value, 1600, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-400 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

// ── Anonymous quotes carousel ─────────────────────────────────────
const QUOTES = [
  { text: "I finally said what I've been holding in for six years. Nobody knows it was me, but I know — and that's enough.", role: "Patrol Officer · 8 yrs" },
  { text: "Found out my department was paying rookies 20% more than me. Would never have known without this community.", role: "Firefighter · 11 yrs" },
  { text: "The mental health threads here are the most honest conversations I've ever had about this job.", role: "EMT · 4 yrs" },
  { text: "Used the reviews to pick my new department. Best decision I ever made in my career.", role: "Dispatcher · 6 yrs" },
];

export function QuoteCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % QUOTES.length), 4500);
    return () => clearInterval(t);
  }, []);
  const q = QUOTES[active];
  return (
    <div className="relative overflow-hidden">
      <div key={active} className="animate-fade-up">
        <blockquote className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-4">
          &ldquo;{q.text}&rdquo;
        </blockquote>
        <p className="text-red-400 text-sm font-semibold">{q.role}</p>
      </div>
      <div className="flex gap-1.5 mt-6">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-red-500" : "w-1.5 bg-slate-600"}`}
          />
        ))}
      </div>
    </div>
  );
}
