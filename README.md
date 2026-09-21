# Aarifa Flowers

A catalogue website for fresh handmade garlands. Customers browse photos by occasion and tap **Order on WhatsApp**. You manage everything from a private admin page.

- Languages: English, Hindi, Telugu, Urdu (Urdu reads right to left)
- Orders: a WhatsApp message with the garland name and starting price already filled in
- Admin: add, edit and delete garlands, upload photos with automatic background removal, set a starting price or a price range, Fresh Today, Featured
- Admin list: search, filters, bulk actions, and a count of how often customers tap Order on WhatsApp, made for use on a phone
- WhatsApp number: set in `NEXT_PUBLIC_WHATSAPP_NUMBER` (in `.env.local` and in your Cloudflare settings). The buttons and the number shown in the footer both follow it.

## Run it on your computer

```bash
npm install
npm run dev
```

Open http://localhost:3000. The admin page is http://localhost:3000/admin.

The admin password is in the file `.env.local` (the line `ADMIN_PASSWORD=`). Change it to any password you like.

The site starts with 10 sample garlands. The photos are drawings, not real garlands. Add your own from the admin page, then delete the samples.

On your computer, changes and photos are saved in the `data` folder. That is only for trying things out. To save changes when the site is online, use Supabase (below).

## Put it online for free

You need a free GitHub account, a free Cloudflare account and a free Supabase account.

### 1. Supabase (saves your garlands and photos)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste everything from `supabase.sql`, press **Run**.
3. Open **Project Settings > API**. Copy the **Project URL** and the **service_role** key. Keep the service_role key secret.

### 2. Cloudflare (runs the website)

The site runs on Cloudflare Workers through OpenNext. The settings are in `wrangler.jsonc` and `open-next.config.ts`.

1. Put this folder on GitHub.
2. In the Cloudflare dashboard open **Workers & Pages**, press **Create application**, choose **Import a repository** and pick your repository.
3. Set the project name to `aarifaflowers`. It must match `name` in `wrangler.jsonc`. Use these commands if Cloudflare asks:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx wrangler deploy`
4. Add the variables below in two places, then deploy:
   - **Settings > Build > Variables and secrets** for `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_SITE_URL`. These are read while the site is built.
   - **Settings > Variables and secrets** for all of them. Choose **Secret** for passwords and keys.

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A long password only you know |
| `SESSION_SECRET` | Any long random text |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `917397309203` |
| `SUPABASE_URL` | Project URL from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase |
| `ANTHROPIC_API_KEY` | Optional. Turns on the AI suggestions (see below) |
| `NEXT_PUBLIC_SITE_URL` | Your site address, for example `https://aarifaflowers.your-name.workers.dev` (add after the first deploy, then deploy again) |

5. Your site is at the `workers.dev` address Cloudflare shows. Log in at `/admin`, press **Add sample garlands** if you want the samples, or add your own.

Without the two Supabase values the site still opens, but nothing can be saved.

Photos are cropped, resized and converted in your browser before they upload, because Cloudflare Workers cannot run the image tools that this needed before.

To try the site the way Cloudflare runs it, copy `.env.local` to `.dev.vars` and run `npm run preview`. To deploy from your computer instead of GitHub, run `npx wrangler login` once, then `npm run deploy`.

`NEXT_PUBLIC_SITE_URL` adds a link to the garland inside every WhatsApp order message, so you can see the exact photo the customer chose.

## Search, bulk actions and WhatsApp taps

- **Search and filters:** type a name or flower, or pick a status, occasion or type. All words must match.
- **Bulk actions:** tick garlands, then use the bar at the bottom: Mark Fresh Today, Mark Not available, Feature, Remove Featured, Delete. Delete asks first. Only garlands you can see are affected.
- **Morning reset:** the **Mark all Fresh Today** button at the top turns Fresh Today on for every garland in one tap. It asks first and shows how many will change. Afterwards an **Undo** notice stays for 15 seconds. Then switch off the few garlands you cannot make today. It ignores any search or filter you have on.
- **Sorting:** Newest first, Price low to high, Price high to low, or A to Z.
- **Compact view:** the **Compact** button shows one short line per garland, with a Fresh switch. **Cards** shows the full cards. Your choice is remembered on that phone.
- **WhatsApp message preview:** the **Preview** button on each card shows the exact message a customer sends for that garland. You can copy it or open it in WhatsApp.
- **Not available:** a garland marked Not available stays on the website, greyed out with a "Not available today" badge.
- **Price range:** fill in a highest price to show "₹1,499 – ₹2,499". Leave it empty to show "From ₹1,499".
- **WhatsApp taps:** each time a customer presses an Order on WhatsApp button, one is added to that garland's count. The top five of the last 30 days show above the list. Only the garland and the day are saved. Nothing about the customer is saved. Your own taps while logged in are not counted. If you set up Supabase before this feature existed, run `supabase.sql` again. It is safe to repeat.

## AI suggestions for name and description

In the admin page, after you add photos, the **Suggest name and description with AI** button reads your photos and writes a name and a short description in English, Hindi, Telugu and Urdu. You see the text first and press **Use this text** only if you like it.

To turn it on:

1. Create an account and an API key at console.anthropic.com.
2. Put the key in `.env.local` as `ANTHROPIC_API_KEY=your-key` (on Cloudflare, add the same name under Variables and Secrets as a Secret).
3. Restart `npm run dev`.

Good to know:

- Your photos are sent to Anthropic when you press the button. Nothing is sent otherwise.
- Each suggestion is billed to your Anthropic account. It should be a few cents. Check the usage page to see the real amount.
- It uses `claude-opus-5`. To make it cheaper, add `ANTHROPIC_MODEL=claude-sonnet-5`.
- Read the Hindi, Telugu and Urdu before you publish. The AI can make mistakes.

## Things you may want to change

| What | Where |
| --- | --- |
| Occasions, garland types, flowers (names in all 4 languages) | `lib/catalog.ts` |
| Words on the website in each language | `lib/i18n.ts` |
| WhatsApp message wording | `lib/whatsapp.ts` |
| Colours | top of `app/globals.css` |

## Good to know

- **Background removal** runs inside your browser, so it costs nothing and photos are not sent to any service. The first photo takes about 15 seconds because the tool downloads once. Later photos are faster. You can turn it off per upload, or choose the original photo after seeing before and after.
- **Translations** for Hindi, Telugu and Urdu were written quickly. Ask a native speaker to read them once, especially the shop name spelling and the button texts.
- **Product names** can be entered in each language in the admin page. If a language is empty, the English text is shown.
- The WhatsApp order message is always in English so that you read the same format every time.
- To use a paid background removal service later (PhotoRoom, remove.bg), only `components/admin/ImageUploader.tsx` needs to change.
