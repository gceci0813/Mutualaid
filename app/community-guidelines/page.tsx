import Link from "next/link";
import { Users, Shield, EyeOff, MessageSquare, Flag, Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "Community Guidelines for MutualAid — rules of the road for the anonymous first responder community.",
};

const GUIDELINES = [
  {
    icon: EyeOff,
    title: "Protect everyone's anonymity — including your own",
    body: "Never post names, badge numbers, unit assignments, or details that could identify another person (or yourself). Doxxing is the fastest way to lose your account. If your story is identifying, generalize it.",
  },
  {
    icon: Shield,
    title: "Speak from your own experience",
    body: "Reviews should reflect what you actually experienced at your agency. Honest criticism is the point of this platform — fabrication is not. Don't post reviews of agencies you never worked for.",
  },
  {
    icon: MessageSquare,
    title: "Debate ideas, not people",
    body: "Disagreement is healthy; harassment isn't. No threats, no pile-ons, no slurs. The person on the other side of the screen runs toward danger for a living — treat them accordingly.",
  },
  {
    icon: Scale,
    title: "Respect the law and your oath",
    body: "Don't share confidential investigation details, restricted intelligence, or anything your department policy or the law prohibits disclosing. Workplace conditions are fair game; operational secrets are not.",
  },
  {
    icon: Flag,
    title: "Report, don't retaliate",
    body: "See something that breaks these rules? Use the Report button — every review, thread, and comment has one. Our moderation team reviews every report. Don't engage in flame wars.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Community</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Community Guidelines</h1>
          <p className="text-slate-500 text-lg max-w-xl">
            Five rules that keep this place honest, safe, and worth coming back to.
          </p>
        </div>
      </div>

      <div className="page-container py-10 max-w-3xl">
        <div className="space-y-5">
          {GUIDELINES.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="card p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 mb-1.5">
                  {i + 1}. {title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-6 mt-8 bg-slate-50">
          <h2 className="font-bold text-slate-900 mb-2">Enforcement</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Violations are handled case by case: content removal for first offenses, account suspension
            for repeated or severe violations, and permanent bans for doxxing or threats. We don&apos;t
            remove content because an agency dislikes it — only because it breaks these rules or our{" "}
            <Link href="/terms" className="text-red-600 hover:text-red-700 font-medium">Terms of Service</Link>.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Questions about a removal? Reach out through your dashboard and we&apos;ll explain the decision.
          </p>
        </div>
      </div>
    </>
  );
}
