# Stripe Payment Setup - Complete Guide

## ✅ What's Already Done

- ✅ Stripe SDK installed (v20.0.0)
- ✅ Payment integration code written and tested
- ✅ Deployed to Railway
- ✅ Code pushed to GitHub

## 🎯 What You Need To Do

### Step 1: Create Stripe Account (5 minutes)

1. Go to **https://stripe.com**
2. Click **"Sign up"**
3. Use email: **thegerassi@gmail.com** (or your preferred email)
4. Complete the signup process
5. Verify your email

### Step 2: Get Your API Keys (2 minutes)

1. Log in to Stripe Dashboard
2. Click **"Developers"** in the top menu
3. Click **"API keys"** in the left sidebar
4. You'll see two keys:

   **For Testing (Start Here):**
   - Click **"Reveal test key"** next to "Secret key"
   - Copy the key that starts with `sk_test_...`

   **For Production (Later):**
   - Complete Stripe account activation
   - Use the key that starts with `sk_live_...`

### Step 3: Add API Key to Railway (2 minutes)

Run these commands in your terminal:

```bash
cd /home/geras/ai-platforms-directory

# Add Stripe Secret Key (replace with your actual key)
railway variables --service a9bff8eb-2554-426b-9778-2a6eedd48425 --set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Add Domain (use Railway domain for now, update later with custom domain)
railway variables --service a9bff8eb-2554-426b-9778-2a6eedd48425 --set DOMAIN=https://ai-platforms-directory-production.up.railway.app
```

**Example with real key:**
```bash
railway variables --service a9bff8eb-2554-426b-9778-2a6eedd48425 --set STRIPE_SECRET_KEY=sk_test_51ABC123xyz...
```

### Step 4: Verify It's Working (2 minutes)

After adding the environment variables, Railway will automatically redeploy.

**Test the payment flow:**

1. Go to: https://ai-platforms-directory-production.up.railway.app/submit
2. Fill out the form
3. Click "Continue to Payment"
4. You should be redirected to **Stripe Checkout** page

**Use Stripe test card:**
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Step 5: View Payments in Stripe Dashboard

1. Go to Stripe Dashboard → **Payments**
2. You'll see all test payments listed
3. Click on any payment to see:
   - Amount paid
   - Tool name (in metadata)
   - Website URL
   - Contact email
   - Featured tier (if selected)

---

## 💰 Pricing Structure

### Tool Submission
- **Base Fee:** $49 per submission

### Featured Listing Upgrades
- **Basic:** $99/month - Featured badge + higher placement
- **Premium:** $199/month - Top 3 placement + custom description
- **Enterprise:** $299/month - #1 placement + custom branding

### Example Totals
- Submission only: **$49**
- Submission + Basic Featured: **$148** ($49 + $99)
- Submission + Premium Featured: **$248** ($49 + $199)
- Submission + Enterprise Featured: **$348** ($49 + $299)

---

## 🔄 After Payment: What Happens

### Automatic
1. User pays via Stripe Checkout
2. Payment confirmation sent to their email
3. Stripe logs the payment with all metadata

### Manual (You Need To Do)
1. Check Stripe Dashboard for new payments
2. Review the submission details in metadata
3. Add the tool to [platforms.json](file:///home/geras/ai-platforms-directory/platforms.json)
4. If featured tier selected, set `featured: true` and `featured_tier` in platform data
5. Redeploy to publish the new platform

### Future Enhancement (Optional)
- Set up Stripe webhooks to auto-approve submissions
- Create admin panel to review/approve submissions
- Email notifications when new submissions arrive
- Automatic platform.json updates

---

## 🚀 Going Live (Production Mode)

### When You're Ready For Real Payments:

1. **Activate Stripe Account:**
   - Complete business verification in Stripe Dashboard
   - Add bank account for payouts
   - Verify identity

2. **Switch to Live API Key:**
   ```bash
   railway variables --service a9bff8eb-2554-426b-9778-2a6eedd48425 --set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   ```

3. **Update Domain (After DNS is configured):**
   ```bash
   railway variables --service a9bff8eb-2554-426b-9778-2a6eedd48425 --set DOMAIN=https://aiplatformslist.com
   ```

4. **Test With Real Card:**
   - Use your own credit card
   - Submit a test tool
   - Verify payment appears in Stripe Dashboard
   - Refund the test payment

---

## 📊 Revenue Tracking

### In Stripe Dashboard:
- **Total Revenue:** Dashboard → Home (top right)
- **Breakdown:** Payments → Export to CSV
- **Monthly Recurring (MRR):** If you set up subscription products

### Expected Revenue Timeline:

**Month 1:**
- 5 submissions × $49 = **$245**
- 3 basic featured × $99 = **$297**
- **Total: $542**

**Month 3:**
- 10 submissions × $49 = **$490**
- 8 featured listings = **$995**
- **Total: $1,485**

**Month 6:**
- 20 submissions × $49 = **$980**
- 15 featured listings = **$2,583**
- **Total: $3,563**

---

## 🛠 Troubleshooting

### "Payment failed" or error on submit page:
- Check Railway logs: `railway logs --service a9bff8eb-2554-426b-9778-2a6eedd48425`
- Verify STRIPE_SECRET_KEY is set correctly
- Ensure key starts with `sk_test_` or `sk_live_`

### Payment successful but user not redirected:
- Check DOMAIN environment variable is correct
- Verify success URL in Stripe Dashboard → Developers → Webhooks

### Can't see payments in Stripe:
- Make sure you're using the correct API key (test vs live)
- Switch between "Test mode" and "Live mode" in Stripe Dashboard (top right)

---

## 📞 Support

- **Stripe Docs:** https://stripe.com/docs/payments/checkout
- **Railway Docs:** https://docs.railway.app/
- **Test Cards:** https://stripe.com/docs/testing

---

## ✅ Quick Checklist

- [ ] Created Stripe account
- [ ] Got API key (starts with `sk_test_` or `sk_live_`)
- [ ] Added `STRIPE_SECRET_KEY` to Railway
- [ ] Added `DOMAIN` to Railway
- [ ] Tested payment flow with test card (4242 4242 4242 4242)
- [ ] Verified payment appears in Stripe Dashboard
- [ ] Ready to accept real payments!

Once these are done, your AI Platforms Directory can accept real payments! 💰
