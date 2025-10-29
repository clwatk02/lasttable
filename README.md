
## 🔐 Enable Private Editing (Netlify CMS + Identity)
1) Push this folder to a GitHub repo (branch `main`).  
2) On Netlify: **New site from Git** → connect the repo → deploy.  
3) In Netlify site settings:
   - **Identity** → Enable Identity.
   - **Identity** → Registration → Invite only.
   - **Identity** → Send invitation to **onzpoe@gmail.com**.
   - **Git-Gateway** → Enable.
4) Visit `/admin` on your Netlify site, accept the email invite, and log in.
5) Edit content visually; publish changes. Netlify will rebuild your site automatically.


---

## 📈 Optional Analytics
- Replace `data-domain="lasttable.vip"` in `index.html` with your domain once live.

## 🛡️ Anti-spam (Cloudflare Turnstile)
- In `partners.html`, replace `YOUR_TURNSTILE_SITEKEY` with your site key.
- Add your secret key in Cloudflare dashboard to validate tokens server-side (optional during beta).

## 📊 Google Sheets (optional mirror)
Mirror submissions to Google Sheets via Apps Script:

1. Create a new Google Sheet.
2. Extensions → Apps Script, then paste:
```
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = e.parameter;
  sheet.appendRow([new Date(), data.email || '', data.city || '', data.party || '', data.vibe || '', data.restaurant || '', data.phone || '', data.notes || '']);
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}
```
3. Deploy → New deployment → Type: Web app → Execute as: Me → Who has access: Anyone.
4. Copy the Web app URL and set it as `data-apps-script="YOUR_WEB_APP_URL"` on:
   - `#waitlist-form` in `index.html`
   - `#partner-form` in `partners.html`

## 🧰 Owner Toolbar (private)
Append `?edit=1` to any page URL while logged in via Netlify Identity to reveal quick edit controls.


## New pages & features
- `/press.html` — press kit & brand pack download
- `/portal/index.html` — Identity-gated partner portal stub
- `/changelog.html` — public changes powered by `content/changelog.json`
- City selector powered by `content/cities.json` (edit via CMS)
- Brand pack zip at `/assets/brand/lasttable-logo-pack.zip`


---

## EmailJS Quick Guide
1. Create Service + two Templates (admin, user).
2. Copy Public Key, Service ID, Template IDs.
3. In **Admin → Settings**, fill:
   - `emailjs_public_key`
   - `emailjs_service_id`
   - `emailjs_template_id_admin`
   - `emailjs_template_id_user`
4. Variables sent (example payload):
```
{ "kind":"claim", "email":"user@example.com", "name":"Chris", "city":"Cincinnati", "restaurant":"Balthazar", "party":"2", "date":"2025-12-01", "time":"20:00", "reservation_id":"res-001", "datetime":"2025-12-01 20:00" }
```

## Stripe Pay-to-Claim
- Create a Payment Link for the claim fee.
- In **Admin → Settings**, set `require_payment_to_claim = true` and `stripe_payment_link`.
- Return URL suggestion: `https://YOUR-SITE.netlify.app/claim.html?id=<RESERVATION_ID>&token=<TOKEN>&paid=1`
- The claim page unlocks when it sees `?paid=1` (configurable via `claim_success_param_*`).

## Mapbox Geocoding
- Add `mapbox_token` in **Admin → Settings**.
- Use **/admin-tools.html** → Geocode widget to get lat/lng.
