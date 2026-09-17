# Sri Vilasavilli Subrahmanya Swami Devastanam — Website

A free, ready-to-host website for the temple. No coding knowledge required to update text or swap images.

## 1. How to preview it
Just double-click `index.html` — it opens in any browser. That's your whole website.

## 2. How to edit text
Open `index.html` in any text editor (Notepad, TextEdit, or free tools like VS Code / Notepad++).
Every section that needs real content is marked with a comment like:
```
<!-- EDIT: ... -->
```
or a yellow "💡" note box on the live page. Just find the text after it and replace it — nothing else needs to change.

Sections to fill in:
- Welcome note (About section)
- Full Temple History
- Grandparents' Heritage Story (full text)
- Daily pooja timetable (confirm real timings)
- Yearly Utsavam list (confirm real dates/festivals)
- Seva & Homa prices
- Store item names, descriptions, prices
- Bank account details, UPI ID
- Address, phone, email, WhatsApp link

## 3. How to replace images (no coding needed)
Every image on the site is currently a **dashed placeholder box** showing the recommended size. To replace one:

1. Save your photo in the `images/` folder with a sensible name, e.g. `images/temple-front.jpg`
2. In `index.html`, find the placeholder `<div class="ph">...</div>` block you want to replace
3. Replace it with: `<img src="images/temple-front.jpg" alt="Temple front view">`

**Recommended image sizes** (so photos look sharp and load fast):
| Spot | Size | Format |
|---|---|---|
| Hero background (optional, if you add one) | 1920 × 1080px | JPG/WEBP |
| About section photo | 1200 × 900px | JPG/WEBP |
| Gallery photos | 1200 × 900px | JPG/WEBP |
| Gallery videos | 1920 × 1080px | MP4, under 60s each ideally |
| QR code | 500 × 500px | PNG (transparent background works best) |
| Heritage story video | 1920 × 1080px | MP4 |

Keep each photo under ~500KB where possible (use tinypng.com or squoosh.app to compress) so the site loads fast on mobile.

## 4. How to add/remove gallery photos, utsavams, store items, or upcoming events
Each card/tile is a repeated block in `index.html` (look for `<div class="card">` or `<div class="ph">` inside the relevant section). Copy a block, paste it again, and edit the text/image inside to add one. Delete a block entirely to remove one.

## 5. Donations — important note
This is a **free static website**, so it cannot process payments or generate invoices automatically by itself. What's built in:
- QR code image + bank/UPI details for devotees to pay directly
- A simple "send payment confirmation" step (WhatsApp/contact) so you can manually send a receipt

**If you want true instant, automatic invoicing later:**
1. Create a free/low-cost account with a payment gateway that supports UPI + auto-receipts (e.g. Razorpay Payment Pages, Instamojo).
2. They give you a hosted payment link/button you can paste into the Donate section — this handles the actual money movement and auto-emails a receipt, without needing you to build a backend.
3. I can help you wire that link in once you have the account — just share the link/button code.

## 6. Hosting it for free
Pick one:
- **Netlify** (easiest): go to app.netlify.com/drop and drag the whole `temple-site` folder in. You get a free `.netlify.app` link instantly, and can add a custom domain later.
- **GitHub Pages**: create a free GitHub account, create a repository, upload these files, enable Pages in Settings. You get a free `.github.io` link.

Either way, whenever you edit `index.html` or swap an image, just re-upload/drag the folder again to update the live site.

## 7. Seva Booking, Login & Map (new)

**Seva booking flow:** each seva card now has a "Book This Seva" button. First-time visitors enter their name + mobile number (saved on their own browser only — no real OTP yet), then fill in date, gotra, and pilgrim names. This gets saved locally and they can view/edit it anytime under "My Sevas" in the nav.

**WhatsApp notification (genuinely free):** after booking, a toast appears with a "Notify temple on WhatsApp" link. Tapping it opens the devotee's own WhatsApp with the booking details pre-filled, addressed to the temple's number — they just hit send. This uses WhatsApp's free "click to chat" links, not a paid API.
- **Set your real WhatsApp number:** open `script.js`, find `TEMPLE_WHATSAPP` near the top of the booking section, and replace the placeholder with your number (country code + number, no `+` or spaces, e.g. `919876543210`).

