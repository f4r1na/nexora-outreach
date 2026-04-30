import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const customerId = sub?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ paymentMethod: null, invoices: [], cancelAtPeriodEnd: false });
  }

  const [pmList, invoiceList, subList] = await Promise.all([
    stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 }),
    stripe.invoices.list({ customer: customerId, limit: 12 }),
    stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 }),
  ]);

  const pm = pmList.data[0] ?? null;
  const activeSub = subList.data[0] ?? null;

  return NextResponse.json({
    paymentMethod: pm && pm.card ? {
      name: pm.billing_details.name ?? "",
      brand: pm.card.brand,
      last4: pm.card.last4,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year,
    } : null,
    invoices: invoiceList.data.map((inv) => ({
      id: inv.id,
      date: inv.created,
      amount: inv.amount_paid ?? inv.total,
      status: inv.status ?? "unknown",
      pdf: inv.invoice_pdf ?? null,
    })),
    cancelAtPeriodEnd: activeSub?.cancel_at_period_end ?? false,
  });
}
