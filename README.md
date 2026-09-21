# Aarifa Flowers

A catalogue website for fresh handmade garlands. Customers browse photos by occasion and tap **Order on WhatsApp**. You manage everything from a private admin page.

- Languages: English, Hindi, Telugu, Urdu (Urdu reads right to left)
- Orders: a WhatsApp message with the garland name and starting price already filled in
- Admin: add, edit and delete garlands, upload photos with automatic background removal, set price, Fresh Today, Featured
- WhatsApp number: +91 73973 09203

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

You need a free GitHub account, a free Vercel account and a free Supabase account.

### 1. Supabase (saves your garlands and photos)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste everything from `supabase.sql`, press **Run**.
3. Open **Project Settings > API**. Copy the **Project URL** and the **service_role** key. Keep the service_role key secret.

### 2. Vercel (runs the website)

1. Put this folder on GitHub (create a new private repository and upload it).
2. On vercel.com choose **Add New > Project** and pick that repository.
3. Before deploying, open **Environment Variables** and add these:

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A long password only you know |
| `SESSION_SECRET` | Any long random text |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `917397309203` |
| `SUPABASE_URL` | Project URL from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel address, for example `https://aarifa-flowers.vercel.app` (add after the first deploy, then redeploy) |

4. Press **Deploy**. Your site is at `https://<project-name>.vercel.app`.
5. Log in at `/admin`, press **Add sample garlands** if you want the samples, or add your own.

`NEXT_PUBLIC_SITE_URL` adds a link to the garland inside every WhatsApp order message, so you can see the exact photo the customer chose.

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
