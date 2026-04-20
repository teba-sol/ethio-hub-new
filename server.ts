import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // API ROUTES
  // ==========================================

  // --- Auth Routes ---
  app.post("/api/auth/register", (req, res) => {
    res.json({ message: "User registered successfully", user: { id: 1, ...req.body } });
  });
  app.post("/api/auth/login", (req, res) => {
    res.json({ message: "Login successful", token: "mock-jwt-token", user: { id: 1, role: req.body.email?.includes("admin") ? "Admin" : "Tourist" } });
  });
  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logout successful" });
  });
  app.get("/api/auth/me", (req, res) => {
    res.json({ user: { id: 1, name: "Test User", role: "Tourist" } });
  });

  // --- Public Routes ---
  app.get("/api/public/products", (req, res) => {
    res.json({ products: [] });
  });
  app.get("/api/public/products/:id", (req, res) => {
    res.json({ product: { id: req.params.id } });
  });
  app.get("/api/public/festivals", (req, res) => {
    res.json({ festivals: [] });
  });
  app.get("/api/public/festivals/:id", (req, res) => {
    res.json({ festival: { id: req.params.id } });
  });

  // --- Tourist Routes ---
  app.get("/api/tourist/bookings", (req, res) => {
    res.json({ bookings: [] });
  });
  app.post("/api/tourist/bookings", (req, res) => {
    res.json({ message: "Booking created", booking: { id: Date.now(), ...req.body } });
  });
  app.get("/api/tourist/orders", (req, res) => {
    res.json({ orders: [] });
  });
  app.post("/api/tourist/orders", (req, res) => {
    res.json({ message: "Order created", order: { id: Date.now(), ...req.body } });
  });
  app.get("/api/tourist/payments", (req, res) => {
    res.json({ payments: [] });
  });
  app.get("/api/tourist/wishlist", (req, res) => {
    res.json({ wishlist: [] });
  });
  app.post("/api/tourist/wishlist", (req, res) => {
    res.json({ message: "Added to wishlist" });
  });
  app.delete("/api/tourist/wishlist/:id", (req, res) => {
    res.json({ message: "Removed from wishlist" });
  });
  app.put("/api/tourist/settings", (req, res) => {
    res.json({ message: "Settings updated" });
  });

  // --- Artisan Routes ---
  app.post("/api/artisan/onboarding", (req, res) => {
    res.json({ message: "Onboarding complete" });
  });
  app.get("/api/artisan/overview", (req, res) => {
    res.json({ stats: {} });
  });
  app.get("/api/artisan/products", (req, res) => {
    res.json({ products: [] });
  });
  app.post("/api/artisan/products", (req, res) => {
    res.json({ message: "Product created", product: { id: Date.now(), ...req.body } });
  });
  app.put("/api/artisan/products/:id", (req, res) => {
    res.json({ message: "Product updated" });
  });
  app.delete("/api/artisan/products/:id", (req, res) => {
    res.json({ message: "Product deleted" });
  });
  app.get("/api/artisan/orders", (req, res) => {
    res.json({ orders: [] });
  });
  app.put("/api/artisan/orders/:id/status", (req, res) => {
    res.json({ message: "Order status updated" });
  });
  app.get("/api/artisan/revenue", (req, res) => {
    res.json({ revenue: {} });
  });
  app.get("/api/artisan/reviews", (req, res) => {
    res.json({ reviews: [] });
  });
  app.get("/api/artisan/analytics", (req, res) => {
    res.json({ analytics: {} });
  });
  app.put("/api/artisan/settings", (req, res) => {
    res.json({ message: "Settings updated" });
  });

  // --- Organizer Routes ---
  app.post("/api/organizer/onboarding", (req, res) => {
    res.json({ message: "Onboarding complete" });
  });
  app.get("/api/organizer/overview", (req, res) => {
    res.json({ stats: {} });
  });
  app.get("/api/organizer/festivals", (req, res) => {
    res.json({ festivals: [] });
  });
  app.post("/api/organizer/festivals", (req, res) => {
    res.json({ message: "Festival created", festival: { id: Date.now(), ...req.body } });
  });
  app.put("/api/organizer/festivals/:id", (req, res) => {
    res.json({ message: "Festival updated" });
  });
  app.delete("/api/organizer/festivals/:id", (req, res) => {
    res.json({ message: "Festival deleted" });
  });
  app.get("/api/organizer/bookings", (req, res) => {
    res.json({ bookings: [] });
  });
  app.put("/api/organizer/bookings/:id/status", (req, res) => {
    res.json({ message: "Booking status updated" });
  });
  app.get("/api/organizer/revenue", (req, res) => {
    res.json({ revenue: {} });
  });
  app.get("/api/organizer/reviews", (req, res) => {
    res.json({ reviews: [] });
  });
  app.get("/api/organizer/analytics", (req, res) => {
    res.json({ analytics: {} });
  });
  app.put("/api/organizer/settings", (req, res) => {
    res.json({ message: "Settings updated" });
  });

  // --- Admin Routes ---
  app.get("/api/admin/overview", (req, res) => {
    res.json({ stats: {} });
  });
  app.get("/api/admin/users", (req, res) => {
    res.json({ users: [] });
  });
  app.put("/api/admin/users/:id/status", (req, res) => {
    res.json({ message: "User status updated" });
  });
  app.get("/api/admin/verifications", (req, res) => {
    res.json({ verifications: [] });
  });
  app.put("/api/admin/verifications/:id/approve", (req, res) => {
    res.json({ message: "Verification approved" });
  });
  app.put("/api/admin/verifications/:id/reject", (req, res) => {
    res.json({ message: "Verification rejected" });
  });
  app.get("/api/admin/products", (req, res) => {
    res.json({ products: [] });
  });
  app.put("/api/admin/products/:id/status", (req, res) => {
    res.json({ message: "Product status updated" });
  });
  app.get("/api/admin/events", (req, res) => {
    res.json({ requests: [] });
  });
  app.post("/api/admin/events/:id/approve", (req, res) => {
    res.json({ success: true, message: "Event approved and published" });
  });
  app.post("/api/admin/events/:id/reject", (req, res) => {
    res.json({ success: true, message: "Event rejected", reason: req.body.reason });
  });
  app.put("/api/admin/events/:id/status", (req, res) => {
    res.json({ message: "Event status updated" });
  });
  app.get("/api/admin/revenue", (req, res) => {
    res.json({ revenue: {} });
  });
  app.get("/api/admin/reports", (req, res) => {
    res.json({ reports: [] });
  });
  app.get("/api/admin/logs", (req, res) => {
    res.json({ logs: [] });
  });
  app.put("/api/admin/settings", (req, res) => {
    res.json({ message: "Settings updated" });
  });

  // ==========================================
  // VITE MIDDLEWARE
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
