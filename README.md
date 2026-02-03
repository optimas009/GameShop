
[![LIVE DEMONSTRATION](https://img.shields.io/badge/LIVE%20DEMONSTRATION-CLICK%20HERE-brightgreen?style=for-the-badge)](https://game-vault-neon.vercel.app/)

# 🎮 GameVault  
**Full-Stack MERN Game Store & Community Platform**

GameVault is a **production-ready full-stack game store platform** built using the **MERN stack**, combining **e-commerce**, **community interaction**, and **secure backend architecture** into a single scalable application.

It features a **social newsfeed**, **media uploads**, **reactions**, **commenting**, **game purchasing with unique keys**, and **role-based admin controls**, designed with real-world production practices in mind.

---

## 🎥 Video Demonstration
Watch the full demo here:  
👉 **[Click to View](https://drive.google.com/drive/folders/1YlwzBJyO-U8C28E3TtsxlKjnicEOvQkM?usp=sharing)**

---

## 📸 Screenshots

<div align="left">
  <img src="screenshots/ManageGame(admin).png" width="300" alt="Home Page">
  <img src="screenshots/NewsFeed.png" width="300" alt="News Feed">
  <img src="screenshots/GameDetails1.png" width="300" alt="Game Details">
  <img src="screenshots/Profile1.png" width="300" alt="Game Details">
</div>

---

## 🧱 Tech Stack

| Layer          | Technology |
|----------------|------------|
| Frontend       | React.js, CSS |
| Backend        | Node.js, Express.js |
| Database       | MongoDB |
| Authentication | JWT (JSON Web Tokens) |
| Security       | bcrypt.js |
| File Uploads   | Multer |
| Email Services | Nodemailer |
| Access Control | Role-Based Access Control (RBAC) |

---

## ✨ Core Features

### 📰 Social Newsfeed
- Create posts with **text, images, videos, and YouTube links**
- **React-based comment system**
- Post reactions
- Media previews before posting
- Admin moderation (delete posts & comments)

---

### 📤 Media Upload System
- Image & video uploads using **Multer**
- Server-side validation
- Upload size restrictions
- Secure file handling
- Media rendering inside posts

---

### 👤 User Accounts
- 🔐 **JWT Authentication** — secure session handling
- 📧 **Email Verification** — account activation via email
- 👤 User profile management
- 🎮 **Game Library** — permanent access to purchased games

---

### 🛒 Smart Game Purchasing
- 🧠 Smart cart logic (prevents duplicate purchases)
- 🔑 **Unique game keys generated per purchase**
- Persistent ownership per user
- Secure purchase flow

---

### 🛠️ Admin Panel (Admin Forge)
- 🔑 Role-Based Access Control (RBAC)
- 📚 Game catalog CRUD (Create, Update, Delete)
- 🧾 Inventory management
- 🗑️ Delete users’ posts and comments
- 🛡️ Admin-only protected APIs

---

## 🔐 Security Practices
- Environment variables protected via `.env`
- Passwords hashed using **bcrypt**
- JWT tokens with expiration
- Backend-only secrets (never exposed to frontend)
- Protected frontend & backend routes

---

## 📁 Project Structure

```plaintext

GameVault/
├── client/                 # Frontend (React)
├── server/                 # Backend (Express)
│   ├── config/             # App & DB configuration
│   ├── controllers/        # Request handlers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── uploads/            # Media uploads (images/videos)
│   └── server.js           # Server entry point
├── screenshots/            # Project screenshots
└── .gitignore
```

### 🚀 Installation Guide

---

### 1️⃣ Clone the Repository
- Clone the GameVault repository from GitHub
- Navigate into the project root directory
  - `git clone https://github.com/optimas009/GameVault.git`
  - `cd GameVault`

---

### 2️⃣ Backend Setup
- Move into the `server` directory
- Install backend dependencies
- Start the Express server
  - `cd server`
  - `npm install`
  - `npm start`

---

### 3️⃣ Frontend Setup
- Move into the `client` directory
- Install frontend dependencies
- Start the React development server
  - `cd client`
  - `npm install`
  - `npm start`

---

### 4️⃣ Environment Variables
- Create a `.env` file inside the `server` folder
- Configure JWT, email, and application base URL variables
  - `JWT_SECRET=change_me`
  - `EMAIL_USER=change_me`
  - `EMAIL_PASS=change_me`
  - `APP_BASE_URL=http://localhost:5000`

---

<hr>

<div align="center">
  <h1>🎮 GameVault</h1>
  <h2>🙏 Thank You</h2>
  <p>Thanks for taking the time to explore this project</p>
</div>



