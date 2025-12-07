const express = require("express");
const cors = require("cors");
const axios = require("axios");
const {PrismaClient} = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "xeno_super_secret";


require("dotenv").config();


const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;





// ✅ Read from .env
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-10";

// Just to confirm .env is loading
console.log("DOMAIN:", SHOPIFY_STORE_DOMAIN);
console.log("TOKEN FOUND:", SHOPIFY_ACCESS_TOKEN ? "YES" : "NO");

app.use(cors());
app.use(express.json());


// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.adminUser.create({
      data: { email, password: hashed }
    });

    res.json({ status: "ok", message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ status: "ok", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running 🎉" });
});

// ✅ Shopify test route
app.get("/api/shopify/products-test", async (req, res) => {
  try {
    // ⬇️ Now this will use the constants defined above
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
    });

    const products = response.data.products || [];
    res.json({
      status: "ok",
      count: products.length,
      sample: products.slice(0, 2),
    });
  } catch (err) {
    console.error("Shopify error:", err.response?.status, err.response?.data);

    res.status(500).json({
      status: "error",
      message: "Failed to fetch products from Shopify",
      details: err.response?.data || err.message,
    });
  }
});

// ✅ Route: Sync products from Shopify → MySQL
app.post("/api/shopify/sync-products", async (req, res) => {
  try {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
    });

    const products = response.data.products || [];
    let savedCount = 0;

    for (const p of products) {
      // Take first variant price (if it exists)
      const priceStr =
        p.variants && p.variants.length > 0 ? p.variants[0].price : null;

      await prisma.product.upsert({
        where: { shopifyId: BigInt(p.id) }, // BigInt for Prisma BigInt field
        update: {
          title: p.title,
          price: priceStr, // Decimal field can take string
        },
        create: {
          shopifyId: BigInt(p.id),
          title: p.title,
          price: priceStr,
        },
      });

      savedCount++;
    }

    res.json({
      status: "ok",
      message: "Products synced successfully",
      totalFromShopify: products.length,
      savedOrUpdated: savedCount,
    });
  } catch (err) {
    console.error("Sync products error:", err.response?.status, err.response?.data || err.message);

    res.status(500).json({
      status: "error",
      message: "Failed to sync products",
      details: err.response?.data || err.message,
    });
  }
});

// 🔧 Test route: insert a dummy product into DB (no Shopify)
app.post("/api/test-insert-product", async (req, res) => {
  try {
    const result = await prisma.product.create({
      data: {
        shopifyId: BigInt(999999999), // fake ID
        title: "Test Product From API",
        price: "123.45",
      },
    });

    // 🔑 Convert BigInt to string so JSON can handle it
    const safeResult = {
      ...result,
      shopifyId: result.shopifyId.toString(),
    };

    res.json({
      status: "ok",
      message: "Test product inserted",
      product: safeResult,
    });
  } catch (err) {
    console.error("Test insert error:", err);
    // Handle Prisma unique constraint error (P2002)
    if (err?.code === "P2002") {
      return res.status(409).json({
        status: "conflict",
        message: "Product with the same shopifyId already exists",
        details: err.meta,
      });
    }

    res.status(500).json({
      status: "error",
      message: "Failed to insert test product",
      details: err.message,
    });
  }
});

// ✅ Route: Sync customers from Shopify → MySQL
app.post("/api/shopify/sync-customers", async (req, res) => {
  try {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers.json?limit=250`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
    });

    const customers = response.data.customers || [];
    console.log("Shopify customers count:", customers.length);

    let savedCount = 0;

    for (const c of customers) {
      await prisma.customer.upsert({
        where: { shopifyId: BigInt(c.id) },
        update: {
          firstName: c.first_name,
          lastName: c.last_name,
          email: c.email,
          phone: c.phone,
          totalSpent: c.total_spent ? c.total_spent : undefined,
        },
        create: {
          shopifyId: BigInt(c.id),
          firstName: c.first_name,
          lastName: c.last_name,
          email: c.email,
          phone: c.phone,
          totalSpent: c.total_spent ? c.total_spent : undefined,
        },
      });

      savedCount++;
    }

    res.json({
      status: "ok",
      message: "Customers synced successfully",
      totalFromShopify: customers.length,
      savedOrUpdated: savedCount,
    });
  } catch (err) {
    console.error(
      "Sync customers error:",
      err.response?.status,
      err.response?.data || err.message
    );

    res.status(500).json({
      status: "error",
      message: "Failed to sync customers",
      details: err.response?.data || err.message,
    });
  }
});

// ✅ Route: Sync orders from Shopify → MySQL
app.post("/api/shopify/sync-orders", async (req, res) => {
  try {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/orders.json?limit=250&status=any`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
    });

    const orders = response.data.orders || [];
    console.log("Shopify orders count:", orders.length);

    let savedCount = 0;

    for (const o of orders) {
      await prisma.order.upsert({
        where: { shopifyId: BigInt(o.id) },
        update: {
          customerShopifyId: o.customer ? BigInt(o.customer.id) : null,
          totalPrice: o.total_price,
          currency: o.currency,
          financialStatus: o.financial_status,
          fulfillmentStatus: o.fulfillment_status,
          processedAt: o.processed_at ? new Date(o.processed_at) : undefined,
        },
        create: {
          shopifyId: BigInt(o.id),
          customerShopifyId: o.customer ? BigInt(o.customer.id) : null,
          totalPrice: o.total_price,
          currency: o.currency,
          financialStatus: o.financial_status,
          fulfillmentStatus: o.fulfillment_status,
          processedAt: o.processed_at ? new Date(o.processed_at) : undefined,
        },
      });

      savedCount++;
    }

    res.json({
      status: "ok",
      message: "Orders synced successfully",
      totalFromShopify: orders.length,
      savedOrUpdated: savedCount,
    });
  } catch (err) {
    console.error(
      "Sync orders error:",
      err.response?.status,
      err.response?.data || err.message
    );

    res.status(500).json({
      status: "error",
      message: "Failed to sync orders",
      details: err.response?.data || err.message,
    });
  }
});

