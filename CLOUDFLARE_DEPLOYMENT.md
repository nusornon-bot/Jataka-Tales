# คู่มือการ Deploy แอปพลิเคชัน "ศาลาชาดก" บน Cloudflare Workers (Free Tier)

เอกสารนี้อธิบายขั้นตอนการนำแอป **ศาลาชาดก** ขึ้นใช้งานบน **Cloudflare Workers** โดยรักษาฟีเจอร์ทั้งหมดไว้อย่างครบถ้วน และ**ไม่ต้องผูกบัตรเครดิตหรือเปิด Google Cloud Billing**

---

## 1. ภาพรวมสถาปัตยกรรมและความปลอดภัย

- **Frontend (React + Vite + PWA)**: Build เป็นไฟล์ Static + Service Worker ที่โฟลเดอร์ `./dist` และให้บริการผ่าน **Workers Static Assets** (`assets.directory = "./dist"`, `not_found_handling = "single-page-application"`)
- **Backend API (`/api/jataka/*`)**: ทำงานบน **Cloudflare Worker** (`worker/index.ts`) ซึ่งใช้ `shared/jatakaCore.ts` ร่วมกับระบบ AI Studio เดิม (`server.ts`) โดยมีเส้นทางดังนี้
  - `GET /api/jataka/status`
  - `POST /api/jataka/nipata-index`
  - `POST /api/jataka/bundle`
  - `POST /api/jataka/daily-wisdom`
  - `POST /api/jataka/artwork`
- **ความปลอดภัยของ API Key**:
  - `GEMINI_API_KEY` ถูกเก็บเป็น **Cloudflare Worker Secret** บนฝั่งเซิร์ฟเวอร์เท่านั้น (`env.GEMINI_API_KEY`)
  - โค้ดฝั่ง Frontend (`src/`) ไม่มี SDK หรือ API Key ของ Gemini ปะปนอยู่เลย
- **ไม่ต้องเปิด Google Cloud Billing**:
  - ใช้โมเดล Free Tier (`gemini-4-hydrogen` พร้อมระบบ Fallback อัตโนมัติเป็น `gemini-3.1-flash-lite` เมื่อโควตาครบ)
  - มีคลังชาดกที่แคชล่วงหน้า (`.jataka_cache.json`) ฝังมากับ Worker และแคชบนเครื่องผู้ใช้ (`localStorage`) เพื่อลดจำนวนการเรียก API
  - ใช้ Cloudflare Workers **Free Plan** ได้ทันที

---

## 2. สิ่งที่ต้องเตรียมก่อน Deploy

1. **บัญชี Cloudflare** (แพ็กเกจ Free ใช้งานได้)
2. **Gemini API Key แบบ Free Tier** จาก Google AI Studio (ไม่ต้องเปิด Billing)
3. **Node.js 18+** และติดตั้ง Dependencies ให้เรียบร้อย:

```bash
npm install
```

---

## 3. ทดสอบรันบนเครื่องแบบ Cloudflare Workers (`wrangler dev`)

1. คัดลอกไฟล์ตัวอย่าง secret:

```bash
cp .dev.vars.example .dev.vars
```

2. เปิดไฟล์ `.dev.vars` แล้วใส่คีย์ของท่าน (ไฟล์นี้ถูกตั้งค่าไว้ใน `.gitignore` แล้ว จะไม่ถูกอัปโหลดขึ้น Git):

```env
GEMINI_API_KEY="AIzaSy..."
```

3. Build หน้าเว็บและจำลองรันผ่าน Wrangler:

```bash
npm run cf:dev
```

เปิดเบราว์เซอร์ไปที่ URL ที่ Wrangler แสดง (ปกติคือ `http://localhost:8787`) เพื่อทดสอบทั้งหน้าเว็บและ API

---

## 4. ขั้นตอน Deploy ขึ้น Cloudflare Workers จริง

### ขั้นตอนที่ 1: เข้าสู่ระบบ Cloudflare ผ่าน Wrangler
```bash
npx wrangler login
```

