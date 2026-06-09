# 🚀 UGCForge (LinkToUGC)

**1 Link Produk → Video UGC Review Siap Viral**

UGCForge adalah aplikasi AI-powered yang mengubah link produk Shopee/TikTok menjadi video UGC review berkualitas tinggi siap upload — otomatis dalam hitungan detik.

## ✨ Fitur

- **🔗 Scraping Otomatis**: Masukkan link Shopee/TikTok, kami scrape nama produk, harga, deskripsi, dan 5-8 gambar berkualitas tinggi.
- **🤖 AI Script Generator**: Gunakan Google Gemini 2.5 Flash untuk membuat script UGC engaging: Hook kuat → Narasi natural → CTA persuasif (Bahasa Indonesia).
- **🎬 AI Video Generation**: Gunakan Google Veo 3.1 untuk generate video UGC vertikal (9:16) dengan gaya realistis.
- **📝 Caption + Hashtag**: Caption dan hashtag siap copy (total ≤ 150 karakter) untuk engagement maksimal.
- **🌙 Dark Mode**: UI modern dengan dark mode default, mobile-first.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui + lucide-react
- **AI**: @google/generative-ai (Gemini 2.5 Flash + Veo 3.1)
- **Scraping**: Playwright (fallback) + direct API
- **State**: Zustand
- **Validation**: Zod

## 📋 Prerequisites

- Node.js 18+
- npm / pnpm / yarn
- Google Gemini API Key ([dapatkan di sini](https://aistudio.google.com/apikey))

## 🚀 Cara Install & Run

### 1. Clone & Install

```bash
git clone <repo-url>
cd ugc-forge
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` dan isi API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
VEO_MOCK=true    # Set false jika punya akses Veo API
```

### 3. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 4. Build Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
ugc-forge/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── scrape/route.ts       # API scraping produk
│   │   │   ├── generate/route.ts     # API generasi konten AI
│   │   │   └── result/[id]/route.ts  # API ambil hasil
│   │   ├── result/[id]/page.tsx      # Halaman detail hasil
│   │   ├── page.tsx                  # Halaman utama
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── hero-section.tsx
│   │   ├── link-input.tsx
│   │   ├── product-preview.tsx
│   │   ├── progress-steps.tsx
│   │   ├── video-player.tsx
│   │   ├── script-display.tsx
│   │   └── caption-display.tsx
│   ├── lib/
│   │   ├── utils.ts                  # Utility functions
│   │   ├── validations.ts            # Zod schemas
│   │   ├── storage.ts                # In-memory result storage
│   │   ├── scraping/
│   │   │   ├── shopee.ts             # Shopee scraper
│   │   │   └── tiktok.ts             # TikTok scraper
│   │   └── ai/
│   │       ├── gemini.ts             # Gemini AI integration
│   │       └── veo.ts                # Veo 3.1 video generation
│   ├── store/
│   │   └── use-store.ts              # Zustand store
│   └── types/
│       └── index.ts                  # TypeScript types
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.js
├── tsconfig.json
└── README.md
```

## 🔑 API Keys

| Key | Required | Dapatkan dari |
|-----|----------|--------------|
| `GEMINI_API_KEY` | ✅ Ya | https://aistudio.google.com/apikey |
| `VEO_API_KEY` | ❌ Opsional | Same as Gemini (fallback) |
| `VEO_MOCK=true` | — | Set jika tidak punya akses Veo |

## 🌐 Platform Support

- **Shopee**: shopee.co.id, shopee.com.my, shopee.sg, dan domain Shopee lainnya
- **TikTok Shop**: tiktok.com (product/video links)

## 📝 Lisensi

MIT
