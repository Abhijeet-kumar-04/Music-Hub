# 🎵 Music Hub

![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)

## 📖 Description

**What it does:** Music Hub is a full-stack, premium web application designed to provide a completely free, ad-free music streaming experience. It uses a unique hybrid-engine approach, leveraging Spotify's API for beautiful metadata (categories, artist images, global charts) and the JioSaavn API for the actual secure audio delivery. 

**Why it was built:** Mainstream music platforms lock essential features (like ad-free listening, specific track selection, and high-quality audio) behind premium paywalls. Furthermore, independent artists struggle to upload their music without paying third-party distributors. Music Hub was built to solve both problems: giving listeners a premium, unrestricted streaming experience for free, and providing indie artists a direct portal to upload and share their music.

**Who it is for:** Music Hub is for avid music listeners who want an uninterrupted, ad-free streaming experience, and for independent artists looking for a platform to upload and share their custom tracks alongside mainstream hits.

**Live Demo:** [https://notebook-7qpw.onrender.com](https://music-hub-spy9.onrender.com)
---

## 📑 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Roadmap / Future Plans](#-roadmap--future-plans)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Contact Information](#-contact-information)

---

## ✨ Features

- **Ad-Free Streaming:** Listen to any song, anytime, with zero audio or visual interruptions.
- **Hybrid API Engine:** Spotify handles the rich metadata and UI organization, while JioSaavn handles the backend audio streaming.
- **Artist Upload Portal:** Users can register as Artists and upload their own local `.mp3` tracks directly to the platform.
- **Custom Playlists:** Create, edit, and manage your own personal playlists.
- **Dynamic Dashboard:** Real-time trending hits, "For You" recommendations, top artist leaderboards, and categorized genres with robust "Load More" pagination.
- **Premium UI/UX:** Responsive dark-mode interface with glassmorphism, dynamic carousels, and modern typography.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, Vanilla CSS3, EJS (Embedded JavaScript templates)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose, connect-mongo)
- **APIs:** Spotify Web API, JioSaavn Unofficial API
- **Security:** Helmet, Express Rate Limit, bcryptjs, JWT
- **Media Handling:** Multer (for local audio uploads)

---

## ⚙️ Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance installed, or a free MongoDB Atlas URI)
- A **Spotify Developer Account** (to generate Client ID and Secret for the API)

---

## 💻 Installation

Follow these steps to get your development environment running:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhijeet-kumar-04/Music-Hub.git
   cd Music-Hub
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Rename the `.env.example` file to `.env` (or create a new `.env` file) and fill in your credentials:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/music_full
   SESSION_SECRET=your_super_secret_session_key
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

---

## 🚀 Usage

Once your environment is set up and your MongoDB database is running, you can start the application:

**For Development:**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

1. Open your web browser and navigate to `http://localhost:5000`.
2. **As a User:** Create an account, browse the dashboard, search for songs, and create your own playlists.
3. **As an Artist:** Select the "Artist" role during signup to unlock the "Upload Song" dashboard, allowing you to upload local `.mp3` files.

---

## 🗺️ Roadmap / Future Plans

- [ ] **Social Follow System:** Allow users to follow their favorite artists and friends.
- [ ] **Live Lyrics Integration:** Add synced lyrics to the global audio player.
- [ ] **PWA Support:** Convert the application into a Progressive Web App for offline capabilities and mobile home-screen installation.
- [ ] **Audio Visualizer:** Implement Web Audio API for a dynamic EQ visualizer during playback.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the ISC License. See `package.json` for more information.

---

## 🙏 Acknowledgments

- [Spotify Web API Node](https://github.com/thelinmichael/spotify-web-api-node) for the metadata wrapper.
- JioSaavn Unofficial API structures for providing accessible audio streaming links.
- All the open-source contributors whose packages made this project possible.

---

## 📬 Contact Information

**Abhijeet Kumar**  
- **GitHub:** [@Abhijeet-kumar-04](https://github.com/Abhijeet-kumar-04)
- **Project Link:** [https://github.com/Abhijeet-kumar-04/Music-Hub](https://github.com/Abhijeet-kumar-04/Music-Hub)
