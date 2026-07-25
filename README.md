# ToolKit — Modern & Private Online File Tools

**ToolKit** is a lightweight, clean, and production-ready web application designed for fast and secure client-side file conversions and optimization. By leveraging HTML5 Canvas APIs and client-side PDF libraries (`pdf-lib`), **ToolKit** ensures that files are processed entirely inside your web browser without ever touching a server or database.

---

## 🛠️ Included Tools (Only Six Focused Tools)

1. **Image Compressor**
   - Compress JPG, PNG, and WebP images with customizable compression levels (Low, Medium, High).
   - Shows real-time original size, compressed size, and total percentage savings.
   - One-click instant download.

2. **Image Converter**
   - Seamlessly convert between JPG, PNG, and WebP file formats.
   - High-quality fidelity preservation.
   - One-click instant download.

3. **Image Resizer**
   - Resize images by exact custom width and height in pixels.
   - Option to keep or unlock aspect ratio to prevent stretching.
   - Quick percentage scale presets (25%, 50%, 75%, 150%, 200%).
   - One-click instant download.

4. **Image to PDF**
   - Upload single or multiple JPG, PNG, and WebP images.
   - Drag & drop page reordering with touch-friendly Up/Down sequence controls.
   - Page sizing options (Fit to Image Resolution vs Standard A4).
   - One-click instant download of merged PDF.

5. **PDF Merge**
   - Upload and inspect multiple PDF documents with automatic page count detection.
   - Drag & drop ordering controls to organize merge sequence.
   - Generates a seamless single PDF document.
   - One-click instant download.

6. **PDF Compress**
   - Optimize PDF structures and apply object stream repacking.
   - Three optimization modes (Standard Optimization, Deep Structural Clean, and Maximum Compact).
   - Preserves complete font readability and formatting while displaying exact byte reduction.
   - One-click instant download.

---

## 💬 Feedback Feature & EmailJS Configuration

ToolKit includes a built-in **Feedback** dialog accessible via buttons located cleanly in both the top navigation bar and footer. Users can submit optional contact details, rate their experience (1–5 stars), select a category (*Bug Report*, *Feature Request*, *Improvement Suggestion*, or *General Feedback*), and send a required message.

Feedback submissions are engineered to be delivered directly to **resumeforgecoai@gmail.com** using **EmailJS** without exposing private API keys or needing an external backend database.

### ⚙️ How to Configure EmailJS

1. **Create an EmailJS Account:** Sign up at [EmailJS](https://www.emailjs.com/).
2. **Add an Email Service:**
   - Go to **Email Services** and connect your target delivery service (e.g., Gmail configured for `resumeforgecoai@gmail.com`).
   - Copy your assigned **Service ID**.
3. **Create an Email Template:**
   - Under **Email Templates**, create a new template directing mail to `resumeforgecoai@gmail.com`.
   - In your template content, you can utilize the following exact variables sent automatically by ToolKit:
     - `{{to_email}}` (Automatically defaults to `resumeforgecoai@gmail.com`)
     - `{{rating}}` (e.g., `5 / 5 Stars`)
     - `{{category}}` (e.g., `Bug Report` or `Feature Request`)
     - `{{name}}` (Optional user name, defaults to `Anonymous User`)
     - `{{email}}` (Optional return email, defaults to `Not Provided`)
     - `{{message}}` (Required feedback text)
     - `{{page_url}}` (Exact browser URL where the feedback button was clicked)
     - `{{browser_info}}` (User navigator string / OS details)
     - `{{date_time}}` (Exact timestamp of submission)
     - `{{tool_context}}` (Tool currently active, e.g. `Image Compressor` or `Homepage`)
   - Copy your **Template ID**.
4. **Retrieve Your Public Key:**
   - Under **Account** → **General**, copy your **Public Key** (Client ID). Never put secret/private keys in client-side variables.
5. **Set Environment Variables:**
   - Copy `.env.example` to a new `.env` file in the root directory:
     ```bash
     cp .env.example .env
     ```
   - Enter your retrieved IDs into `.env`:
     ```env
     VITE_EMAILJS_SERVICE_ID=your_actual_service_id
     VITE_EMAILJS_TEMPLATE_ID=your_actual_template_id
     VITE_EMAILJS_PUBLIC_KEY=your_actual_public_key
     ```
   *(Note: If testing without `.env` configured, ToolKit cleanly logs the formatted payload to the console and simulates successful delivery so you can test the UI interface without errors).*

---

## 🔒 Privacy & Performance Guarantees

- **100% Local File Processing:** Files are processed via browser memory and canvas rendering. No servers, no uploads, no third-party APIs.
- **Immediate Data Destruction:** Temporary Object URLs and browser memory buffers are cleanly revoked immediately upon download or when cleared.
- **Zero Clutter:** No login or signup, no user accounts, no databases, no advertisements, no tracking analytics, no paywalls or premium tiers.
- **Modern Minimal UI:** Fully responsive across mobile, tablet, and desktop with persistent Dark Mode and Light Mode styling.

---

## 🚀 Installation & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- `npm` or `pnpm`

### Setup Instructions

1. **Clone or navigate to the repository:**
   ```bash
   git clone <repository-url>
   cd react-vite-tailwind
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 📦 Deployment Instructions

ToolKit produces standard static HTML/CSS/JS files and can be hosted on any static hosting provider (Vercel, Netlify, Cloudflare Pages, GitHub Pages, AWS S3, etc.).

### 1. Build for Production
Run the automated Vite build script:
```bash
npm run build
```
This will compile and optimize the app into the `dist/` directory.

### 2. Preview Production Build Locally
To verify the production build before deployment:
```bash
npm run preview
```

### 3. Hosting Examples
- **Cloudflare Pages / Vercel / Netlify:** Connect your git repository, set the build command to `npm run build`, and add your `VITE_EMAILJS_*` variables under your provider's Environment Variables panel.
- **Nginx / Static Web Server:** Build locally or in CI with `.env` present and copy the contents of the `dist/` folder to your web server root directory.

---

## 💻 Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Lucide React Icons
- **Email Delivery:** `@emailjs/browser` (Client-side Email SDK)
- **PDF Engine:** `pdf-lib` (running completely client-side)
- **Image Processing:** Native HTML5 Canvas & Web API
