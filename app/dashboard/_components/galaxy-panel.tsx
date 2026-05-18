"use client"
import { useEffect, useRef } from "react"
import { useAgent } from "@/contexts/agent-context"

const ORBS = [
  { id: "o1", x: 108, y: 78,  size: 20, type: "orange" as const, label: "SaaS Founders", sub: "47 leads · 22% reply", rings: 2 },
  { id: "o2", x: 55,  y: 168, size: 15, type: "orange" as const, label: "FinTech CTOs",  sub: "23 leads · sending",  rings: 1 },
  { id: "o3", x: 172, y: 198, size: 12, type: "orange" as const, label: "DevTools",      sub: "89 leads · 31% reply", rings: 1 },
  { id: "o4", x: 125, y: 310, size: 13, type: "orange" as const, label: "E-comm Founders", sub: "draft · 12 leads",  rings: 1 },
  { id: "s1", x: 148, y: 118, size: 9,  type: "yellow" as const, label: "DataFlow $5M",  sub: "Series A · 2d ago",  rings: 0 },
  { id: "s2", x: 82,  y: 222, size: 8,  type: "yellow" as const, label: "CloudSync",     sub: "Hiring VP Sales",    rings: 0 },
  { id: "s3", x: 44,  y: 282, size: 10, type: "yellow" as const, label: "Velocity AI",   sub: "HN Hiring · 3d ago", rings: 1 },
  { id: "s4", x: 190, y: 262, size: 7,  type: "yellow" as const, label: "StackPilot",    sub: "Launched v2",        rings: 0 },
  { id: "s5", x: 158, y: 368, size: 8,  type: "yellow" as const, label: "NexGen",        sub: "Raised $2M",         rings: 0 },
  { id: "p1", x: 128, y: 96,  size: 5, type: "white" as const, label: "James Chen", sub: "9.2 / 10", rings: 0 },
  { id: "p2", x: 94,  y: 148, size: 5, type: "white" as const, label: "",           sub: "",         rings: 0 },
  { id: "p3", x: 138, y: 178, size: 4, type: "white" as const, label: "",           sub: "",         rings: 0 },
  { id: "p4", x: 68,  y: 196, size: 4, type: "white" as const, label: "",           sub: "",         rings: 0 },
  { id: "p5", x: 100, y: 258, size: 5, type: "white" as const, label: "",           sub: "",         rings: 0 },
  { id: "p6", x: 155, y: 340, size: 4, type: "white" as const, label: "",           sub: "",         rings: 0 },
]

const LINE_PAIRS: [string, string][] = [
  ["o1","s1"],["o1","p1"],["o1","p2"],["o1","o3"],
  ["o2","s2"],["o2","p4"],["o2","s3"],["o2","p2"],
  ["o3","s4"],["o3","p3"],["o3","o4"],
  ["o4","s5"],["o4","p5"],["o4","p6"],
  ["s1","p1"],["p2","p3"],["p3","o3"],
]

const FLOAT_ANIMS = ["gOrbFloat1","gOrbFloat2","gOrbFloat3","gOrbFloat4","gOrbFloat5","gOrbFloat6"]
const FLOAT_DURS  = [8,10,7,9,6,11,8.5,9.5,7.5,6.5,11,8,10,7,9]

const ORB_STYLES = {
  orange: {
    background: "radial-gradient(circle at 32% 30%,#ffaa77,#FF6B35 45%,#a02800)",
    boxShadow: "0 0 10px rgba(255,107,53,0.9),0 0 26px rgba(255,107,53,0.45),0 0 60px rgba(255,107,53,0.15)",
    boxShadowWorking: "0 0 18px rgba(255,107,53,1),0 0 46px rgba(255,107,53,0.65),0 0 90px rgba(255,107,53,0.25)",
    ringColor: "rgba(255,107,53,",
  },
  yellow: {
    background: "radial-gradient(circle at 32% 30%,#fff4a0,#FFD700 45%,#9a7500)",
    boxShadow: "0 0 8px rgba(255,215,0,0.85),0 0 20px rgba(255,215,0,0.35),0 0 50px rgba(255,215,0,0.12)",
    boxShadowWorking: "0 0 14px rgba(255,215,0,1),0 0 36px rgba(255,215,0,0.55),0 0 80px rgba(255,215,0,0.2)",
    ringColor: "rgba(255,215,0,",
  },
  white: {
    background: "radial-gradient(circle at 35% 30%,#fff,#aaa 60%,#555)",
    boxShadow: "0 0 6px rgba(255,255,255,0.55),0 0 16px rgba(255,255,255,0.15)",
    boxShadowWorking: "0 0 10px rgba(255,255,255,0.8),0 0 28px rgba(255,255,255,0.3)",
    ringColor: "rgba(200,200,200,",
  },
}

type Particle = {
  x: number; y: number; r: number
  vx: number; vy: number; opacity: number
  color: "orange"|"yellow"|"white"
  stream?: boolean; tx?: number; ty?: number
  speed?: number; life?: number
}

