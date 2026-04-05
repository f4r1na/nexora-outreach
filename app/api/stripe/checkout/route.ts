import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

const PRICE_IDS: Record<string, string> = {
  starter: "price_1TIxNI7InZIqSYCH1KgzwAOK",
  pro: "price_1TIxOD7InZIqSYCHBz2RiHz0",
  agency: "price_1TIxOc7InZIqSYCHdnKyz9lA",
}

export async function POST(req: NextRequest) {
  try {
    console.log("STRIPE_SECRET_KEY loaded:", !!process.env.STRIPE_SECRET_KEY)

    const { plan } = await req.json()
    const priceId = PRICE_IDS[plan]
    console.log("plan:", plan, "priceId:", priceId)

    if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/dashboard/settings`,
      metadata: { user_id: user.id, plan },
    })

    console.log("Stripe session created:", session.id, "url:", session.url)
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("Stripe checkout error full:", err)
    console.error("Error message:", err?.message)
    console.error("Error type:", err?.type)
    console.error("STRIPE_SECRET_KEY defined:", !!process.env.STRIPE_SECRET_KEY)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
