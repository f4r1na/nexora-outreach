"use client"

import { cn } from "@/lib/utils"
import { Mail, Users, MessageSquare, Zap } from "lucide-react"
import { useEffect, useState } from "react"

const iconMap = {
  mail: Mail,
  users: Users,
  messageSquare: MessageSquare,
  zap: Zap,
}

type IconName = keyof typeof iconMap

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  iconName: IconName
  iconColor?: string
}

function AnimatedNumber({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState("0")
  
  useEffect(() => {
    const numericMatch = value.match(/[\d,]+\.?\d*/)
    if (!numericMatch) {
      setDisplayValue(value)
      return
    }
    
    const targetNum = parseFloat(numericMatch[0].replace(/,/g, ""))
    const prefix = value.slice(0, value.indexOf(numericMatch[0]))
    const suffix = value.slice(value.indexOf(numericMatch[0]) + numericMatch[0].length)
    const hasDecimal = numericMatch[0].includes(".")
    const decimalPlaces = hasDecimal ? numericMatch[0].split(".")[1].length : 0
    
    let startTime: number
    const duration = 1000
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = targetNum * eased
      
      const formattedNum = hasDecimal 
        ? current.toFixed(decimalPlaces)
        : Math.floor(current).toLocaleString()
      
      setDisplayValue(`${prefix}${formattedNum}${suffix}`)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value])
  
  return <span>{displayValue}</span>
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  iconName,
  iconColor = "text-muted-foreground",
}: StatCardProps) {
  const Icon = iconMap[iconName]
  
  return (
    <div className="rounded-md border border-border bg-card p-4 card-shadow animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">
            <AnimatedNumber value={value} />
          </p>
          {change && (
            <p
              className={cn(
                "text-xs",
                changeType === "positive" && "text-green-500",
                changeType === "negative" && "text-red-500",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("rounded bg-secondary p-2", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