export default function GalaxyPanel() {
  const { isWorking } = useAgent()
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)
  const orbRefs    = useRef<Map<string, HTMLDivElement>>(new Map())
  const svgRef     = useRef<SVGSVGElement>(null)
  const stateRef   = useRef({ isWorking: false, particles: [] as Particle[], frame: 0, streamTick: 0 })

  useEffect(() => { stateRef.current.isWorking = isWorking }, [isWorking])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function resize() {
      if (!canvas || !panelRef.current) return
      canvas.width  = panelRef.current.offsetWidth
      canvas.height = panelRef.current.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const orbCenters = [
      { x: 118, y: 88 }, { x: 63, y: 176 }, { x: 178, y: 204 }, { x: 132, y: 317 },
    ]

    function mkParticle(): Particle {
      return {
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: Math.random() * 0.8 + 0.2,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        opacity: Math.random() * 0.35 + 0.05,
        color: (["orange","yellow","white"] as const)[Math.floor(Math.random()*3)],
      }
    }

    function mkStream(tx: number, ty: number): Particle {
      const angle = Math.random() * Math.PI * 2
      const dist  = 60 + Math.random() * 80
      return {
        x: tx + Math.cos(angle) * dist,
        y: ty + Math.sin(angle) * dist,
        tx, ty, r: Math.random() * 1.2 + 0.4,
        vx: 0, vy: 0, speed: 0.4 + Math.random() * 0.6,
        opacity: 0.7 + Math.random() * 0.3,
        color: Math.random() > 0.5 ? "orange" : "yellow",
        stream: true, life: 1,
      }
    }

    const CLRS = {
      orange: "rgba(255,107,53,",
      yellow: "rgba(255,215,0,",
      white:  "rgba(200,200,200,",
    }

    for (let i = 0; i < 60; i++) stateRef.current.particles.push(mkParticle())

    function loop() {
      const st = stateRef.current
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      if (st.isWorking) {
        st.streamTick++
        if (st.streamTick % 4 === 0) {
          const orb = orbCenters[Math.floor(Math.random() * orbCenters.length)]
          st.particles.push(mkStream(orb.x, orb.y))
        }
      }

      st.particles = st.particles.filter(p => {
        if (p.stream && p.tx !== undefined && p.ty !== undefined) {
          const dx = p.tx - p.x, dy = p.ty - p.y
          const d  = Math.sqrt(dx*dx + dy*dy)
          if (d < 4 || (p.life ?? 1) <= 0) return false
          const spd = p.speed ?? 0.5
          p.x += (dx/d) * spd; p.y += (dy/d) * spd
          p.life = (p.life ?? 1) - 0.008
          ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI*2)
          ctx!.fillStyle = CLRS[p.color] + (p.opacity * (p.life ?? 1)) + ")"
          ctx!.fill()
          ctx!.beginPath(); ctx!.moveTo(p.x, p.y)
          ctx!.lineTo(p.x - (dx/d)*7, p.y - (dy/d)*7)
          ctx!.strokeStyle = CLRS[p.color] + (p.opacity * (p.life ?? 1) * 0.3) + ")"
          ctx!.lineWidth = p.r * 0.6; ctx!.stroke()
          return true
        }
        const speed = st.isWorking ? 3.5 : 1
        p.x += p.vx * speed; p.y += p.vy * speed
        if (p.x < 0) p.x = canvas!.width
        if (p.x > canvas!.width) p.x = 0
        if (p.y < 0) p.y = canvas!.height
        if (p.y > canvas!.height) p.y = 0
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r * (st.isWorking ? 1.4 : 1), 0, Math.PI*2)
        ctx!.fillStyle = CLRS[p.color] + (p.opacity * (st.isWorking ? 1.4 : 1)) + ")"
        ctx!.fill()
        return true
      })

      const ambient = st.particles.filter(p => !p.stream)
      while (ambient.length < 60) {
        const p = mkParticle(); st.particles.push(p); ambient.push(p)
      }

      st.frame = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(stateRef.current.frame)
      window.removeEventListener("resize", resize)
    }
  }, [])

  useEffect(() => {
    const svg   = svgRef.current
    const panel = panelRef.current
    if (!svg || !panel) return

    const draw = () => {
      svg.innerHTML = ""
      const pr = panel.getBoundingClientRect()
      LINE_PAIRS.forEach(([aId, bId]) => {
        const a = orbRefs.current.get(aId)
        const b = orbRefs.current.get(bId)
        if (!a || !b) return
        const ar = a.getBoundingClientRect()
        const br = b.getBoundingClientRect()
        const line = document.createElementNS("http://www.w3.org/2000/svg","line")
        line.setAttribute("x1", String(ar.left - pr.left + ar.width/2))
        line.setAttribute("y1", String(ar.top  - pr.top  + ar.height/2))
        line.setAttribute("x2", String(br.left - pr.left + br.width/2))
        line.setAttribute("y2", String(br.top  - pr.top  + br.height/2))
        line.setAttribute("stroke","rgba(255,107,53,0.08)")
        line.setAttribute("stroke-width","0.6")
        line.setAttribute("stroke-dasharray","4 7")
        svg.appendChild(line)
      })
    }
    const t = setTimeout(draw, 150)
    window.addEventListener("resize", draw)
    return () => { clearTimeout(t); window.removeEventListener("resize", draw) }
  }, [])

  return (
    <div style={{ width: 270, minWidth: 270, background: "#020202", borderRight: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: isWorking
          ? "radial-gradient(ellipse 200px 250px at 50% 40%,rgba(255,107,53,0.09) 0%,transparent 70%),radial-gradient(ellipse 160px 180px at 30% 70%,rgba(255,215,0,0.06) 0%,transparent 70%)"
          : "radial-gradient(ellipse 180px 220px at 50% 40%,rgba(255,107,53,0.04) 0%,transparent 70%),radial-gradient(ellipse 140px 160px at 30% 70%,rgba(255,215,0,0.03) 0%,transparent 70%)",
        transition: "background 0.6s",
        animation: isWorking ? "gNebulaBreath 3s ease-in-out infinite" : "none",
      }} />

      {isWorking && (
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2, top: -2,
          background: "linear-gradient(90deg,transparent,rgba(255,107,53,0.4),rgba(255,215,0,0.2),transparent)",
          boxShadow: "0 0 10px rgba(255,107,53,0.3),0 0 30px rgba(255,107,53,0.1)",
          animation: "gScanSweep 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
          zIndex: 8, pointerEvents: "none",
        }} />
      )}

      <div ref={panelRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

        <svg ref={svgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} xmlns="http://www.w3.org/2000/svg" />

        {ORBS.map((orb, i) => {
          const s = ORB_STYLES[orb.type]
          const floatAnim = FLOAT_ANIMS[i % FLOAT_ANIMS.length]
          const floatDur  = FLOAT_DURS[i % FLOAT_DURS.length]
          const activeDur = isWorking ? floatDur / 3.2 : floatDur

          return (
            <div
              key={orb.id}
              ref={el => { if (el) orbRefs.current.set(orb.id, el); else orbRefs.current.delete(orb.id) }}
              className="galaxy-orb-hover"
              style={{
                position: "absolute", borderRadius: "50%",
                width: orb.size, height: orb.size,
                left: orb.x, top: orb.y,
                zIndex: 4, cursor: "pointer",
                animation: `${floatAnim} ${activeDur}s ease-in-out infinite`,
              }}
            >
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: s.background,
                boxShadow: isWorking ? s.boxShadowWorking : s.boxShadow,
                transition: "box-shadow 0.5s",
                position: "relative", zIndex: 2,
              }} />

              {Array.from({ length: orb.rings }).map((_, ri) => (
                <div key={ri} style={{
                  position: "absolute", borderRadius: "50%",
                  border: `1px solid ${s.ringColor}0.45)`,
                  top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  animation: `gRingExpand ${isWorking ? 1.4 : 2.8}s ease-out ${ri * 1.2}s infinite`,
                  width: orb.size, height: orb.size,
                  pointerEvents: "none", zIndex: 1,
                }} />
              ))}

              {orb.label && (
                <div className="galaxy-orb-tooltip" style={{
                  position: "absolute", left: "calc(100% + 10px)", top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(5,5,5,0.94)", border: "1px solid rgba(255,255,255,0.07)",
                  padding: "5px 10px", whiteSpace: "nowrap",
                  pointerEvents: "none", zIndex: 20,
                  opacity: 0, transition: "opacity 0.2s",
                }}>
                  <div style={{ fontSize: 10, color: "#fff", marginBottom: 2, fontWeight: 500 }}>{orb.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{orb.sub}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{
        height: isWorking ? 28 : 0, overflow: "hidden",
        background: "rgba(255,107,53,0.05)",
        borderTop: isWorking ? "1px solid rgba(255,107,53,0.15)" : "1px solid transparent",
        display: "flex", alignItems: "center", gap: 8,
        padding: isWorking ? "0 14px" : "0",
        fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em",
        color: "#FF6B35", textTransform: "uppercase" as const,
        transition: "height 0.3s ease, border-color 0.3s",
      }}>
        <div style={{ display: "flex", gap: 3 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#FF6B35", animation: `gStatusPulse 0.6s ${i*0.2}s ease-in-out infinite` }} />
          ))}
        </div>
        Scanning signals...
      </div>

      <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: 5, background: "rgba(0,0,0,0.5)" }}>
        {[
          { color: "#FF6B35", shadow: "rgba(255,107,53,0.9)", label: "Campaigns (4 active)" },
          { color: "#FFD700", shadow: "rgba(255,215,0,0.8)",  label: "Signals (12 detected)" },
          { color: "#ccc",    shadow: "rgba(255,255,255,0.5)", label: "Prospects (247 found)" },
        ].map(({ color, shadow, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.09em" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${shadow}`, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>

      <style>{`
        .galaxy-orb-hover:hover .galaxy-orb-tooltip { opacity: 1 !important; }
        .galaxy-orb-hover:hover { transform: scale(1.25); }
      `}</style>
    </div>
  )
}