**Receipts:** "View Receipt" in the dashboard opens a clean printable booking confirmation. This is **not a GST/payment invoice** — it just confirms what was booked. For real payment + auto-invoicing, you'd still need a payment gateway (see the Donations section notes above).

**Going from demo to real:** right now, login and bookings are stored only in each visitor's own browser (no shared database, nothing syncs between devices). To make this real — actual OTP login, bookings visible to temple staff, automatic WhatsApp/SMS sent by the temple itself — you'd need a small backend (e.g. Firebase or Supabase free tier for the database + login, plus a paid SMS/WhatsApp Business API for automatic messages). I can help wire that up once you're ready — just let me know.

**Map:** shows the temple location with a custom Vel (Shakti spear) marker instead of a generic pin.
- **Set your real location:** open `script.js`, find `MAP_LAT` and `MAP_LNG` near the top, and replace with your temple's actual coordinates (search "[temple name] coordinates" on Google Maps — right-click the exact spot and copy the lat/long shown).
- The map uses free OpenStreetMap tiles and needs an internet connection to load (same as the Google Fonts already used on the site).

## 9. Connecting a real database (Supabase) — for a live, shared admin dashboard

Right now the site works as a **local demo**: bookings, donations, and login are saved only in each visitor's own browser (that's why the admin panel only shows what was entered on the same device). Follow these steps to switch to a real, shared Supabase database — free tier, completely separate from your Netlify hosting limits.

**Step 1 — Create your Supabase project**
1. Go to [supabase.com](https://supabase.com) and sign up free.
2. Click "New Project", give it a name (e.g. `subrahmanyeswara-temple`), set a database password (save it somewhere safe), and choose a region close to India (e.g. Singapore).
3. Wait a minute or two for it to finish setting up.

**Step 2 — Run the database schema**
1. In your project, open the **SQL Editor** tab.
2. Open `supabase-schema.sql` (included in this folder), copy its entire contents, paste into the SQL Editor, and click **Run**.
3. This creates the `bookings` and `donations` tables with proper security rules — devotees can only ever see their own records, never anyone else's, and only a logged-in admin can see everything.

**Step 3 — Create the admin login**
1. In Supabase, go to **Authentication > Users > Add user > Create new user**.
2. Enter an email and password for the temple admin — this is what you'll use to log into the Admin Dashboard on the website (a real, secure login, not the old demo password).
3. Keep "Auto Confirm User" checked, then save.

**Step 4 — Connect the website to your project**
1. In Supabase, go to **Project Settings > API**. Copy your **Project URL** and **anon public key**.
2. Open `script.js`, find this near the top of the "Data Layer" section:
   ```
   const SUPABASE_ENABLED = false;
   const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```
3. Set `SUPABASE_ENABLED` to `true`, and paste in your real URL and anon key.
4. Re-deploy the site (push the updated files to Netlify/GitHub).

That's it — bookings and donations now save to a real shared database, devotees can log in from any device and see their own history, and the Admin Dashboard (via the "Admin" link in the footer) shows everyone's data once you sign in with the email/password from Step 3.

**Is the anon key safe to put in the code?** Yes — it's designed to be public-facing (that's the whole point of it). The security comes from the database rules in `supabase-schema.sql`, not from hiding the key.

**Free tier headroom:** Supabase's free tier includes a real Postgres database, generous storage, and up to 50,000 monthly active users on auth — comfortably enough for a temple site, and entirely separate from Netlify's own free-tier limits.

## 10. Files in this folder
- `index.html` — the whole website content/structure
- `style.css` — all colors, fonts, layout
- `script.js` — menu, gallery tabs, scroll animation
- `images/` — put your real photos here
- `videos/` — put your real videos here
- `video-script.md` — a ready storyboard for the AI-generated heritage story video
- `supabase-schema.sql` — database setup script for real, shared bookings/donations/admin (see section 9 above)
