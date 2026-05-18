"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts"

interface Props {
  sentByDay: { date: string; count: number }[]
  replyRateByDay: { date: string; rate: number }[]
  signalTypes: { name: string; count: number }[]
}

const TS = { backgroundColor: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 0, fontSize: 11, color: "#fff", fontFamily: "monospace" }

export function AnalyticsCharts({ sentByDay, replyRateByDay, signalTypes }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", padding: "20px" }}>
        <p style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", margin: "0 0 16px", letterSpacing: "0.14em", textTransform: "uppercase" as const }}>Emails Sent</p>
        {sentByDay.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" as const, padding: "24px 0", fontFamily: "monospace" }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sentByDay}>
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TS} cursor={{ stroke: "rgba(255,255,255,0.05)" }} />
              <Line type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", padding: "20px" }}>
        <p style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", margin: "0 0 16px", letterSpacing: "0.14em", textTransform: "uppercase" as const }}>Reply Rate (%)</p>
        {replyRateByDay.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" as const, padding: "24px 0", fontFamily: "monospace" }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={replyRateByDay}>
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TS} cursor={{ stroke: "rgba(255,255,255,0.05)" }} />
              <Line type="monotone" dataKey="rate" stroke="#FFD700" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", padding: "20px" }}>
        <p style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", margin: "0 0 16px", letterSpacing: "0.14em", textTransform: "uppercase" as const }}>Signal Types</p>
        {signalTypes.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" as const, padding: "24px 0", fontFamily: "monospace" }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={signalTypes} layout="vertical" barSize={8}>
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={TS} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="count" radius={[0, 1, 1, 0]}>
                {signalTypes.map((_, i) => <Cell key={i} fill={i === 0 ? "#FF6B35" : "#FFD700"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
