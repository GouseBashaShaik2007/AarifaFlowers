# Aarifa Flowers

A catalogue website for fresh handmade garlands. Customers browse photos by occasion and tap **Order on WhatsApp**. You manage everything from a private admin page.

- Languages: English, Hindi, Telugu, Urdu (Urdu reads right to left)
- Orders: a WhatsApp message with the garland name and starting price already filled in
- Admin: add, edit and delete garlands, upload photos (optional background removal), set a starting price or a price range, Fresh Today, Featured
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
   - Build command: `npm run build` (this runs the full Cloudflare build)
   - Deploy command: `npx wrangler deploy`
4. Add the variables below in two places, then deploy:
   - **Settings > Build > Variables and secrets** for `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_SITE_URL`. These are read while the site is built.
   - **Settings > Variables and secrets** for all of them. Choose **Secret** for passwords and keys.

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A long password only you know |
| `SESSION_SECRET` | Any long random text |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `919505840425` |
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

## Announcements, customer stories and sets

- **Announcements** (admin, Announcements tab): three texts you can change yourself in all four languages. The **announcement bar** is the thin bar at the top of every page. **Delivery rules** show in the footer and on each garland page. **Order notice** shows in How it works and on each garland page. Change them before a festival or a busy wedding month. Until you save your own, the site uses suggested wording that does not name a city, so add your city name. Use the **Show the announcement bar** switch to hide the bar without losing your text. It is on by default. Leaving every language empty also hides the bar.
- **Customer stories** (admin, Customer stories tab): add a real customer, an optional event, what they said, a rating from 1 to 5 stars and an optional photo. Use the first name and the area, and only what the customer agreed to share. The Customer stories section on the home page stays hidden until you add and show your first story.
- **Sets:** the **Set / Combo** type is in the garland form. A set is an ordinary garland with a price range, and the home page shows a Sets and combos row for every garland of that type. The three sample sets use placeholder prices. Edit or delete them.
- **Floating chat button:** on the home page it appears after you scroll past the top. On garland pages it is hidden because they have their own order bar.
- **Filter bar:** on the garlands page the occasion buttons stay under the header while you scroll. The other filters open under the Filters button.
- **Supabase:** announcements and stories use a new `settings` table. If you set up Supabase earlier, run `supabase.sql` again. It is safe to repeat. Until you do, the site keeps using the suggested texts and saving an announcement shows an error that says so.

## How photos are shown and stored

- **Card shape:** every garland card uses a tall 4:5 frame, the shape of a hanging garland. An ordinary photo fills the frame, is cropped a little at the edges, and leans towards the top so the top of the garland stays in view. Nothing is ever stretched.
- **Very narrow or very wide photos** are shown whole on the soft pink backdrop instead of being cropped hard. The limits are `FILL_MIN_RATIO` and `FILL_MAX_RATIO` in `components/FitPhoto.tsx`. A photo between 0.57 and 1.15 (width divided by height) fills the frame.
- **Cut-out photos** (background removed) are shown whole on the pink backdrop. The upload marks them with `-c` in the file name.
- **Home page hero picture** (admin, **Home page** tab): choose up to 3 garlands for the picture at the top of the home page and put your best one first. The first is the large photo, the next two are the round ones. Each garland's own main photo is used, and you can change which photo that is by moving photos around in the garland's edit page. The preview in the admin tab uses the same code as the home page, so it always matches. Leave slots empty and the newest Featured garlands fill them, and if a chosen garland is deleted the next one takes its place, so the hero is never blank. Until you choose anything, the home page behaves exactly as before. The large slot works best with a near-square or tall photo. A very wide photo, or a very narrow one, is shown whole and looks small in the frame (see `lib/hero.ts` and `components/FitPhoto.tsx`).
- **The garland page** shows the whole photo in the same 4:5 shape, so a customer sees all of the garland. The home page hero shows a photo as a framed picture, and the round pictures fill their circles.
- **Photo files:** the browser makes a small WebP copy. Some browsers, mainly Safari on an iPhone, cannot make WebP and quietly give back a PNG ten times the size. For an ordinary photo the site then makes a JPEG instead, at about 82% quality. File names now say what the file really is (`.webp`, `.jpg` or `.png`).
- **Make photos load faster** (admin, Garlands tab, Photo speed card): photos added before this fix may still be heavy PNGs. The button downloads each heavy photo, saves a light copy through the same steps a new upload uses, points the garland at the copy and deletes the heavy file. Photos that are already light are left alone, and it is safe to press again. The original file is not kept anywhere, so the copy is made from the 1200 pixel version stored on the site. Keep the page open while it works.

## Speed

