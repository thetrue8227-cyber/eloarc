const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');

const PRICE_MAP = {
  rising:     process.env.STRIPE_PRICE_RISING,
  elite:      process.env.STRIPE_PRICE_ELITE,
  arc_master: process.env.STRIPE_PRICE_ARC_MASTER,
};

router.post('/checkout', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.body;
    const priceId = PRICE_MAP[plan];
    if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

    let customerId = null;
    const { rows } = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id]);
    customerId = rows[0]?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.user.id]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`,
      metadata: { userId: req.user.id, plan },
    });

    res.json({ url: session.url });
  } catch (err) { next(err); }
});

router.post('/portal', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id]);
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) return res.status(400).json({ error: 'No active subscription' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}/dashboard/settings`,
    });
    res.json({ url: session.url });
  } catch (err) { next(err); }
});

// Stripe webhook — raw body required (set in server.js)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const planFromPrice = (priceId) => {
    const entries = Object.entries(PRICE_MAP);
    const found = entries.find(([, p]) => p === priceId);
    return found ? found[0] : 'free';
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          await query(
            'UPDATE users SET plan = $1, stripe_subscription_id = $2, updated_at = NOW() WHERE id = $3',
            [plan, session.subscription, userId]
          );
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const { rows } = await query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [sub.customer]
        );
        if (rows.length) {
          const priceId = sub.items.data[0]?.price?.id;
          const plan = sub.status === 'active' ? planFromPrice(priceId) : 'free';
          await query(
            'UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2',
            [plan, rows[0].id]
          );
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const { rows } = await query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [sub.customer]
        );
        if (rows.length) {
          await query(
            'UPDATE users SET plan = \'free\', stripe_subscription_id = NULL, updated_at = NOW() WHERE id = $1',
            [rows[0].id]
          );
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
