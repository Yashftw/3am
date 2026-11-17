# 3am - Minimalist Tracker

A sleek, dark-mode-native personal tracking dashboard designed to keep your life organized without the visual clutter. Perfect for late-night planning and daily reflections.

🔗 **Live Project:** [https://3am-seven.vercel.app](https://3am-seven.vercel.app)
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/e492287b-0a41-42c5-86c1-b71bf12f41cf" />

## Features

- **Mission Control (Tasks & Goals):** A unified, dual-state interface to track daily todos and long-term objectives.
- **Financial Tracking:** Log expenses, set category-specific budgets, and monitor your monthly burn rate.
- **Health Metrics:** Keep tabs on your sleep hours and workout durations with visual arc gauges and activity heatmaps.
- **Cloud Sync:** Powered by Firebase Authentication and Firestore. Your data follows you instantly across all your devices.
- **Progressive Web App (PWA):** Installable on iOS, Android, and Desktop with a native-feeling dark UI (no annoying browser bars) and smooth offline-first caching.
- **Native Notifications:** Opt-in to receive browser push notifications for weekly digests and price alerts.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion (for smooth micro-animations)
- **Backend/Database:** Firebase (Auth & Firestore)
- **Icons:** Lucide React
- **Deployment:** Vercel

## Running Locally

To run this project locally, you'll need Node.js installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yashftw/3am.git
   cd 3am
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Design Philosophy
The application utilizes a strictly minimalist aesthetic. It avoids harsh whites and generic primary colors, relying instead on a carefully curated dark palette (`#0a0a0a` background, `#111` surfaces) and smooth gradients to create a soothing, premium user experience.

---

*Made by **yashraj** and **antigravity** respectively.*
