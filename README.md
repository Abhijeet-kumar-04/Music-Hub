# 🎵 Music Hub

Welcome to **Music Hub**, a premium, full-stack web application designed to provide an unparalleled, ad-free music streaming experience.

Music Hub combines the world-class metadata and categorization of the Spotify API with the robust audio-delivery network of JioSaavn, delivering a seamless, high-quality music experience that feels premium but operates completely free of charge.

## ✨ Features

- **Ad-Free Music Streaming**: Listen to any song without interruptions.
- **Hybrid API Engine**: Uses Spotify for rich metadata, categories, and artist information, and JioSaavn for secure, encrypted audio streaming.
- **Beautiful UI/UX**: Features a highly responsive, modern dark-mode interface with glassmorphism effects, dynamic carousels, and premium micro-animations.
- **Artist & User Roles**: Users can listen to music and create custom playlists. Users who register as **Artists** can upload their own local tracks directly to the platform!
- **Global Leaderboards & Trends**: Real-time trending hits, "For You" recommendations, and top artist leaderboards.
- **Robust Security**: Built with production-ready security including Helmet, Rate Limiting, and MongoDB Session Stores.

---

## 🤔 How is Music Hub Different from Spotify? (The Significance)

If someone asks you, *"Why use Music Hub instead of Spotify?"*, here is your answer:

1. **The Ultimate Hybrid Experience (Free & Ad-Free):** 
   Spotify requires a paid Premium subscription to select specific songs without ads or shuffle-lock on mobile. Music Hub leverages a brilliant technical workaround: it uses Spotify's API for its beautiful data and categories, but dynamically fetches the actual audio files via JioSaavn. This gives users a **Spotify Premium-tier experience for absolutely zero cost**.

2. **A Haven for Independent Creators:**
   Unlike Spotify, which requires artists to go through complex third-party distributors (like DistroKid or TuneCore) to upload music, Music Hub features a built-in **Artist Portal**. Independent creators can register an Artist account and upload their local `.mp3` files directly to the platform, instantly sharing their music alongside mainstream hits.

3. **Lightweight & Privacy-Focused:**
   Music Hub doesn't track your every move with heavy algorithmic profiling or third-party ad trackers. It is a lightweight, open-source alternative that focuses purely on the joy of listening to music.

---

## 🚀 Deployment Guide (Render)

This application is fully optimized to be deployed on **[Render](https://render.com/)**. Follow these steps to go live:

### 1. Database Setup (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster.
2. Under "Database Access", create a new database user and password.
3. Under "Network Access", allow access from anywhere (`0.0.0.0/0`).
4. Click "Connect", choose "Connect your application", and copy your `MONGO_URI`.

### 2. Deploying on Render
1. Create a free account on [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `Music-Hub` repository.
4. Fill in the following settings:
   - **Name:** `music-hub-app` (or whatever you prefer)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Add Environment Variables**: Scroll down to the "Environment Variables" section and add the following keys from your `.env.example`:
   - `PORT` = `10000` (Render will automatically assign a port, but adding this is safe)
   - `MONGO_URI` = `mongodb+srv://<user>:<password>@cluster...` *(Paste the URI from MongoDB Atlas)*
   - `SESSION_SECRET` = `a-very-long-random-string-like-music-hub-2026!`
   - `SPOTIFY_CLIENT_ID` = *(Your Spotify Developer Client ID)*
   - `SPOTIFY_CLIENT_SECRET` = *(Your Spotify Developer Client Secret)*
   - `NODE_ENV` = `production`
6. Click **Create Web Service**. Render will now build and deploy your app!

---

## 💻 Local Development

To run the project locally on your machine:

1. Clone the repository: `git clone https://github.com/Abhijeet-kumar-04/Music-Hub.git`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and add your database and Spotify credentials.
4. Run the development server: `npm run dev`
5. Visit `http://localhost:5000` in your browser.

## 📄 License
This project is open-source and available under the ISC License.
