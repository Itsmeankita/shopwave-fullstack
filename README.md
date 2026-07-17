# 🛍️ ShopWave — Full-Stack E-Commerce Platform

**A production-style e-commerce web application built as a final year project**, featuring a glassmorphism single-page frontend, a Node.js/Express REST API backend, JWT authentication, and a 250+ product catalog (real products & photos via the DummyJSON API) with server-side search, filtering, and pagination.

🔗 **Live Demo:** https://fancy-lamington-4698e4.netlify.app
🔗 **Backend API:** https://shopwave-fullstack.onrender.com

*(Note: the backend runs on a free hosting tier — if it hasn't been used in the last ~15 minutes, the first request can take up to 50 seconds to wake it up. Please be patient on first load!)*

![Node](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6-F7DF1E?logo=javascript&logoColor=black)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-000000?logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📌 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Setup & Installation](#setup--installation)
- [Live Demo](#live-demo)
- [API Reference](#api-reference)
- [What's Real vs Simulated](#whats-real-vs-simulated)
- [Future Roadmap](#future-roadmap)
- [Resume Bullet Points](#resume-bullet-points)
- [License](#license)

---

## Overview

ShopWave is a full-stack e-commerce platform built to demonstrate practical, end-to-end web development skills: RESTful API design, JWT-based authentication and authorization, database modeling, server-side pagination/search, and a polished, responsive frontend — all without relying on a frontend framework.

It was built as a **final year academic project** and is structured to be resume-ready and interview-defensible: every feature is either genuinely functional against the backend, or clearly documented as a UI-only simulation (see [What's Real vs Simulated](#whats-real-vs-simulated)).

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3 (custom glassmorphism design system), Vanilla JavaScript (SPA routing, `fetch` API) | UI, client-side state, API consumption |
| **Backend** | Node.js, Express.js | REST API server |
| **Database** | lowdb (JSON file-based, synchronous) | Data persistence (products, users, orders, reviews, coupons) |
| **Authentication** | `jsonwebtoken` (JWT), `bcryptjs` (password hashing) | Stateless auth, role-based access control |
| **Utilities** | jsPDF, QRCode.js, Font Awesome, Web Speech API | Invoice generation, order QR codes, icons, voice search |
| **Deployment** | Render (backend), Netlify (frontend) | Live hosting |

**Why these choices?** lowdb keeps the project dependency-light and easy to run for anyone grading/reviewing it (`npm install && npm start` — no external database server required), while the API layer is written exactly as it would be against MongoDB/PostgreSQL, making a future migration (see [Future Roadmap](#future-roadmap)) straightforward.

---

## Project Structure

```
shopwave-fullstack/
├── backend/
│   ├── server.js              # Express app entry point, route mounting, error handling
│   ├── db.js                  # DB initialization; auto-seeds ~250 products (real data via DummyJSON) + admin account
│   ├── middleware/
│   │   └── auth.js            # JWT verification + admin role guard middleware
│   ├── routes/
│   │   ├── auth.js            # Register, login, profile, address book, forgot/reset password
│   │   ├── products.js        # Product CRUD, search, category/price filters, pagination, reviews
│   │   ├── cart.js            # Server-synced cart (per logged-in user)
│   │   ├── orders.js          # Place order, order history, cancellation, status updates
│   │   ├── admin.js           # Revenue/orders/users dashboard stats
│   │   └── coupons.js         # Coupon list, validation, admin management
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html             # Page markup (SPA — all "pages" are toggled divs)
│   ├── style.css              # Full glassmorphism design system
│   └── app.js                 # All client logic: routing, API calls, state, UI rendering
├── README.md
├── LICENSE
└── .gitignore
```

---

## Features

### 🛒 Core Shopping
- 250+ product catalog across 10 categories (Fashion, Electronics, Home & Kitchen, Grocery, Beauty & Personal Care, Sports & Fitness, Automotive, Books, Toys & Baby, Pet Supplies), paginated & searched server-side
- Category landing pages with dedicated banners
- Price range slider, in-stock filter, multi-field sorting
- Infinite scroll product loading
- Product detail pages with color/size selection, image zoom lightbox, quantity stepper
- Best Sellers section, Recently Viewed strip, Frequently Bought Together
- Compare up to 4 products side-by-side
- Wishlist with WhatsApp share

### 🔐 Authentication & Account
- JWT-based register/login with bcrypt password hashing
- **Forgot / reset password flow** (demo mode — reset code shown on-screen since no email provider is wired up)
- Role-based access control (`user` vs `admin`)
- Address book (add/delete, backend-persisted)
- Loyalty points & referral program

### 🛍️ Cart & Checkout
- Cart persists in `localStorage` for guests, **automatically synced to the backend for logged-in users** (survives across devices/sessions once signed in)
- Save for later, gift wrapping, coupon codes, GST tax calculation
- Multi-step checkout with address selection and payment method choice
- Order placement reduces real product stock server-side

### 📦 Orders
- Order history with animated status timeline (Processing → Shipped → Delivered)
- Cancel / reorder actions
- **Real PDF invoice generation** (jsPDF, built from live order data)
- **Real QR code** generation for order tracking (QRCode.js)

### ⭐ Reviews & Trust
- Star ratings + written reviews, persisted server-side
- "Verified Buyer" badge — automatically computed by checking the user's real order history
- Trust badges (secure payment, verified seller, money-back guarantee)

### 🎮 Engagement
- Spin-the-wheel first-visit discount popup (generates a real usable coupon via the API)
- Flash sale countdown timer
- Voice search (Web Speech API)
- AI-style chatbot widget (rule-based FAQ assistant)

### 👨‍💼 Admin Panel
- Revenue dashboard with a 7-day sales bar chart
- Product management (live price/stock editing against the database)
- Order management (status updates visible immediately to the customer)
- User list and coupon management

### 🎨 UX Polish
- Full glassmorphism design system, dark/light theme toggle
- Multi-currency (USD/INR) and multi-language (EN/HI) switch
- Skeleton loading states, toast notifications, custom 404 page
- Fully responsive (mobile, tablet, desktop)

---

## Setup & Installation

Want to run it locally instead of using the live demo? Follow these steps.

### Prerequisites
- [Node.js](https://nodejs.org) v18 or higher
- A modern browser (Chrome/Edge recommended for the voice search feature)
- An internet connection **the first time you start the backend** (it fetches real product data from DummyJSON — after that first successful run, products are cached in `backend/db.json` and no further internet access is needed)

### 1. Start the backend
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm start
```
Expected output:
```
✅ Fetched 194 real products (with real images) from DummyJSON
✅ Seeded 254 products across 10 categories (194 with real photos)
✅ Seeded default admin user: admin@shopwave.com / admin123
🚀 ShopWave API running at http://localhost:5000
```
**Leave this process running** — the API must stay up for the frontend to function.

### 2. Open the frontend
Open `frontend/index.html` directly in a browser, or serve it with VS Code's "Live Server" extension (recommended — right-click `index.html` → *Open with Live Server*).

### Demo credentials
| Role | Email | Password |
|---|---|---|
| Admin | `admin@shopwave.com` | `admin123` |
| Customer | *sign up with any email* | *your choice* |

---

## Live Demo

This project is deployed and live:

- **Frontend (Netlify):** https://fancy-lamington-4698e4.netlify.app
- **Backend API (Render):** https://shopwave-fullstack.onrender.com

The frontend is configured (in `frontend/app.js`) to call the live backend directly, so the demo works exactly like the local version — real signup/login, real product catalog, real orders, and a working admin panel (`admin@shopwave.com` / `admin123`).

**Free-tier note:** the backend is hosted on Render's free plan, which spins the server down after ~15 minutes of inactivity. The *first* request after a period of inactivity can take up to 50 seconds while it wakes back up — this is a hosting limitation, not a bug. Subsequent requests are fast.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account, returns JWT |
| POST | `/api/auth/login` | – | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user profile |
| POST | `/api/auth/forgot-password` | – | Generate a demo reset code |
| POST | `/api/auth/reset-password` | – | Reset password using the code |
| POST / DELETE | `/api/auth/addresses` | ✅ | Manage address book |
| GET | `/api/products` | – | List products (`category`, `search`, `sort`, `maxPrice`, `instock`, `page`, `limit`) |
| GET | `/api/products/:id` | – | Single product |
| POST / PUT / DELETE | `/api/products/:id` | ✅ Admin | Manage catalog |
| GET / POST | `/api/products/:id/reviews` | ✅ (POST) | Product reviews |
| GET | `/api/categories` | – | Distinct category list |
| GET / PUT / DELETE | `/api/cart` | ✅ | Server-synced cart |
| POST | `/api/orders` | ✅ | Place an order |
| GET | `/api/orders` / `/api/orders/:id` | ✅ | Order history / detail |
| PUT | `/api/orders/:id/cancel` | ✅ | Cancel an order |
| PUT | `/api/orders/:id/status` | ✅ Admin | Update order status |
| GET | `/api/admin/stats` / `/orders` / `/users` | ✅ Admin | Admin dashboard data |
| GET / POST / DELETE | `/api/coupons` | mixed | Coupon list / manage / apply |

---

## What's Real vs Simulated

Being able to explain this distinction clearly is one of the strongest things you can do in an interview — it shows engineering maturity.

| Feature | Status |
|---|---|
| REST API, JWT auth, password hashing | ✅ Fully real |
| Product catalog, search, pagination, filters | ✅ Fully real (server-side) |
| Orders, stock deduction, reviews, coupons | ✅ Fully real, persisted in `db.json` |
| Cart sync for logged-in users | ✅ Real (falls back to `localStorage` for guests) |
| PDF invoices / QR codes | ✅ Genuinely generated from live data |
| Live deployment | ✅ Real — backend on Render, frontend on Netlify |
| Forgot password | ⚠️ Real logic, but no email provider — reset code is shown on-screen instead of emailed |
| Payment gateways (Razorpay/Stripe/UPI) | ❌ UI only, no live transaction |
| AI Chatbot / voice search | ⚠️ Voice search is real (Web Speech API); chatbot is rule-based, not an LLM |
| Social login (Google/GitHub) | ❌ Placeholder button only |
| Email/SMS notifications | ❌ UI toggles only |
| Product images | ✅ Real photos for Electronics, Fashion, Beauty, Home & Kitchen, Grocery, Sports & Fitness, and Automotive (~194 products, fetched live from the DummyJSON API). Books / Toys & Baby / Pet Supplies use icon tiles — DummyJSON doesn't cover those categories (see note below) |

**Note on product images:** product data (names, brands, prices, ratings, and photos) for 7 of the 10 categories is fetched live from [DummyJSON](https://dummyjson.com) — a free public API built specifically for e-commerce prototypes — at server startup. This gives every one of those ~194 products a genuine, correctly-matched photo instead of a mismatched stock photo or a placeholder. DummyJSON doesn't offer Books, Toys & Baby, or Pet Supplies categories, so those are filled in by the synthetic generator (icon tiles, `photo: null`) in `db.js`. If DummyJSON is unreachable when the server starts (e.g. no internet), the app automatically falls back to synthetic-only data for every category so it still runs.

---

## Future Roadmap

If extending this project further (great material for a "v2" resume update):
1. Replace `lowdb` with MongoDB (Mongoose) or PostgreSQL (Prisma) for concurrent-write safety at scale.
2. Wire up Razorpay test mode for real (sandboxed) payments.
3. Connect the chatbot to a real LLM API (Claude/OpenAI) via a backend proxy route (never call an LLM API directly from the frontend — it would expose your API key).
4. Add a real email provider (SendGrid/Resend) for password resets and order confirmations.
5. Add `Dockerfile` + `docker-compose.yml` and a GitHub Actions CI workflow.
6. Add automated tests (Jest + Supertest for the API, Playwright for the frontend).
7. Upgrade off Render/Netlify free tiers to remove the cold-start delay.

---

## Resume Bullet Points

> **ShopWave — Full-Stack E-Commerce Platform** | Node.js, Express, JWT, JavaScript | [Live Demo](https://fancy-lamington-4698e4.netlify.app)
> Designed, built, and deployed a full-stack e-commerce application with a 25+ endpoint REST API, JWT authentication with bcrypt hashing, and role-based admin authorization. Implemented server-side search/filter/pagination across a 250+ product catalog spanning 10 categories with real product photos, a backend-synced shopping cart, order management with real stock deduction, a review system with automatic "verified buyer" detection, and PDF invoice generation. Deployed backend to Render and frontend to Netlify.

---

## License
MIT — free to use for learning, portfolio, and academic submission.