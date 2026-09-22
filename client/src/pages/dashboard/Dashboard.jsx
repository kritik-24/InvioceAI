
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  IndianRupee,
  Plus,
  ReceiptText,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import api from "../../services/api";

const STATUS_COLORS = [
  "#64748b",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
];

const statusStyles = {
  Paid:
    "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  Sent:
    "border border-blue-500/20 bg-blue-500/10 text-blue-300",
  Draft:
    "border border-slate-500/20 bg-slate-500/10 text-slate-300",
  "Partially Paid":
    "border border-amber-500/20 bg-amber-500/10 text-amber-300",
  Overdue:
    "border border-red-500/20 bg-red-500/10 text-red-300",
};

const insightStyles = {
  success: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
  },
  info: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/10",
    icon: Sparkles,
    iconColor: "text-blue-400",
  },
  warning: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  danger: {
    border: "border-red-500/20",
    bg: "bg-red-500/10",
    icon: AlertTriangle,
    iconColor: "text-red-400",
  },
};

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [chartRange, setChartRange] = useState("all");
  const [chartMetric, setChartMetric] = useState("billed");

  const fetchDashboardAnalytics = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/dashboard/analytics");
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error("Dashboard Analytics Error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to fetch dashboard analytics"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardAnalytics();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPercentage = (value, total) => {
    if (!total || total <= 0) return 0;
    return Math.round((Number(value || 0) / total) * 100);
  };

  const statusData = useMemo(() => {
    return [
      {
        name: "Draft",
        value: analytics?.statusOverview?.Draft || 0,
      },
      {
        name: "Sent",
        value: analytics?.statusOverview?.Sent || 0,
      },
      {
        name: "Partially Paid",
        value: analytics?.statusOverview?.["Partially Paid"] || 0,
      },
      {
        name: "Paid",
        value: analytics?.statusOverview?.Paid || 0,
      },
      {
        name: "Overdue",
        value: analytics?.statusOverview?.Overdue || 0,
      },
    ];
  }, [analytics]);

  const filteredRevenueAnalytics = useMemo(() => {
    const source = Array.isArray(analytics?.revenueAnalytics)
      ? analytics.revenueAnalytics
      : [];

    if (chartRange === "all") return source;

    const rangeMap = {
      "3": 3,
      "6": 6,
      "12": 12,
    };

    const count = rangeMap[chartRange];
    if (!count) return source;

    return source.slice(-count);
  }, [analytics, chartRange]);

  const filteredPaymentAnalytics = useMemo(() => {
    const source = Array.isArray(analytics?.paymentAnalytics)
      ? analytics.paymentAnalytics
      : [];

    if (chartRange === "all") return source;

    const rangeMap = {
      "3": 3,
      "6": 6,
      "12": 12,
    };

    const count = rangeMap[chartRange];
    if (!count) return source;

    return source.slice(-count);
  }, [analytics, chartRange]);

  const revenueChartData = useMemo(() => {
    return filteredRevenueAnalytics.map((item) => ({
      ...item,
      billed: Number(item.revenue || 0),
      collected: Number(item.collected || 0),
      outstanding: Number(item.outstanding || 0),
    }));
  }, [filteredRevenueAnalytics]);

  const activeChartConfig = useMemo(() => {
    const configs = {
      billed: {
        key: "billed",
        label: "Billed",
        color: "#8b5cf6",
      },
      collected: {
        key: "collected",
        label: "Collected",
        color: "#10b981",
      },
      outstanding: {
        key: "outstanding",
        label: "Outstanding",
        color: "#f59e0b",
      },
    };

    return configs[chartMetric] || configs.billed;
  }, [chartMetric]);

  const monthlyComparisonData = useMemo(() => {
    return filteredRevenueAnalytics.map((item) => ({
      month: item.month,
      Billed: Number(item.revenue || 0),
      Collected: Number(item.collected || 0),
      Outstanding: Number(item.outstanding || 0),
    }));
  }, [filteredRevenueAnalytics]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <RefreshCw size={32} className="animate-spin text-violet-400" />
        <p className="mt-4 text-sm font-medium text-slate-400">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
        <AlertTriangle size={36} className="mx-auto text-red-400" />

        <h2 className="mt-4 text-lg font-semibold text-red-300">
          Unable to Load Dashboard
        </h2>

        <p className="mt-2 text-sm text-red-300/70">{error}</p>

        <button
          onClick={() => fetchDashboardAnalytics()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  const totalInvoices = analytics?.totalInvoices || 0;
  const collectionRate = analytics?.collectionRate || 0;
  const totalOutstanding = Number(analytics?.totalOutstanding || 0);
  const totalCollected = Number(analytics?.totalCollected || 0);
  const overdueAmount = Number(analytics?.overdueAmount || 0);
  const revenueGrowth = Number(analytics?.revenueGrowth || 0);
  const collectionGrowth = Number(analytics?.collectionGrowth || 0);

  const stats = [
    {
      title: "Total Billed",
      value: formatCurrency(analytics?.totalRevenue),
      description: `${totalInvoices} invoice(s) created`,
      icon: IndianRupee,
      iconStyle:
        "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    {
      title: "Total Collected",
      value: formatCurrency(analytics?.totalCollected),
      description: `${collectionRate}% collection rate`,
      icon: CheckCircle2,
      iconStyle:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Outstanding",
      value: formatCurrency(analytics?.totalOutstanding),
      description: `${formatCurrency(analytics?.pendingAmount)} pending across active invoices`,
      icon: Clock3,
      iconStyle:
        "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      title: "Overdue",
      value: formatCurrency(analytics?.overdueAmount),
      description: `${analytics?.overdueInvoiceCount || 0} overdue invoice(s)`,
      icon: AlertTriangle,
      iconStyle: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  ];

  const performanceMetrics = [
    {
      title: "Average Invoice",
      value: formatCurrency(analytics?.averageInvoiceValue),
      description: "Average billed value per invoice",
      icon: ReceiptText,
      iconStyle: "bg-violet-500/10 text-violet-400",
    },
    {
      title: "Average Paid Invoice",
      value: formatCurrency(analytics?.averagePaidInvoiceValue),
      description: "Average collected amount across fully paid invoices",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      description: "Collected amount versus total billed",
      icon: TrendingUp,
      iconStyle: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "Payment Success",
      value: `${analytics?.paymentSuccessRate || 0}%`,
      description: "Invoices fully paid",
      icon: CheckCircle2,
      iconStyle: "bg-cyan-500/10 text-cyan-400",
    },
    {
      title: "Overdue Risk",
      value: `${analytics?.overdueRiskRate || 0}%`,
      description: "Share of invoices currently overdue",
      icon: TrendingDown,
      iconStyle: "bg-red-500/10 text-red-400",
    },
    {
      title: "Latest Growth",
      value: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth}%`,
      description: "Latest monthly billed revenue change",
      icon: revenueGrowth >= 0 ? TrendingUp : TrendingDown,
      iconStyle:
        revenueGrowth >= 0
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <ReceiptText size={23} className="text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Track billing, collections, outstanding payments and client activity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => fetchDashboardAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-[#17213a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            to="/invoices/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-purple-500"
          >
            <Plus size={18} />
            Create Invoice
          </Link>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="group rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-400">
                    {stat.title}
                  </p>
                  <h2 className="mt-3 truncate text-3xl font-bold tracking-tight text-white">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${stat.iconStyle}`}
                >
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {performanceMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.title}
              className="rounded-2xl border border-white/10 bg-[#111a2e] p-5"
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-3 ${metric.iconStyle}`}>
                  <Icon size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-slate-400">{metric.title}</p>
                  <h3 className="mt-1 text-xl font-bold text-white">
                    {metric.value}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {metric.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Invoices
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest invoices with collection progress
              </p>
            </div>

            <Link
              to="/invoices"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-violet-400 transition hover:text-violet-300"
            >
              View All
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {!analytics?.recentInvoices || analytics.recentInvoices.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-white/10 p-10 text-center">
              <FileText size={28} className="mx-auto text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">
                No invoices created yet.
              </p>
              <Link
                to="/invoices/create"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-violet-500/30 hover:text-white"
              >
                <Plus size={15} />
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {analytics.recentInvoices.map((invoice) => {
                const invoiceTotal = Number(invoice.total || 0);
                const paidAmount = Math.min(
                  Math.max(Number(invoice.paidAmount || 0), 0),
                  invoiceTotal
                );
                const outstandingAmount = Math.max(
                  invoiceTotal - paidAmount,
                  0
                );
                const paymentPercentage = getPercentage(
                  paidAmount,
                  invoiceTotal
                );

                return (
                  <Link
                    key={invoice._id}
                    to={`/invoices/${invoice._id}`}
                    className="block rounded-xl border border-white/5 bg-[#0b1220]/60 p-4 transition hover:border-violet-500/20 hover:bg-[#0b1220]"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-violet-300">
                            {invoice.invoiceNumber}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              statusStyles[invoice.status] ||
                              "border border-slate-500/20 bg-slate-500/10 text-slate-300"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-slate-400">
                          {invoice.clientName || "Unknown Client"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>

                      <div className="min-w-[210px] xl:w-[260px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Paid</span>
                          <span className="font-semibold text-emerald-300">
                            {formatCurrency(paidAmount)}
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${paymentPercentage}%` }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {paymentPercentage}% collected
                          </span>
                          <span className="font-semibold text-amber-300">
                            {formatCurrency(outstandingAmount)} due
                          </span>
                        </div>
                      </div>

                      <div className="text-left xl:text-right">
                        <p className="text-xs text-slate-500">Invoice Total</p>
                        <p className="mt-1 font-semibold text-white">
                          {formatCurrency(invoiceTotal)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
          <h2 className="text-lg font-semibold text-white">Invoice Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            Status distribution across all invoices
          </p>

          <div className="mt-4 h-[235px]">
            {totalInvoices === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
                No invoice status data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="45%"
                    outerRadius={78}
                    innerRadius={42}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`status-cell-${entry.name}`}
                        fill={STATUS_COLORS[index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
            {statusData.map((item, index) => {
              const percentage = getPercentage(item.value, totalInvoices);

              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[index] }}
                      />
                      <span className="truncate text-sm text-slate-400">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {item.value}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Revenue & Collection Analytics
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Monthly billing performance based on invoice issue dates
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={chartRange}
              onChange={(event) => setChartRange(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm font-medium text-slate-200 outline-none transition focus:border-violet-500/40"
            >
              <option value="all">All months</option>
              <option value="12">Last 12 months</option>
              <option value="6">Last 6 months</option>
              <option value="3">Last 3 months</option>
            </select>

            <select
              value={chartMetric}
              onChange={(event) => setChartMetric(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm font-medium text-slate-200 outline-none transition focus:border-violet-500/40"
            >
              <option value="billed">Billed</option>
              <option value="collected">Collected</option>
              <option value="outstanding">Outstanding</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300">
            Billed: {formatCurrency(analytics?.totalRevenue)}
          </div>
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
            Collected: {formatCurrency(totalCollected)}
          </div>
          <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
            Outstanding: {formatCurrency(totalOutstanding)}
          </div>
          <div
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${
              revenueGrowth >= 0
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-red-500/10 text-red-300"
            }`}
          >
            {revenueGrowth >= 0 ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {revenueGrowth >= 0 ? "+" : ""}
            {revenueGrowth}% latest billed growth
          </div>
        </div>

        {revenueChartData.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-slate-500">
            No monthly invoice data is available yet.
          </div>
        ) : (
          <div className="mt-6 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickFormatter={(value) =>
                    `₹${Number(value || 0).toLocaleString("en-IN")}`
                  }
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar
                  dataKey={activeChartConfig.key}
                  name={activeChartConfig.label}
                  fill={activeChartConfig.color}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            [
              "Billed",
              formatCurrency(analytics?.totalRevenue),
              "border-violet-500/20 bg-violet-500/5",
            ],
            [
              "Collected",
              formatCurrency(analytics?.totalCollected),
              "border-emerald-500/20 bg-emerald-500/5",
            ],
            [
              "Outstanding",
              formatCurrency(analytics?.totalOutstanding),
              "border-amber-500/20 bg-amber-500/5",
            ],
          ].map(([label, value, toneClass]) => (
            <div
              key={label}
              className={`rounded-xl border p-4 ${toneClass}`}
            >
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Payment Activity
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Actual recorded payments grouped by payment month
              </p>
            </div>

            <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              {collectionGrowth >= 0 ? "+" : ""}
              {collectionGrowth}% growth
            </div>
          </div>

          {filteredPaymentAnalytics.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">
              No recorded payment history is available for this period.
            </div>
          ) : (
            <div className="mt-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredPaymentAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) =>
                      `₹${Number(value || 0).toLocaleString("en-IN")}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="collected"
                    name="Payments Collected"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-[#0b1220]/60 p-4">
              <p className="text-xs text-slate-500">Total collected</p>
              <p className="mt-1 text-lg font-bold text-emerald-300">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#0b1220]/60 p-4">
              <p className="text-xs text-slate-500">Outstanding</p>
              <p className="mt-1 text-lg font-bold text-amber-300">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-3">
              <Users size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Collection Health</h2>
              <p className="text-sm text-slate-400">
                Where your billed money currently stands
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Collected</span>
                <span className="font-semibold text-emerald-300">
                  {collectionRate}%
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-xl border border-white/5 bg-[#0b1220]/60 p-4">
                <p className="text-xs text-slate-500">Partially Paid</p>
                <p className="mt-1 text-lg font-bold text-amber-300">
                  {formatCurrency(analytics?.partiallyPaidAmount)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {analytics?.partiallyPaidInvoiceCount || 0} invoice(s)
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0b1220]/60 p-4">
                <p className="text-xs text-slate-500">Overdue</p>
                <p className="mt-1 text-lg font-bold text-red-300">
                  {formatCurrency(overdueAmount)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {analytics?.overdueInvoiceCount || 0} invoice(s)
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0b1220]/60 p-4">
                <p className="text-xs text-slate-500">Still Outstanding</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {formatCurrency(totalOutstanding)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {getPercentage(totalOutstanding, analytics?.totalRevenue || 0)}% of billed value
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#0b1220]/60 p-5">
              <div className="flex items-start gap-3">
                <Clock3 size={20} className="mt-0.5 text-violet-400" />
                <div>
                  <p className="font-semibold text-white">
                    Collection growth
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Actual payment activity changed by {collectionGrowth >= 0 ? "+" : ""}
                    {collectionGrowth}% in the latest comparable payment month.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles size={19} className="text-white" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Smart Business Insights
            </h2>
            <p className="text-sm text-slate-400">
              Insights generated from your invoice data
            </p>
          </div>
        </div>

        {!analytics?.aiInsights || analytics.aiInsights.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
            Create more invoices to unlock business insights.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analytics.aiInsights.map((insight, index) => {
              const style =
                insightStyles[insight.type] || insightStyles.info;
              const Icon = style.icon;

              return (
                <div
                  key={`${insight.title}-${index}`}
                  className={`rounded-xl border ${style.border} ${style.bg} p-5`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={20} className={style.iconColor} />
                    <div>
                      <h3 className="font-semibold text-white">
                        {insight.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {analytics?.topClients && analytics.topClients.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-3">
              <Users size={20} className="text-blue-400" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">Top Clients</h2>
              <p className="text-sm text-slate-400">
                Clients with the highest collected revenue
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {analytics.topClients.map((client, index) => (
              <div
                key={`${client.clientName}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220]/60 p-5 transition hover:border-violet-500/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-400">
                    #{index + 1}
                  </span>
                  <Users size={17} className="text-slate-600" />
                </div>

                <h3 className="mt-4 truncate font-semibold text-white">
                  {client.clientName}
                </h3>

                <p className="mt-2 text-lg font-bold text-emerald-400">
                  {formatCurrency(client.revenue)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Collected from {client.invoiceCount} invoice(s)
                </p>

                <div className="mt-4 space-y-2 border-t border-white/5 pt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Billed</span>
                    <span className="font-medium text-slate-300">
                      {formatCurrency(client.billedAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Outstanding</span>
                    <span className="font-medium text-amber-300">
                      {formatCurrency(client.outstandingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Link
            to="/invoices/create"
            className="group rounded-xl border border-white/10 bg-[#0b1220]/60 p-5 transition hover:border-violet-500/30 hover:bg-[#0b1220]"
          >
            <Plus size={20} className="text-violet-400" />
            <p className="mt-4 font-semibold text-white">Create Invoice</p>
            <p className="mt-1 text-xs text-slate-500">
              Add a new invoice and start tracking payment.
            </p>
          </Link>

          <Link
            to="/invoices"
            className="group rounded-xl border border-white/10 bg-[#0b1220]/60 p-5 transition hover:border-blue-500/30 hover:bg-[#0b1220]"
          >
            <ReceiptText size={20} className="text-blue-400" />
            <p className="mt-4 font-semibold text-white">Manage Invoices</p>
            <p className="mt-1 text-xs text-slate-500">
              Review statuses, payments, filters and invoice details.
            </p>
          </Link>

          <Link
            to="/clients"
            className="group rounded-xl border border-white/10 bg-[#0b1220]/60 p-5 transition hover:border-emerald-500/30 hover:bg-[#0b1220]"
          >
            <Users size={20} className="text-emerald-400" />
            <p className="mt-4 font-semibold text-white">Manage Clients</p>
            <p className="mt-1 text-xs text-slate-500">
              Maintain client records and review invoice history.
            </p>
          </Link>

          <div className="rounded-xl border border-white/10 bg-[#0b1220]/60 p-5">
            <FileText size={20} className="text-amber-400" />
            <p className="mt-4 font-semibold text-white">Invoice Pipeline</p>
            <p className="mt-1 text-xs text-slate-500">
              {analytics?.draftInvoiceCount || 0} drafts · {analytics?.sentInvoiceCount || 0} sent · {analytics?.partiallyPaidInvoiceCount || 0} partial · {analytics?.paidInvoiceCount || 0} paid
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