### ขั้นตอนที่ 2: ตั้งค่า Secret `GEMINI_API_KEY` บน Cloudflare
เลือกตั้งค่าได้ 2 วิธี (ทำครั้งเดียว):
- **วิธี A — ผ่าน CLI (แนะนำ):**
  ```bash
  npx wrangler secret put GEMINI_API_KEY
  ```
  *(เมื่อระบบถาม ให้วาง Gemini API Key แล้วกด Enter)*
- **วิธี B — ผ่านหน้าเว็บ Cloudflare Dashboard (หาก Deploy ผ่าน GitHub หรือไม่สะดวกใช้ CLI):**
  1. เข้า **Cloudflare Dashboard > Workers & Pages** > เลือก Worker **`sala-jataka`**
  2. ไปที่แท็บ **Settings > Variables and Secrets**
  3. กด **+ Add** แล้วเลือก Type เป็น **Secret**
  4. ตั้งชื่อ Variable name เป็น `GEMINI_API_KEY` และวางค่า API Key ลงใน Value แล้วกด **Deploy / Save**

### ขั้นตอนที่ 3: Build และ Deploy
```bash
npm run cf:deploy
```

คำสั่งนี้จะรัน `vite build` แล้วตามด้วย `wrangler deploy` เมื่อเสร็จสิ้นจะได้ URL สำหรับใช้งานจริง เช่น:
`https://sala-jataka.<your-subdomain>.workers.dev`

*(หากเชื่อม GitHub กับ **Cloudflare Workers Builds** บน Dashboard ให้ตั้งค่า Build command เป็น `npm run build` และ Deploy command เป็น `npx wrangler deploy` พร้อมเพิ่ม Secret `GEMINI_API_KEY` ใน Settings > Variables and Secrets)*

---

## 5. สำคัญ: ตั้งค่า Firebase Authentication สำหรับโดเมน Workers

แอปนี้ใช้ Firebase Authentication (Google Sign-In) และ Firestore สำหรับซิงก์ดาวรายการโปรด บันทึกข้อคิด และความคืบหน้า:

1. เปิด **Firebase Console** (โปรเจกต์ `gen-lang-client-0352175547`)
2. ไปที่ **Authentication > Settings > Authorized domains**
3. กด **Add domain** แล้วเพิ่มโดเมนของ Cloudflare Workers ของท่าน เช่น:
   - `sala-jataka.<your-subdomain>.workers.dev`
   - *(หากผูก Custom Domain ของตนเอง ให้เพิ่มโดเมนนั้นด้วย)*

> หากข้ามขั้นตอนนี้ ปุ่ม "เข้าสู่ระบบ" ด้วย Google บนโดเมน `*.workers.dev` จะถูก Firebase บล็อกด้วย `auth/unauthorized-domain`

---

## 6. ตัวเลือกเสริม: เปิดใช้ Cloudflare KV (ฟรี) เพื่อเก็บแคชถาวรข้าม Isolate

Worker ได้ฝังแคชตั้งต้นจาก `.jataka_cache.json` และแคชบน Isolate ให้แล้วโดยไม่ต้องตั้งค่าเพิ่มเติม แต่หากต้องการให้ชาดกเรื่องใหม่ที่ผู้ใช้เปิดอ่านถูกบันทึกถาวรบนฝั่ง Edge ข้าม Restart (ในโควตาฟรีของ Cloudflare KV):

1. สร้าง KV Namespace:
   ```bash
   npx wrangler kv namespace create JATAKA_KV
   ```
2. นำ `id` ที่ได้ไปปลดคอมเมนต์ในไฟล์ `wrangler.jsonc`:
   ```jsonc
   "kv_namespaces": [
     {
       "binding": "JATAKA_KV",
       "id": "YOUR_KV_NAMESPACE_ID"
     }
   ]
   ```
3. Deploy ใหม่อีกครั้งด้วย `npm run cf:deploy` (โค้ดใน `worker/index.ts` รองรับ `env.JATAKA_KV` ให้อัตโนมัติอยู่แล้ว)

---

## 7. โหมดการรันใน AI Studio / Node.js เดิม

ไฟล์ `server.ts` และคำสั่ง `npm run dev` / `npm start` ยังคงทำงานบน Node.js / Express ได้ตามปกติ 100% โดยไม่ถูกกระทบ
