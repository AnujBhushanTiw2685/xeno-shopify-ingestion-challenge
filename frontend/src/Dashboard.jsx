import { useEffect, useState } from "react";
import api from "./api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Dashboard({ onLogout }) {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [fromDate, setFromDate] = useState("2025-11-01"); // default example range
  const [toDate, setToDate] = useState("2025-11-30");
  const [ordersSeries, setOrdersSeries] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [topCustomers, setTopCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");

  // 🔐 Logout handler
  function handleLogout() {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    window.location.reload(); // optional, to fully reset state
  }

  // ---------- Fetch summary ----------
  useEffect(() => {
    async function fetchSummary() {
      try {
        setSummaryLoading(true);
        const res = await api.get("/api/metrics/summary");
        setSummary(res.data);
      } catch (err) {
        console.error(err);
        setSummaryError("Failed to load summary metrics");
      } finally {
        setSummaryLoading(false);
      }
    }

    fetchSummary();
  }, []);

  // ---------- Fetch orders by date ----------
  async function fetchOrdersSeries() {
    try {
      if (!fromDate || !toDate) return;
      setOrdersLoading(true);
      setOrdersError("");
      const res = await api.get("/api/metrics/orders-by-date", {
        params: { from: fromDate, to: toDate },
      });
      // backend returns { status, data: [ {date, orderCount, revenue} ] }
      setOrdersSeries(res.data.data || []);
    } catch (err) {
      console.error(err);
      setOrdersError("Failed to load orders-by-date data");
    } finally {
      setOrdersLoading(false);
    }
  }

  // fetch orders series when component mounts (initially)
  useEffect(() => {
    fetchOrdersSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Fetch top customers ----------
  useEffect(() => {
    async function fetchTopCustomers() {
      try {
        setCustomersLoading(true);
        const res = await api.get("/api/metrics/top-customers");
        setTopCustomers(res.data.data || []);
      } catch (err) {
        console.error(err);
        setCustomersError("Failed to load top customers");
      } finally {
        setCustomersLoading(false);
      }
    }

    fetchTopCustomers();
  }, []);

  const totalCustomers = summary?.totalCustomers ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const totalRevenue =
    typeof summary?.totalRevenue === "number" ? summary.totalRevenue : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "white",
        margin: 0,
        padding: 24,
        zIndex: 9999,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflowY: "auto",
      }}
    >
      {/* 🔻 Updated header with Logout button */}
      <header
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{ fontSize: "24px", fontWeight: 600, marginBottom: "4px" }}
          >
            Shopify Insights Dashboard
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>
            Data ingested from your Shopify development store
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "6px 14px",
            borderRadius: "999px",
            border: "1px solid #334155",
            background: "transparent",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Logout
        </button>
      </header>

      {/* Summary cards */}
      <section style={{ marginBottom: "24px" }}>
        {summaryLoading ? (
          <div>Loading summary...</div>
        ) : summaryError ? (
          <div style={{ color: "tomato" }}>{summaryError}</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <StatCard title="Total Customers" value={totalCustomers} />
            <StatCard title="Total Orders" value={totalOrders} />
            <StatCard
              title="Total Revenue"
              value={`₹${totalRevenue.toFixed(2)}`}
            />
          </div>
        )}
      </section>

      {/* Orders by date + Top customers layout */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.2fr)",
          gap: "20px",
        }}
      >
        {/* Orders by date chart */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(148,163,184,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ fontSize: "16px", marginBottom: "4px" }}>
                Orders & Revenue by Date
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                Filter by date range to see trends
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <label style={{ fontSize: "12px", color: "#9ca3af" }}>
                From:{" "}
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{
                    background: "#020617",
                    color: "white",
                    borderRadius: "6px",
                    border: "1px solid #334155",
                    padding: "4px 6px",
                    fontSize: "12px",
                  }}
                />
              </label>
              <label style={{ fontSize: "12px", color: "#9ca3af" }}>
                To:{" "}
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{
                    background: "#020617",
                    color: "white",
                    borderRadius: "6px",
                    border: "1px solid #334155",
                    padding: "4px 6px",
                    fontSize: "12px",
                  }}
                />
              </label>
              <button
                onClick={fetchOrdersSeries}
                style={{
                  fontSize: "12px",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#22c55e",
                  color: "#020617",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Apply
              </button>
            </div>
          </div>

          {ordersLoading ? (
            <div>Loading chart...</div>
          ) : ordersError ? (
            <div style={{ color: "tomato" }}>{ordersError}</div>
          ) : ordersSeries.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: "13px" }}>
              No orders found for this range.
            </div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={ordersSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #475569",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orderCount"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                    name="Orders"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top customers */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(148,163,184,0.3)",
          }}
        >
          <h2 style={{ fontSize: "16px", marginBottom: "4px" }}>
            Top Customers by Spend
          </h2>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            Top 5 customers from your ingested order data
          </p>

          {customersLoading ? (
            <div>Loading customers...</div>
          ) : customersError ? (
            <div style={{ color: "tomato" }}>{customersError}</div>
          ) : topCustomers.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: "13px" }}>
              No customers with orders yet.
            </div>
          ) : (
            <div
              style={{
                borderRadius: "10px",
                border: "1px solid #1f2937",
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#020617",
                      textAlign: "left",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    <th style={{ padding: "8px 10px" }}>Customer</th>
                    <th style={{ padding: "8px 10px" }}>Orders</th>
                    <th style={{ padding: "8px 10px" }}>Total Spent (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c) => (
                    <tr
                      key={c.customerId}
                      style={{
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      <td style={{ padding: "8px 10px" }}>
                        <div style={{ fontWeight: 500 }}>
                          {c.name || "(No name)"}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#9ca3af",
                            wordBreak: "break-all",
                          }}
                        >
                          {c.email || "-"}
                        </div>
                      </td>
                      <td style={{ padding: "8px 10px" }}>{c.ordersCount}</td>
                      <td style={{ padding: "8px 10px" }}>
                        {c.totalSpent.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.9)",
        borderRadius: "12px",
        padding: "16px 18px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        border: "1px solid rgba(148, 163, 184, 0.3)",
      }}
    >
      <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ fontSize: "22px", fontWeight: "600" }}>{value ?? "-"}</div>
    </div>
  );
}
