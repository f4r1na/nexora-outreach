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
    const { plan } = await req.json()
    const priceId = PRICE_IDS[plan]

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
      success_url: `${appUrl}/dashboard?success=true`,
      cancel_url: `${appUrl}/dashboard?canceled=true`,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("stripe checkout error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