// ✅ Metrics: Summary (total customers, total orders, total revenue)
app.get("/api/metrics/summary",authMiddleware, async (req, res) => {
  try {
    // Count customers
    const totalCustomers = await prisma.customer.count();

    // Count orders
    const totalOrders = await prisma.order.count();

    // Sum revenue from orders
    const revenueAgg = await prisma.order.aggregate({
      _sum: {
        totalPrice: true,
      },
    });

    // Normalize any Decimal/string result into a plain JS number before returning
    const rawRevenue = revenueAgg._sum?.totalPrice ?? 0;
    const totalRevenue =
      rawRevenue && typeof rawRevenue === "object" && typeof rawRevenue.toNumber === "function"
        ? rawRevenue.toNumber()
        : Number(rawRevenue) || 0;

    res.json({
      status: "ok",
      totalCustomers,
      totalOrders,
      totalRevenue,
    });
  } catch (err) {
    console.error("Summary metrics error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to calculate summary metrics",
      details: err.message,
    });
  }
});


// ✅ Metrics: Orders by date (for charts)
// Example: GET /api/metrics/orders-by-date?from=2025-11-01&to=2025-11-30
app.get("/api/metrics/orders-by-date",authMiddleware, async (req, res) => {
  try {
    const from = req.query.from;
    const to = req.query.to;

    if (!from || !to) {
      return res.status(400).json({
        status: "error",
        message: "Query params 'from' and 'to' (YYYY-MM-DD) are required",
      });
    }

    // Raw SQL (note backticks around Order)
    const rows = await prisma.$queryRaw`
      SELECT 
        DATE(processedAt) AS date,
        COUNT(*) AS orderCount,
        COALESCE(SUM(totalPrice), 0) AS revenue
      FROM \`Order\`
      WHERE processedAt IS NOT NULL
        AND DATE(processedAt) BETWEEN ${from} AND ${to}
      GROUP BY DATE(processedAt)
      ORDER BY DATE(processedAt);
    `;

    // 🔑 Convert BigInt/Decimal to plain JS numbers/strings
    const safeRows = rows.map((row) => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().slice(0, 10) // YYYY-MM-DD
          : String(row.date),
      orderCount: Number(row.orderCount) || 0,
      revenue: Number(row.revenue) || 0,
    }));

    res.json({
      status: "ok",
      from,
      to,
      data: safeRows,
    });
  } catch (err) {
    console.error("Orders by date metrics error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to calculate orders by date",
      details: err.message,
    });
  }
});

// ✅ Metrics: Top 5 customers by total spend
app.get("/api/metrics/top-customers", authMiddleware, async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT 
        c.id AS customerId,
        c.firstName,
        c.lastName,
        c.email,
        COUNT(o.id) AS ordersCount,
        COALESCE(SUM(o.totalPrice), 0) AS totalSpent
      FROM Customer c
      LEFT JOIN \`Order\` o
        ON o.customerShopifyId = c.shopifyId
      GROUP BY c.id, c.firstName, c.lastName, c.email
      ORDER BY totalSpent DESC
      LIMIT 5;
    `;

    const formatted = rows.map((row) => {
      const customerId = Number(row.customerId ?? 0);
      const ordersCount = Number(row.ordersCount ?? 0);
      const totalSpent = Number(row.totalSpent ?? 0);

      const firstName = row.firstName ?? "";
      const lastName = row.lastName ?? "";

      return {
        customerId,
        name: [firstName, lastName].filter(Boolean).join(" ") || null,
        email: row.email || null,
        ordersCount,
        totalSpent,
      };
    });

    res.json({
      status: "ok",
      data: formatted,
    });
  } catch (err) {
    console.error("Top customers metrics error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to calculate top customers",
      details: err.message,
    });
  }
});

const cron = require("node-cron");

cron.schedule("*/30 * * * *", async () => {
  console.log("⏳ Auto syncing Shopify data...");

  await axios.post("http://localhost:4000/api/shopify/sync-products");
  await axios.post("http://localhost:4000/api/shopify/sync-customers");
  await axios.post("http://localhost:4000/api/shopify/sync-orders");

  console.log("✅ Auto sync done");
});





// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
