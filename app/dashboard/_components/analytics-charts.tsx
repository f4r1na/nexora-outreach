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

const TS = { backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 6, fontSize: 12, color: "#ffffff" }

export function AnalyticsCharts({ sentByDay, replyRateByDay, signalTypes }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "20px" }}>
        <p style={{ fontSize: 13, color: "#666666", margin: "0 0 16px" }}>Emails Sent</p>
        {sentByDay.length === 0 ? (
          <p style={{ fontSize: 13, color: "#333333", textAlign: "center", padding: "24px 0" }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sentByDay}>
              <XAxis dataKey="date" tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TS} cursor={{ stroke: "#1a1a1a" }} />
              <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "20px" }}>
        <p style={{ fontSize: 13, color: "#666666", margin: "0 0 16px" }}>Reply Rate (%)</p>
        {replyRateByDay.length === 0 ? (
          <p style={{ fontSize: 13, color: "#333333", textAlign: "center", padding: "24px 0" }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={replyRateByDay}>
              <XAxis dataKey="date" tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TS} cursor={{ stroke: "#1a1a1a" }} />
              <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "20px" }}>
        <p style={{ fontSize: 13, color: "#666666", margin: "0 0 16px" }}>Signal Types</p>
        {signalTypes.length === 0 ? (
          <p style={{ fontSize: 13, color: "#333333", textAlign: "center", padding: "24px 0" }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={signalTypes} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={TS} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                {signalTypes.map((_, i) => <Cell key={i} fill={i === 0 ? "#f97316" : "#fbbf24"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
