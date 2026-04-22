"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageWrapper } from "../../_components/motion";
import {
  Calendar, Clock, Users, Video, ExternalLink,
  Loader2, AlertCircle, Link2, CalendarDays,
} from "lucide-react";

type CalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: { email: string; name?: string; self?: boolean }[];
  hangoutLink: string | null;
  htmlLink: string | null;
  location: string | null;
  status: string;
};

type BookingLink = {
  id: string;
  email: string;
  url: string;
  platform: "calendly" | "cal" | "other";
};

type Reply = { id: string; lead_email: string; reply_body: string };

const BOOKING_PATTERNS: { platform: BookingLink["platform"]; re: RegExp }[] = [
  { platform: "calendly", re: /https?:\/\/calendly\.com\/[^\s<>"'\])]+/gi },
  { platform: "cal",      re: /https?:\/\/cal\.com\/[^\s<>"'\])]+/gi },
];

function extractBookingLinks(replies: Reply[]): BookingLink[] {
  const links: BookingLink[] = [];
  const seen = new Set<string>();
  for (const reply of replies) {
    for (const { platform, re } of BOOKING_PATTERNS) {
      const matches = reply.reply_body.match(re) ?? [];
      for (const raw of matches) {
        const url = raw.replace(/[.,;)]+$/, "");
        if (!seen.has(url)) {
          seen.add(url);
          links.push({ id: reply.id, email: reply.lead_email, url, platform });
        }
      }
    }
  }
  return links;
}

function formatTime(start: string, end: string): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${fmt(new Date(start))} - ${fmt(new Date(end))}`;
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const day      = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day.getTime() === today.getTime())    return "Today";
  if (day.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(events: CalEvent[]) {
  const map = new Map<string, CalEvent[]>();
  for (const e of events) {
    const label = getDateLabel(e.start);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return Array.from(map.entries()).map(([label, evts]) => ({ label, evts }));
}

function PlatformBadge({ platform }: { platform: BookingLink["platform"] }) {
  const cfg = {
    calendly: { label: "Calendly", color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)" },
    cal:      { label: "Cal.com",  color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
    other:    { label: "Booking",  color: "#888",    bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" },
  }[platform];
  return (
    <span style={{
      fontSize: 9, fontWeight: 500, color: cfg.color,
      backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 999, padding: "2px 7px",
      fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {cfg.label}
    </span>
  );
}

function MeetingCard({ event, idx }: { event: CalEvent; idx: number }) {
  const guests = event.attendees.filter((a) => !a.self);
  const isPast = new Date(event.end) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut", delay: idx * 0.04 }}
      style={{
        display: "flex",
        backgroundColor: "#0e0e18",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10, overflow: "hidden",
        opacity: isPast ? 0.5 : 1,
      }}
    >
      <div style={{ width: 3, flexShrink: 0, backgroundColor: isPast ? "rgba(255,255,255,0.08)" : "#FF5200" }} />

      <div style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 500,
            color: isPast ? "#555" : "#ccc",
            fontFamily: "var(--font-outfit)", marginBottom: 4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {event.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)" }}>
              <Clock size={10} strokeWidth={2} />
              {formatTime(event.start, event.end)}
            </span>
            {guests.length > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)" }}>
                <Users size={10} strokeWidth={2} />
                {guests.map((g) => g.name ?? g.email).join(", ")}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 5,
                backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                color: "#555", fontSize: 11, fontFamily: "var(--font-outfit)", textDecoration: "none",
              }}
            >
              <CalendarDays size={10} strokeWidth={2} />
              View
            </a>
          )}
          {event.hangoutLink && !isPast && (
            <a
              href={event.hangoutLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 5,
                backgroundColor: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                color: "#4ade80", fontSize: 11, fontFamily: "var(--font-outfit)", textDecoration: "none",
              }}
            >
              <Video size={10} strokeWidth={2} />
              Join
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MeetingsPage() {
  const [events,       setEvents]       = useState<CalEvent[]>([]);
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [calError,     setCalError]     = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [calRes, repliesRes] = await Promise.all([
          fetch("/api/calendar/get-meetings"),
          fetch("/api/replies"),
        ]);

        if (calRes.ok) {
          const d = await calRes.json() as { events?: CalEvent[] };
          setEvents(d.events ?? []);
        } else {
          const d = await calRes.json() as { error?: string };
          setCalError(d.error ?? "failed");
        }

        if (repliesRes.ok) {
          const d = await repliesRes.json() as { replies?: Reply[] };
          setBookingLinks(extractBookingLinks(d.replies ?? []));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = new Date();
  const upcoming   = events.filter((e) => new Date(e.end) >= now);
  const thisMonth  = events.filter((e) => {
    const d = new Date(e.start);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const grouped = groupByDate(upcoming);

  const stats = [
    { label: "Meetings this month", value: thisMonth.length },
    { label: "Upcoming",            value: upcoming.length  },
    { label: "Booking links found", value: bookingLinks.length },
  ];

  const errorLabel =
    calError === "no_connection"       ? "no_connection"    :
    calError === "calendar_scope_missing" ? "scope_missing" :
    calError ? "other" : null;

  return (
    <PageWrapper>
      {/* Header */}
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(8,8,16,0.94)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
            Inbox
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", margin: 0, marginTop: 3 }}>
            Calendar and booking activity
          </p>
        </div>
      </header>

      {/* Sub-tabs */}
      <div style={{ display: "flex", padding: "0 32px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link
          href="/dashboard/inbox"
          style={{ padding: "10px 16px", fontSize: 12, fontFamily: "var(--font-outfit)", color: "#484848", textDecoration: "none" }}
        >
          Messages
        </Link>
        <div style={{ position: "relative" }}>
          <span style={{ display: "block", padding: "10px 16px", fontSize: 12, fontFamily: "var(--font-outfit)", color: "#ddd" }}>
            Meetings
          </span>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, backgroundColor: "#FF5200" }} />
        </div>
      </div>

      <main style={{ flex: 1, padding: "24px 32px 64px", maxWidth: 720 }}>

        {/* Stats */}
        {!loading && !errorLabel && (
          <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
            {stats.map((s) => (
              <div key={s.label} style={{
                flex: 1, padding: "14px 18px",
                backgroundColor: "#0e0e18",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
              }}>
                <p style={{ fontSize: 22, fontWeight: 600, color: "#ccc", fontFamily: "var(--font-syne)", lineHeight: 1, marginBottom: 4 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-outfit)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>

        ) : errorLabel === "no_connection" ? (
          <div style={{
            backgroundColor: "#0e0e18", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10, padding: "52px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <Calendar size={28} strokeWidth={1.3} color="#333" />
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-syne)", margin: 0 }}>No Google account connected</h3>
            <p style={{ fontSize: 13, color: "#444", fontFamily: "var(--font-outfit)", textAlign: "center", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
              Connect your Gmail account from the Agent page to enable calendar sync.
            </p>
          </div>

        ) : errorLabel === "scope_missing" ? (
          <div style={{
            backgroundColor: "#0e0e18", border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: 10, padding: "20px 22px",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <AlertCircle size={15} strokeWidth={1.5} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#ddd", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
                Calendar access not authorized
              </p>
              <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", lineHeight: 1.6 }}>
                Your Google account is connected but calendar read permission was not granted. Reconnect your Gmail account and allow calendar access to see meetings here.
              </p>
            </div>
          </div>

        ) : errorLabel === "other" ? (
          <div style={{
            backgroundColor: "#0e0e18", border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 10, padding: "20px 22px",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <AlertCircle size={15} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "#ef4444", fontFamily: "var(--font-outfit)" }}>{calError}</p>
          </div>

        ) : (
          <>
            {/* Upcoming meetings */}
            <div style={{ marginBottom: 36 }}>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 14 }}>
                Upcoming Meetings
              </p>

              {grouped.length === 0 ? (
                <div style={{
                  backgroundColor: "#0e0e18", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10, padding: "44px 24px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                }}>
                  <CalendarDays size={24} strokeWidth={1.3} color="#333" />
                  <p style={{ fontSize: 13, color: "#444", fontFamily: "var(--font-outfit)" }}>
                    No upcoming meetings in the next 30 days
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {grouped.map(({ label, evts }) => (
                    <div key={label}>
                      <p style={{ fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 8, letterSpacing: "0.03em" }}>
                        {label}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {evts.map((e, i) => <MeetingCard key={e.id} event={e} idx={i} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking links */}
            {bookingLinks.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 14 }}>
                  Booking Links in Replies
                </p>
                <div style={{ backgroundColor: "#0e0e18", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                  {bookingLinks.map((link, i) => (
                    <div
                      key={`${link.id}-${i}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "13px 18px",
                        borderBottom: i < bookingLinks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <Link2 size={12} strokeWidth={2} color="#555" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#888", fontFamily: "var(--font-outfit)" }}>{link.email}</span>
                          <PlatformBadge platform={link.platform} />
                        </div>
                        <p style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-outfit)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {link.url}
                        </p>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 10px", borderRadius: 5, flexShrink: 0,
                          backgroundColor: "rgba(255,82,0,0.07)", border: "1px solid rgba(255,82,0,0.18)",
                          color: "#FF5200", fontSize: 11, fontFamily: "var(--font-outfit)", textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={10} strokeWidth={2} />
                        Book
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </PageWrapper>
  );
}
