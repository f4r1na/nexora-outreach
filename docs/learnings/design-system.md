# Design System

## Colors
- Background: `#060606`
- Cards: `#0e0e0e`
- Accent: `#FF5200`
- Borders: `1px solid rgba(255,255,255,0.06)`
- Text primary: `#fff` / `#ccc`
- Text muted: `#555` / `#444`
- Success dot: `#4ade80`
- Error: `#f87171`

## Typography
- Headings: `fontFamily: "var(--font-syne)"`, `fontWeight: 500`
- Body: `fontFamily: "var(--font-outfit)"`, `fontWeight: 400`
- Max fontWeight anywhere: 500. Never 600, 700, 800.
- Section labels: 10px, uppercase, letterSpacing 0.06em, color `#444`

## Layout
- Dashboard sidebar: 220px wide
- Sticky header: height 60px, `backgroundColor: "rgba(6,6,6,0.9)"`, `backdropFilter: "blur(8px)"`
- Page padding: `24px 32px 64px`
- Cards: `backgroundColor: "#0e0e0e"`, `border: "1px solid rgba(255,255,255,0.06)"`, `borderRadius: 8`

## Forbidden Patterns
- NO `borderRadius: 999` or `borderRadius: "9999px"` pill shapes
- NO `boxShadow` glow effects
- NO colored `backgroundColor` icon boxes (orange/purple/green container divs)
- NO gradient backgrounds
- NO count badges on nav items
- NO `fontWeight` above 500

## Allowed Button Styles
Primary: `backgroundColor: "#FF5200"`, `color: "#fff"`, `borderRadius: 6`, `fontWeight: 500`
Secondary: `backgroundColor: "transparent"`, `color: "#555"`, `border: "1px solid rgba(255,255,255,0.08)"`, `borderRadius: 6`, `fontWeight: 400`

## Status Indicators
Dot only: `width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80"` (sent) or `"#555"` (draft)
Text labels: plain color text, no bg/border box

## Tabs (active state)
`borderBottom: "1px solid #FF5200"`, `marginBottom: -1`, `color: "#fff"`
Inactive: `borderBottom: "1px solid transparent"`, `color: "#555"`
