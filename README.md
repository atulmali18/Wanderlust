# Wanderlust

A full-stack application for listing, reviewing, and booking travel destinations.

---

## Features

- User authentication (JWT-based)
- Google and Facebook OAuth support
- Listings with images, reviews, and ratings
- Admin and user roles
- RESTful API

---

## Getting Started

### 1. **Clone the repository**

```sh
git clone https://github.com/your-username/wanderlust.git
cd wanderlust
```

### 2. **Install dependencies**

```sh
npm install
```

### 3. **Environment Variables**

Create a `.env` file in the root directory and add the following:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

> **Note:** Never commit your `.env` file to version control.

### 4. **Run the Application**

```sh
npm start
```

The server will start on `http://localhost:3000` (or your configured port).

---

## Project Structure

```
Wanderlust/
│
├── models/           # Mongoose models (User, Listing, Review)
├── routes/           # Express route handlers
├── utils/            # Utility functions (JWT, error handling, etc.)
├── .env              # Environment variables
├── app.js            # Main Express app
├── package.json
└── README.md
```

---

## Deployment

- This project is ready for deployment on platforms like **Vercel** or **Heroku**.
- **Important:** Do not use JWT or Node.js core modules in Edge Middleware (`middleware.js` at the root) if deploying to Vercel.

---

## Troubleshooting

- **Edge Function errors on Vercel:**  
  Do not use JWT or Node.js core modules in Edge Middleware. Use them only in API routes or server-side code.

- **MongoDB connection issues:**  
  Double-check your `MONGODB_URI` in the `.env` file.

---

## License

MIT

---
