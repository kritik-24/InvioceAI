
const Invoice = require("../models/Invoice");

// =====================================
// GET DASHBOARD ANALYTICS
// =====================================

const getDashboardAnalytics = async (req, res) => {
  try {
    // =====================================
    // GET USER INVOICES
    // =====================================

    const invoices = await Invoice.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    // =====================================
    // BASIC COUNTS
    // =====================================

    const totalInvoices = invoices.length;

    const draftInvoices = invoices.filter(
      (invoice) => invoice.status === "Draft"
    );

    const sentInvoices = invoices.filter(
      (invoice) => invoice.status === "Sent"
    );

    const partiallyPaidInvoices = invoices.filter(
      (invoice) => invoice.status === "Partially Paid"
    );

    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "Paid"
    );

    const overdueInvoices = invoices.filter(
      (invoice) => invoice.status === "Overdue"
    );

    // =====================================
    // FINANCIAL HELPERS
    // =====================================

    const getTotal = (invoice) => {
      return Math.max(Number(invoice.total || 0), 0);
    };

    const getPaidAmount = (invoice) => {
      const total = getTotal(invoice);
      const paidAmount = Math.max(
        Number(invoice.paidAmount || 0),
        0
      );

      return Math.min(paidAmount, total);
    };

    const getOutstandingAmount = (invoice) => {
      const total = getTotal(invoice);
      const paidAmount = getPaidAmount(invoice);

      return Math.max(total - paidAmount, 0);
    };

    // =====================================
    // TOTAL BILLED
    // =====================================

    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + getTotal(invoice),
      0
    );

    // =====================================
    // TOTAL COLLECTED
    // =====================================

    const totalCollected = invoices.reduce(
      (sum, invoice) => sum + getPaidAmount(invoice),
      0
    );

    // =====================================
    // OUTSTANDING AMOUNT
    // =====================================

    const totalOutstanding = invoices.reduce(
      (sum, invoice) =>
        sum + getOutstandingAmount(invoice),
      0
    );

    // =====================================
    // PAID REVENUE
    // =====================================

    const paidRevenue = totalCollected;

    // =====================================
    // PENDING INVOICES
    // Sent + Partially Paid + Overdue
    // =====================================

    const pendingInvoices = invoices.filter(
      (invoice) =>
        invoice.status === "Sent" ||
        invoice.status === "Partially Paid" ||
        invoice.status === "Overdue"
    );

    // =====================================
    // PENDING AMOUNT
    // =====================================

    const pendingAmount = pendingInvoices.reduce(
      (sum, invoice) =>
        sum + getOutstandingAmount(invoice),
      0
    );

    // =====================================
    // OVERDUE AMOUNT
    // =====================================

    const overdueAmount = overdueInvoices.reduce(
      (sum, invoice) =>
        sum + getOutstandingAmount(invoice),
      0
    );

    // =====================================
    // PARTIALLY PAID AMOUNT
    // =====================================

    const partiallyPaidAmount =
      partiallyPaidInvoices.reduce(
        (sum, invoice) =>
          sum + getOutstandingAmount(invoice),
        0
      );

    // =====================================
    // STATUS OVERVIEW
    // =====================================

    const statusOverview = {
      Draft: draftInvoices.length,
      Sent: sentInvoices.length,
      "Partially Paid": partiallyPaidInvoices.length,
      Paid: paidInvoices.length,
      Overdue: overdueInvoices.length,
    };

    // =====================================
    // RECENT INVOICES
    // =====================================

    const recentInvoices = invoices.slice(0, 5).map(
      (invoice) => ({
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        total: getTotal(invoice),
        paidAmount: getPaidAmount(invoice),
        outstandingAmount:
          getOutstandingAmount(invoice),
      })
    );

    // =====================================
    // AVERAGE INVOICE VALUE
    // =====================================

    const averageInvoiceValue =
      totalInvoices > 0
        ? Math.round(totalRevenue / totalInvoices)
        : 0;

    // =====================================
    // AVERAGE PAID COLLECTION
    // =====================================

    const averagePaidInvoiceValue =
      paidInvoices.length > 0
        ? Math.round(
            totalCollected / paidInvoices.length
          )
        : 0;

    // =====================================
    // PAYMENT SUCCESS RATE
    // =====================================

    const paymentSuccessRate =
      totalInvoices > 0
        ? Math.round(
            (paidInvoices.length / totalInvoices) *
              100
          )
        : 0;

    // =====================================
    // COLLECTION RATE
    // =====================================

    const collectionRate =
      totalRevenue > 0
        ? Math.round(
            (totalCollected / totalRevenue) * 100
          )
        : 0;

    // =====================================
    // OVERDUE RISK RATE
    // =====================================

    const overdueRiskRate =
      totalInvoices > 0
        ? Math.round(
            (overdueInvoices.length / totalInvoices) *
              100
          )
        : 0;

    // =====================================
    // MONTHLY REVENUE ANALYTICS
    // Based on invoice issue dates
    // =====================================

    const monthlyRevenueMap = {};

    invoices.forEach((invoice) => {
      if (!invoice.issueDate) return;

      const date = new Date(invoice.issueDate);

      if (Number.isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthLabel = date.toLocaleString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        }
      );

      if (!monthlyRevenueMap[monthKey]) {
        monthlyRevenueMap[monthKey] = {
          month: monthLabel,
          revenue: 0,
          collected: 0,
          outstanding: 0,
          invoiceCount: 0,
        };
      }

      monthlyRevenueMap[monthKey].revenue +=
        getTotal(invoice);

      monthlyRevenueMap[monthKey].collected +=
        getPaidAmount(invoice);

      monthlyRevenueMap[monthKey].outstanding +=
        getOutstandingAmount(invoice);

      monthlyRevenueMap[monthKey].invoiceCount += 1;
    });

    const revenueAnalytics = Object.entries(
      monthlyRevenueMap
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    // =====================================
    // PAYMENT COLLECTION ANALYTICS
    // Uses actual payment history when available
    // =====================================

    const monthlyPaymentMap = {};

    invoices.forEach((invoice) => {
      if (
        !Array.isArray(invoice.payments) ||
        invoice.payments.length === 0
      ) {
        return;
      }

      invoice.payments.forEach((payment) => {
        const paymentAmount = Number(
          payment.amount || 0
        );

        if (paymentAmount <= 0) return;

        const paymentDate =
          payment.paymentDate || payment.createdAt;

        if (!paymentDate) return;

        const date = new Date(paymentDate);

        if (Number.isNaN(date.getTime())) return;

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        const monthLabel = date.toLocaleString(
          "en-US",
          {
            month: "short",
            year: "numeric",
          }
        );

        if (!monthlyPaymentMap[monthKey]) {
          monthlyPaymentMap[monthKey] = {
            month: monthLabel,
            collected: 0,
            paymentCount: 0,
          };
        }

        monthlyPaymentMap[monthKey].collected +=
          paymentAmount;

        monthlyPaymentMap[monthKey].paymentCount += 1;
      });
    });

    const paymentAnalytics = Object.entries(
      monthlyPaymentMap
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    // =====================================
    // MONTHLY REVENUE GROWTH
    // =====================================

    let revenueGrowth = 0;

    if (revenueAnalytics.length >= 2) {
      const previousMonth =
        revenueAnalytics[
          revenueAnalytics.length - 2
        ].revenue;

      const currentMonth =
        revenueAnalytics[
          revenueAnalytics.length - 1
        ].revenue;

      if (previousMonth > 0) {
        revenueGrowth = Math.round(
          ((currentMonth - previousMonth) /
            previousMonth) *
            100
        );
      }
    }

    // =====================================
    // COLLECTION GROWTH
    // =====================================

    let collectionGrowth = 0;

    if (paymentAnalytics.length >= 2) {
      const previousMonth =
        paymentAnalytics[
          paymentAnalytics.length - 2
        ].collected;

      const currentMonth =
        paymentAnalytics[
          paymentAnalytics.length - 1
        ].collected;

      if (previousMonth > 0) {
        collectionGrowth = Math.round(
          ((currentMonth - previousMonth) /
            previousMonth) *
            100
        );
      }
    }

    // =====================================
    // TOP CLIENT ANALYSIS
    // Based on collected revenue
    // =====================================

    const clientRevenueMap = {};

    invoices.forEach((invoice) => {
      const clientName =
        invoice.clientName?.trim() ||
        "Unknown Client";

      const collected = getPaidAmount(invoice);

      if (!clientRevenueMap[clientName]) {
        clientRevenueMap[clientName] = {
          clientName,
          revenue: 0,
          billedAmount: 0,
          outstandingAmount: 0,
          invoiceCount: 0,
        };
      }

      clientRevenueMap[clientName].revenue +=
        collected;

      clientRevenueMap[clientName].billedAmount +=
        getTotal(invoice);

      clientRevenueMap[clientName].outstandingAmount +=
        getOutstandingAmount(invoice);

      clientRevenueMap[clientName].invoiceCount += 1;
    });

    const topClients = Object.values(
      clientRevenueMap
    )
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topClient =
      topClients.length > 0
        ? topClients[0]
        : null;

    // =====================================
    // SMART BUSINESS INSIGHTS
    // =====================================

    const aiInsights = [];

    // No invoices
    if (totalInvoices === 0) {
      aiInsights.push({
        type: "info",
        title: "Start Creating Invoices",
        message:
          "You haven't created any invoices yet. Create your first invoice to start tracking your business finances.",
      });
    }

    // Revenue collected
    if (totalCollected > 0) {
      aiInsights.push({
        type: "success",
        title: "Revenue Collected",
        message: `You have collected ₹${totalCollected.toLocaleString(
          "en-IN"
        )} across your invoices.`,
      });
    }

    // Collection rate
    if (totalRevenue > 0) {
      let collectionMessage = "";

      if (collectionRate >= 80) {
        collectionMessage =
          "Most of your billed revenue has already been collected.";
      } else if (collectionRate >= 50) {
        collectionMessage =
          "A significant portion of your billed revenue has been collected.";
      } else {
        collectionMessage =
          "A large portion of your billed revenue is still outstanding.";
      }

      aiInsights.push({
        type:
          collectionRate >= 80
            ? "success"
            : collectionRate >= 50
            ? "info"
            : "warning",
        title: "Collection Rate",
        message: `Your current collection rate is ${collectionRate}%. ${collectionMessage}`,
      });
    }

    // Average invoice
    if (totalInvoices > 0) {
      aiInsights.push({
        type: "info",
        title: "Average Invoice Value",
        message: `Your average invoice value is ₹${averageInvoiceValue.toLocaleString(
          "en-IN"
        )}.`,
      });
    }

    // Outstanding
    if (totalOutstanding > 0) {
      aiInsights.push({
        type: "warning",
        title: "Outstanding Payments",
        message: `₹${totalOutstanding.toLocaleString(
          "en-IN"
        )} is still outstanding across your invoices.`,
      });
    }

    // Partially paid
    if (partiallyPaidInvoices.length > 0) {
      aiInsights.push({
        type: "warning",
        title: "Partial Payments",
        message: `${partiallyPaidInvoices.length} invoice(s) have received partial payments, with ₹${partiallyPaidAmount.toLocaleString(
          "en-IN"
        )} still outstanding.`,
      });
    }

    // Overdue
    if (overdueInvoices.length > 0) {
      aiInsights.push({
        type: "danger",
        title: "Overdue Payment Alert",
        message: `${overdueInvoices.length} overdue invoice(s) have ₹${overdueAmount.toLocaleString(
          "en-IN"
        )} still outstanding.`,
      });
    }

    // Overdue risk
    if (overdueRiskRate >= 30) {
      aiInsights.push({
        type: "danger",
        title: "High Payment Risk",
        message: `${overdueRiskRate}% of your invoices are currently overdue. Consider following up with clients.`,
      });
    } else if (
      overdueRiskRate > 0 &&
      overdueRiskRate < 30
    ) {
      aiInsights.push({
        type: "warning",
        title: "Payment Risk Detected",
        message: `${overdueRiskRate}% of your invoices are currently overdue.`,
      });
    }

    // Draft invoices
    if (draftInvoices.length > 0) {
      aiInsights.push({
        type: "info",
        title: "Draft Invoices",
        message: `You have ${draftInvoices.length} invoice(s) saved as draft. Review and send them when ready.`,
      });
    }

    // Payment success rate
    if (
      totalInvoices > 0 &&
      paidInvoices.length > 0
    ) {
      aiInsights.push({
        type:
          paymentSuccessRate >= 80
            ? "success"
            : paymentSuccessRate >= 50
            ? "info"
            : "warning",
        title: "Payment Success Rate",
        message: `${paymentSuccessRate}% of your invoices are fully paid.`,
      });
    }

    // Revenue growth
    if (revenueAnalytics.length >= 2) {
      if (revenueGrowth > 0) {
        aiInsights.push({
          type: "success",
          title: "Revenue Growth",
          message: `Your latest recorded monthly billed revenue increased by ${revenueGrowth}% compared with the previous month.`,
        });
      } else if (revenueGrowth < 0) {
        aiInsights.push({
          type: "warning",
          title: "Revenue Decline",
          message: `Your latest recorded monthly billed revenue decreased by ${Math.abs(
            revenueGrowth
          )}% compared with the previous month.`,
        });
      } else {
        aiInsights.push({
          type: "info",
          title: "Stable Revenue",
          message:
            "Your latest recorded monthly billed revenue is unchanged compared with the previous month.",
        });
      }
    }

    // Top client
    if (topClient) {
      aiInsights.push({
        type: "success",
        title: "Top Client",
        message: `${topClient.clientName} has contributed ₹${topClient.revenue.toLocaleString(
          "en-IN"
        )} in collected revenue across ${topClient.invoiceCount} invoice(s).`,
      });
    }

    // Fallback
    if (
      aiInsights.length === 0 &&
      totalInvoices > 0
    ) {
      aiInsights.push({
        type: "info",
        title: "Business Overview",
        message:
          "Your invoice data is being tracked successfully. Continue managing invoices to unlock more business insights.",
      });
    }

    // =====================================
    // RESPONSE
    // =====================================

    return res.status(200).json({
      success: true,

      analytics: {
        // =================================
        // BASIC
        // =================================

        totalInvoices,

        // Total amount billed
        totalRevenue,

        // Backward-compatible name
        paidRevenue,

        // Actual money collected
        totalCollected,

        // Total amount still due
        totalOutstanding,

        // Sent + partially paid + overdue
        pendingAmount,

        // Overdue outstanding amount
        overdueAmount,

        // Partially paid outstanding amount
        partiallyPaidAmount,

        // =================================
        // COUNTS
        // =================================

        draftInvoiceCount:
          draftInvoices.length,

        sentInvoiceCount:
          sentInvoices.length,

        partiallyPaidInvoiceCount:
          partiallyPaidInvoices.length,

        paidInvoiceCount:
          paidInvoices.length,

        overdueInvoiceCount:
          overdueInvoices.length,

        // =================================
        // STATUS
        // =================================

        statusOverview,

        // =================================
        // RECENT INVOICES
        // =================================

        recentInvoices,

        // =================================
        // REVENUE ANALYTICS
        // =================================

        revenueAnalytics,
        revenueGrowth,

        // =================================
        // PAYMENT ANALYTICS
        // =================================

        paymentAnalytics,
        collectionGrowth,

        // =================================
        // SMART METRICS
        // =================================

        averageInvoiceValue,
        averagePaidInvoiceValue,
        paymentSuccessRate,
        collectionRate,
        overdueRiskRate,

        // =================================
        // CLIENT ANALYTICS
        // =================================

        topClients,
        topClient,

        // =================================
        // AI INSIGHTS
        // =================================

        aiInsights,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard analytics",
    });
  }
};

module.exports = {
  getDashboardAnalytics,
};