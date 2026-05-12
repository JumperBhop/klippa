"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { getUserInfo, getUserJobs } from "@/lib/api";

const PLANS = [
  {
    id: "gratis",
    name: "Gratis",
    price: "0",
    credits: 3,
    clips: 3,
    maxLength: "30 Min.",
    quality: "780p",
    watermark: true,
    color: "#6b7280",
    glow: null as string | null,
    badge: null as string | null,
    features: ["3 Clips pro Video", "Max. 30 Min. Videos", "780p Download", "Wasserzeichen auf Clips"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "9",
    credits: 20,
    clips: 5,
    maxLength: "1 Std.",
    quality: "Full HD",
    watermark: false,
    color: "#a855f7",
    glow: "violet" as string | null,
    badge: "Beliebt",
    features: ["5 Clips pro Video", "Max. 1 Std. Videos", "Full HD Download", "Kein Wasserzeichen", "Alle Titel-Styles"],
  },
  {
    id: "star",
    name: "Star",
    price: "25",
    credits: 100,
    clips: 7,
    maxLength: "4 Std.",
    quality: "4K",
    watermark: false,
    color: "#f59e0b",
    glow: "amber" as string | null,
    badge: "⭐ Premium",
    features: ["7 Clips pro Video", "Max. 4 Std. Videos", "4K Download", "Kein Wasserzeichen", "Alle Titel-Styles", "Priorität-Verarbeitung"],
  },
];

export default function ProfilePage() {
  const { user } = useUser();
  const [currentPlan, setCurrentPlan] = useState<"gratis" | "pro" | "star">("gratis");
  const [credits, setCredits] = useState<number | null>(null);
  const [totalCredits, setTotalCredits] = useState(10);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "plan" | "history">("overview");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Fetch credits & jobs independently so one failure doesn't kill the other
      try {
        const info = await getUserInfo(user.id);
        setCurrentPlan(info.plan as any);
        setCredits(info.credits);
        const planData = PLANS.find(p => p.id === info.plan);
        setTotalCredits(planData?.credits ?? 3);
      } catch (e) {
        console.error("Credits fetch error:", e);
      }
      try {
        const jobList = await getUserJobs(user.id);
        setJobs(jobList);
      } catch (e) {
        console.error("Jobs fetch error:", e);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const plan = PLANS.find((p) => p.id === currentPlan)!;
  const doneJobs = jobs.filter(j => j.status === "done");
  const displayCredits = credits ?? 0;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("de-DE", { month: "long", year: "numeric" })
    : "–";

  return (
    <>
      <Navbar variant="app" />

      <main className="min-h-screen pt-20 pb-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="pt-8 pb-6">
            <h1 className="font-bold text-chalk text-3xl md:text-4xl" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Mein Profil
            </h1>
            <p className="text-chalk-dim text-sm mt-1">Verwalte dein Konto und deine Credits</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Credits übrig"
              value={loading ? "…" : displayCredits.toString()}
              sub={`von ${totalCredits} gesamt`}
              accent="#a855f7"
            />
            <StatCard
              label="Plan"
              value={plan.name}
              sub={plan.price === "0" ? "Kostenlos" : `${plan.price}€ / Monat`}
              accent={plan.color}
            />
            <StatCard
              label="Videos verarbeitet"
              value={loading ? "…" : doneJobs.length.toString()}
              sub="gesamt"
              accent="#4f46e5"
            />
            <StatCard
              label="Mitglied seit"
              value={memberSince.split(" ")[1] ?? "2026"}
              sub={memberSince.split(" ")[0] ?? ""}
              accent="#6d28d9"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
            {(["overview", "plan", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${activeTab === tab ? "bg-violet text-white font-medium" : "text-chalk-dim hover:text-chalk"}`}
              >
                {tab === "overview" ? "Übersicht" : tab === "plan" ? "Plan" : "Verlauf"}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-2 gap-4">

              {/* Account info */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-chalk mb-4 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="4.5" r="2.5" stroke="#a855f7" strokeWidth="1.3"/>
                    <path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="#a855f7" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  Konto
                </h2>
                <div className="space-y-3">
                  <InfoRow label="Name" value={user?.fullName ?? user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "Nutzer"} />
                  <InfoRow label="E-Mail" value={user?.emailAddresses[0]?.emailAddress ?? "Keine E-Mail"} />
                  <InfoRow label="Mitglied seit" value={memberSince} />
                  <InfoRow label="Plan" value={plan.name} />
                </div>
              </div>

              {/* Credit status */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-chalk mb-4 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-violet/20 border border-violet flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet" />
                  </div>
                  Credits
                </h2>

                {/* Credit bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-chalk-dim mb-2">
                    <span>{displayCredits} verbleibend</span>
                    <span>{totalCredits} verfügbar</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((displayCredits / totalCredits) * 100, 100)}%`,
                        background: "linear-gradient(90deg, #7c3aed, #a855f7)"
                      }}
                    />
                  </div>
                </div>

                <p className="text-xs text-chalk-dim leading-relaxed mb-5">
                  1 Credit = 1 verarbeitetes Video. Credits verfallen nicht.
                </p>

                <div className="glass-violet rounded-xl p-4 mb-4 text-center">
                  <div className="text-xs text-violet-light font-mono mb-1">Aktueller Plan</div>
                  <div className="font-bold text-chalk text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>{plan.name}</div>
                  <div className="text-xs text-chalk-dim mt-1">{plan.clips} Clips · {plan.maxLength} · {plan.quality}</div>
                </div>

                <button
                  onClick={() => setActiveTab("plan")}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm violet-glow"
                >
                  <span>Upgraden</span>
                </button>
              </div>

              {/* Recent activity */}
              <div className="glass rounded-2xl p-6 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-chalk">Letzte Aktivität</h2>
                  <button onClick={() => setActiveTab("history")} className="text-xs text-violet-light hover:text-chalk transition-colors">
                    Alle anzeigen
                  </button>
                </div>
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-xs text-chalk-dim py-4 text-center">Lädt…</div>
                  ) : doneJobs.slice(0, 2).length > 0 ? (
                    doneJobs.slice(0, 2).map((job) => <JobRow key={job.id} job={job} />)
                  ) : (
                    <div className="text-xs text-chalk-dim py-4 text-center">
                      Noch keine Videos. <Link href="/app" className="text-violet-light hover:underline">Jetzt starten →</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Plan */}
          {activeTab === "plan" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {PLANS.map((p) => {
                  const isCurrent = p.id === currentPlan;
                  return (
                    <div key={p.id} className="relative">
                      {p.glow && (
                        <div
                          className="absolute -inset-[3px] rounded-[20px]"
                          style={{
                            background: p.glow === "violet"
                              ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6d28d9 100%)"
                              : "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)",
                            filter: "blur(8px)",
                            animation: "pulseOpacity 2.5s ease-in-out infinite",
                          }}
                        />
                      )}
                      <div
                        className="relative flex flex-col rounded-2xl overflow-hidden border h-full"
                        style={{
                          borderColor: p.glow === "violet" ? "rgba(168,85,247,0.5)" : p.glow === "amber" ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.07)",
                          background: p.glow === "violet"
                            ? "linear-gradient(145deg, rgba(20,8,40,1) 0%, rgba(12,10,20,1) 100%)"
                            : p.glow === "amber"
                            ? "linear-gradient(145deg, rgba(28,18,4,1) 0%, rgba(12,11,9,1) 100%)"
                            : "rgba(255,255,255,0.03)",
                        }}
                      >
                        {p.glow === "violet" && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-light to-transparent" />}
                        {p.glow === "amber" && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />}

                        {p.badge && (
                          <div className="absolute top-3 right-3">
                            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full" style={{ color: p.color, background: `${p.color}20`, border: `1px solid ${p.color}44` }}>
                              {p.badge}
                            </span>
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute top-3 left-3">
                            <span className="glass text-chalk text-[10px] font-mono px-2 py-1 rounded-full border border-white/20">Aktiv</span>
                          </div>
                        )}

                        <div className="p-6 flex flex-col flex-1">
                          <div className="mb-4">
                            <div className="font-bold text-chalk text-lg mb-0.5" style={{ fontFamily: "'Clash Display', sans-serif" }}>{p.name}</div>
                            <div className="flex items-end gap-1">
                              {p.price === "0" ? (
                                <span className="text-2xl font-bold text-chalk-dim" style={{ fontFamily: "'Clash Display', sans-serif" }}>0 €</span>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold text-chalk" style={{ fontFamily: "'Clash Display', sans-serif" }}>{p.price}€</span>
                                  <span className="text-chalk-dim text-xs mb-1">/Monat</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full w-fit mb-4">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-xs text-chalk-dim">
                              <span className="font-semibold" style={{ color: p.color }}>{p.credits}</span> Credits
                            </span>
                          </div>

                          <ul className="flex flex-col gap-2 mb-6 flex-1">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-xs text-chalk-dim">
                                <svg className="mt-0.5 flex-shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2.5 6l3 3 4-5" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {f}
                              </li>
                            ))}
                          </ul>

                          <button
                            disabled={isCurrent}
                            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${isCurrent ? "glass text-chalk-dim cursor-default" : p.glow ? "btn-primary" : "btn-ghost"}`}
                            style={p.glow && !isCurrent ? { boxShadow: `0 0 20px ${p.color}55` } : {}}
                          >
                            <span>{isCurrent ? "Aktueller Plan" : `Zu ${p.name} wechseln`}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h3 className="text-sm font-semibold text-chalk">Plan-Vergleich</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left p-4 text-chalk-dim font-normal">Feature</th>
                        {PLANS.map((p) => (
                          <th key={p.id} className="p-4 text-center font-semibold" style={{ color: p.id === currentPlan ? "#a855f7" : "#f5f5f5" }}>{p.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Credits", values: ["3", "20", "100"] },
                        { label: "Clips pro Video", values: ["3", "5", "7"] },
                        { label: "Max. Videolänge", values: ["30 Min.", "1 Std.", "4 Std."] },
                        { label: "Download-Qualität", values: ["780p", "Full HD", "4K"] },
                        { label: "Wasserzeichen", values: ["Ja", "Nein", "Nein"] },
                        { label: "Titel-Styles", values: ["Standard", "Alle", "Alle"] },
                      ].map((row, i) => (
                        <tr key={row.label} className={i % 2 === 0 ? "bg-white/[0.01]" : ""}>
                          <td className="p-4 text-chalk-dim">{row.label}</td>
                          {row.values.map((v, j) => (
                            <td key={j} className="p-4 text-center text-chalk">
                              {v === "Nein" ? <span className="text-emerald-400">✓</span> : v === "Ja" ? <span className="text-chalk-dim">–</span> : v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab: History */}
          {activeTab === "history" && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-chalk">Verlauf</h3>
                <span className="text-xs text-chalk-dim">{doneJobs.length} Videos</span>
              </div>
              <div className="divide-y divide-white/5">
                {loading ? (
                  <div className="p-8 text-center text-chalk-dim text-sm">Lädt…</div>
                ) : doneJobs.length > 0 ? (
                  doneJobs.map((job) => <JobRow key={job.id} job={job} full />)
                ) : (
                  <div className="p-12 text-center text-chalk-dim text-sm">
                    Noch keine Videos verarbeitet.{" "}
                    <Link href="/app" className="text-violet-light hover:underline">Jetzt starten →</Link>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs text-chalk-dim mb-2">{label}</div>
      <div className="font-bold text-2xl mb-0.5" style={{ fontFamily: "'Clash Display', sans-serif", color: accent }}>{value}</div>
      <div className="text-[11px] text-chalk-dim">{sub}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-chalk-dim">{label}</span>
      <span className="text-xs text-chalk">{value}</span>
    </div>
  );
}

function JobRow({ job, full }: { job: any; full?: boolean }) {
  const [open, setOpen] = useState(false);
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const title = job.youtube_url
    ? job.youtube_url.replace("https://www.youtube.com/watch?v=", "youtu.be/").slice(0, 40)
    : job.file_path
    ? job.file_path.split(/[\\/]/).pop()?.slice(0, 40) ?? "Video"
    : "Video";

  const date = new Date(job.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (clips.length > 0) return;
    setLoading(true);
    try {
      const { getClips } = await import("@/lib/api");
      const data = await getClips(job.id);
      setClips(data);
    } catch {
      setClips([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-4 cursor-pointer hover:bg-white/[0.03] transition-colors rounded-xl ${full ? "px-5 py-4" : "py-3 px-2"}`}
        onClick={handleOpen}
      >
        <div className="w-8 h-8 rounded-lg glass-violet flex-shrink-0 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 3l7 4-7 4V3z" fill="#a855f7"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-chalk truncate">{title}</div>
          <div className="text-[11px] text-chalk-dim mt-0.5">{date}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
            <span className="text-[11px] text-chalk-dim">Fertig</span>
          </div>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={`text-chalk-dim transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {open && (
        <div className="mx-2 mb-3 mt-1 glass rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-6 text-center text-xs text-chalk-dim">Lade Clips…</div>
          ) : clips.length === 0 ? (
            <div className="py-6 text-center text-xs text-chalk-dim">Clips nicht mehr verfügbar (älter als 24h)</div>
          ) : (
            <div className="divide-y divide-white/5">
              {clips.map((clip, i) => (
                <div key={clip.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-violet/20 border border-violet/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-violet-light">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-chalk truncate">{clip.title || `Clip ${i + 1}`}</div>
                    <div className="text-[10px] text-chalk-dim mt-0.5">{clip.duration} · Score {clip.score}</div>
                  </div>
                  <a
                    href={`https://api.getklippa.de${clip.download_url}`}
                    download
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-[11px] text-violet-light hover:text-chalk transition-colors flex-shrink-0"
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M5.5 1v6M3 5.5l2.5 2.5 2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1.5 9h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
