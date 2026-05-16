import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

async function main() {
  const tiers = [
    { planKey: "pro", displayName: "Nexora Pro", cents: 19900 },
    { planKey: "agency", displayName: "Nexora Agency", cents: 49900 },
    { planKey: "enterprise", displayName: "Nexora Enterprise", cents: 99900 },
  ];

  console.log("Creating Stripe products and prices...\n");

  for (const tier of tiers) {
    const product = await stripe.products.create({
      name: tier.displayName,
      metadata: { plan: tier.planKey },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.cents,
      currency: "usd",
      recurring: { interval: "month" },
    });

    console.log(`STRIPE_PRICE_${tier.planKey.toUpperCase()}=${price.id}`);
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