- **Database requests:** every page is built when a visitor asks for it, and it needs the garlands and the site texts (announcement, FAQ, reels, stories) from Supabase. The home page used to ask for these one after another, five requests in a row, so the visitor waited for all of them. Now the site texts are read with one request (`readDocs` in `lib/store.ts`) and the garlands with one more, both at the same moment (`lib/publicData.ts`). Measured against a stand-in database that takes 250 ms per request, the home page answered in 454 ms instead of 1300 ms, and a garland page in 401 ms instead of 667 ms.
- **Fonts:** English visitors used to download the Hindi, Telugu and Urdu fonts as well (474 KB they never used). Now each of those three fonts loads only on a page in its own language (`lib/fonts.ts`). An English page loads about 68 KB of fonts instead of 627 KB. English words and prices inside the other languages use Poppins.
- **First pictures:** the first two cards on the garlands page and the picture at the top of the home page are fetched at once and ahead of the rest. The site also opens its connection to the photo storage early.
- **Loading screen:** when a visitor taps a garland or a link, a light placeholder appears at once while the page is prepared (`app/(site)/[lang]/loading.tsx`).
- **Admin:** the garland list and the tap counts load together.
- **What would help next:** each page still waits for one round trip to Supabase, and its length depends on how far the Supabase project is from the visitor. Look at the project's region in Supabase (Project Settings, Infrastructure). If it is far from your customers, a project in the Mumbai region would shorten every visit. That means creating a new project there and moving the data, so it is worth doing only with care. A short cache on the server would help more, but it makes changes such as Fresh Today take a little while to show, so it is not switched on.

## Phone experience

- **Header:** it slides away while a visitor scrolls down and comes back as soon as they scroll up (`components/ScrollHeader.tsx`). The filter chips on the garlands page move up into the free space and back. On a very narrow screen the language button shows only the globe, so nothing runs off the edge.
- **Garlands list:** a search box (every word must match a name, flower, occasion or type in any language), a sort menu (newest, price low to high, price high to low), and a soft fade at the edge of the chips that shows there are more to swipe. Names now use up to three lines. The card button says **Order** to fit a half-width card, with the full words kept for screen readers. The floating WhatsApp circle is hidden here, because every card has its own button. It stays on the home page.
- **Garland page:** the order bar no longer covers the end of the footer, and it keeps clear of the iPhone home indicator. There is a **Share** button (the phone's share sheet, or WhatsApp where there is none) and photos can be swiped, with dots showing how many there are.
- **Design your garland:** a tap on an occasion or a length moves to the next step by itself. The first step has a Back link to the home page.
- **Home page:** Sets and combos no longer repeat garlands already shown in Best sellers.
- **Size of things:** text on buttons and badges is at least 13 to 14 px, and footer links are 44 px tall.
- **Home screen and Google:** the site has a manifest and icons, so it can be added to a phone's home screen. It also gives search engines facts about the business (name, phone, Instagram) and about each garland (name, photos, starting price or price range, and in stock only while Fresh Today is on). It states no rating and no address, because none has been entered.
- **Announcement dates** (admin, Announcements tab): optional **Show from** and **Show until** days for festival banners. Both days are included, and the bar follows India time. Leave both empty to show it all the time.
- **Instagram reels:** the official embed makes each reel a tall box. The **Instagram, tap to play** choice in the admin Instagram tab shows a swipeable strip instead. That is a setting in the admin page, saved there.
- **Not built yet:** a delivery area and fee check, opening hours with an "Open now" line, and customer reviews. They need your real delivery areas and fees, your working hours and your real reviews.

## Custom builder, event date check, saved garlands and FAQ

- **Design your garland** (`/en/custom`): six short steps for occasion, flowers, colours, length, event date, then budget and notes. It ends with a summary and a green Send my design on WhatsApp button. Every step except the occasion can be skipped, and skipped answers say "Not decided, please suggest" in the message. The message is always English. The flowers come from the flower list in `lib/catalog.ts`. The colours and lengths are in `lib/builder.ts`. The home page banner links to it, and the tap counter counts it as a custom request.
- **Event date check:** on every garland page and in the builder. It tells the visitor how much notice the order needs and whether the chosen date fits, and it adds the date to the WhatsApp message. It cannot see your real bookings, so a good date only says that you confirm availability on WhatsApp. The rules are in `lib/orderRules.ts`:
  - 2 days' notice: weddings, custom designs, car decoration, stage and backdrop. A garland in several groups follows the longest notice.
  - 1 day (24 hours): pooja and religious, events and parties, special occasions.
  - Same day is allowed only for the 1 day group, with a note to confirm on WhatsApp. After 2 PM India time it says a same-day order is unlikely.
  - A date closer than the notice time is not blocked. The message just gets "(Short notice, please confirm if possible)".
- **Saved garlands:** a heart on every garland card and page, and a heart with a count in the header. Up to 5 garlands can be saved. They are kept on the visitor's own phone, so there is no account and nothing is stored on your side. The Saved garlands page has one button that sends all of them in a single WhatsApp message.
- **FAQ** (admin, FAQ tab): questions and answers in all four languages, shown at the bottom of the home page, just above the footer. Until you save your own, the site shows suggested answers. Check them against how you work: freshness hours, delivery charge, 50% advance for weddings, custom designs and stage setups, UPI and bank transfer, and the cancellation rule. Add, remove and move questions, or switch the section off. An empty language shows the English text. It uses the `settings` table, so if you set up Supabase before announcements existed, run `supabase.sql` again.
- **Length** (admin, garland form): an optional length such as "5 ft" or "Standard varmala pair", in each language. It shows as a small tag on the card and on the garland page, and is added to the WhatsApp message. Leave it empty to show nothing.

## Quick questions, budget bands, most popular and the four steps

- **Quick questions** (every garland page, under the date check): three quiet outlined buttons, Ask the price, Check my date and Ask about delivery. They open the same WhatsApp chat as the green button, with a different question already written, so a visitor who is not ready to order still starts a conversation. The questions are in `lib/whatsapp.ts` (`askMessage`). Each one names the garland and links to it, and Check my date carries the date chosen in the date check. They are outlines on purpose: the green Order button stays the one thing that stands out. Every tap is counted the same way as an order tap.
- **Budget** (garlands list, behind the Filters button): Under ₹1,000, ₹1,000 – ₹3,000 and ₹3,000 and above. The bands are in `lib/budget.ts`; change the numbers there. A garland with a price range shows in every band its range touches, so ₹900 to ₹1,500 appears under both of the first two. The choice rides along with the occasion, type, search and sort.
- **Most popular** (sort menu): orders the list by real WhatsApp taps over the last 30 days, the same counts you see in the admin. Nothing is invented and no rating is shown. The counts are only fetched when a visitor picks that order, so a normal page view still makes one round of requests. If the count cannot be read, the list quietly keeps its usual order.
- **How it works** (home page, above the customer stories): four steps — pick, message, we confirm the price, date and advance, fresh delivery on the morning. Edit the words in `lib/i18n.ts` (`step1Title` to `step4Text`) in all four languages. The order notice under it still comes from the Announcements tab.

## Occasion pages and being found on Google

- **Occasion pages** (`/en/occasions/wedding`, `/pooja`, `/events`, `/special`, `/custom`): one page per occasion, with its own heading, a few sentences, the garlands for that occasion (Fresh Today first, then featured), links to the other occasions and the FAQ. The five tiles on the home page now lead here instead of to the filtered list. This is the part most likely to bring new customers: people search for "wedding varmala", not for "garlands". Edit the words in `lib/occasionPages.ts` — they are yours to change and worth putting your own voice into. Nothing in them is invented: the notice times are the ones in `lib/orderRules.ts`, and no city, count or rating is claimed. There is no page for the garland types (varmala, toran and so on) yet; the same file would make those easy to add later.
- **sitemap.xml** (`app/sitemap.ts`): every page, in all four languages, listing the other languages beside it. Built fresh on request, so a garland added this morning is in it this morning. The saved list and the try-on previews are left out on purpose. `robots.txt` now points at it. **Worth doing once:** add the site at [Google Search Console](https://search.google.com/search-console) and give it `https://aarifaflowers.store/sitemap.xml`. That is what tells Google the pages exist.
- **Questions in search results** (`faqFacts` in `lib/faq.ts`): the FAQ is written into the home page and the occasion pages in the form Google reads, so your answers can appear straight in the results. It only ever contains what is really on the page.
- **One address per page:** each page names itself as the real address and names its own translations, so the Hindi page is offered to a Hindi reader instead of the English one. Filtered and sorted lists (`?occasion=…`, `?budget=…`, `?q=…`) are kept out of the search index, because they are the same garlands again and would compete with the occasion pages. The garlands themselves, the plain list and the occasion pages are all offered normally.

## Instagram reels and videos

The home page has a **See Our Garlands in Action** section above the custom design banner. Manage it in the admin page, **Instagram** tab:

- **Show on the website** switch: turns the whole section on or off.
- **Instagram name:** used by the Follow button.
- **How the reels play**, three choices:
  - **Instagram, tap to play** (recommended): light cards that load Instagram's player only when someone taps. Nothing is loaded from Instagram until then.
  - **Instagram, official embed:** Instagram's own post box. It loads Instagram's script when the section comes into view, so it is slower and uses more data.
  - **My own videos:** MP4 files you upload, played right on your website. They start muted as they scroll into view, one at a time, and stop when they scroll away. Tap to pause, and use the round button for sound.
- **Reels or videos:** up to 6. Paste a reel link (Instagram, Share, Copy link) or upload a video for each card. You can move them and remove them. With your own videos, a card without a video is not shown, and an Instagram link is optional and adds a small Watch on Instagram link.
- **Preview picture:** optional. With your own videos one is made from the video for you.

Nothing plays by itself for visitors who asked their phone for less motion or for data saving.

### Making videos that load fast

Visitors download every video they watch, so small files matter most. Aim for 720 by 1280 (tall), 10 to 30 seconds, and 2 to 5 MB. The limit is 10 MB. This command makes a good file from a phone video, using the free ffmpeg tool:

```
ffmpeg -i input.mov -vf "scale=720:-2" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 64k output.mp4
```

The `faststart` part lets the video begin before it has fully downloaded. An iPhone records in a format many browsers cannot play, so set Camera, Formats, Most Compatible, or convert with the command above. The admin page checks that your browser can play the file before it uploads it.

The free Supabase plan has a small monthly download allowance for files (about 5 GB when this was written, so please check your plan). At 4 MB per video that is roughly 1,200 plays a month. If the site grows, move the videos to Cloudflare R2, which does not charge for downloads, or Cloudflare Stream.

## Try it on

Customers can see a garland on their own photo before they order. On a garland page they press **Try it on**, add a photo of themselves, the bride or the groom, and move the garland into place with a finger. One finger moves it. Two fingers resize and turn it. The buttons and the mouse wheel do the same.

**Which garlands show the button:** Varmala, Bridal, Groom and Set / Combo garlands, but never a Toran, Car Decoration or Stage / Backdrop garland, even when it is also a set. The main photo must be a cut-out with a see-through background. Photos uploaded with "Use cleaned photo" are cut-outs. A garland whose main photo still has a background does not show the button. Upload a cleaned photo of it as the first photo to turn the button on.

**Ordering a look:** "Order this look on WhatsApp" saves the merged picture and opens WhatsApp with the garland name, its link and a link to the picture, so the picture shows in your chat. The customer's original photo never leaves their phone. Only the merged picture is uploaded, at about 300 KB or less.

**Privacy:** The picture has a random address that nobody can guess and is kept out of search engines. It is stored in the same Supabase bucket as the garland photos, in a folder called looks. A job deletes every picture after 30 days. It runs each day at 03:00 India time, set in `wrangler.jsonc`, and writes one line in the Cloudflare logs ("Old looks clean-up") with the number deleted. The customer sees a short notice about this on the Try it on screen.

**Setup:** It needs the two Supabase values, like everything that is saved. Without them the button still works, but ordering shows an error and the customer can press **Save image** and attach the picture in WhatsApp themselves.

**Security check (optional, recommended):** Cloudflare Turnstile stops bots from filling your storage. Create a widget in the Cloudflare dashboard under Turnstile, then add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (as a Build variable and a runtime variable) and `TURNSTILE_SECRET_KEY` (as a Secret). Without them, uploads are limited only by size, a check that the file is a photo, and a limit per visitor.

**Good to know:** It is a simple preview. A flat picture of a garland cannot hang or hide behind hair like a real one. Front-facing photos of the garland hanging give the best result.

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
| WhatsApp message wording | `lib/whatsapp.ts` (garland and saved list), `lib/builder.ts` (custom builder) |
| Notice times and the 2 PM same-day cutoff | `lib/orderRules.ts` |
| Builder colours and lengths | `lib/builder.ts` |
| Most garlands a visitor can save | `lib/savedLimit.ts` |
| Colours | top of `app/globals.css` |

## Good to know

- **Background removal** is off by default, because the site is built to show your original photos. Tick **Remove background automatically** in the garland form to try it. It runs inside your browser, so it costs nothing and photos are not sent to any service. The first photo takes about 15 seconds because the tool downloads once. You can choose the original photo after seeing before and after.
- **Translations** for Hindi, Telugu and Urdu were written quickly. Ask a native speaker to read them once, especially the shop name spelling and the button texts.
- **Product names** can be entered in each language in the admin page. If a language is empty, the English text is shown.
- The WhatsApp order message is always in English so that you read the same format every time.
- To use a paid background removal service later (PhotoRoom, remove.bg), only `components/admin/ImageUploader.tsx` needs to change.
