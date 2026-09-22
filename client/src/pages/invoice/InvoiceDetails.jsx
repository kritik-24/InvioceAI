


import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  ArrowLeft,
  Download,
  Pencil,
  Trash2,
  RefreshCw,
  ReceiptText,
  User,
  Mail,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Package,
  CreditCard,
  Plus,
  X,
  IndianRupee,
  Clock3,
  WalletCards,
  History,
} from "lucide-react";

import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // INVOICE STATE
  // ==========================================

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // DELETE STATE
  // ==========================================

  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ==========================================
  // STATUS STATE
  // ==========================================

  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusMessageType, setStatusMessageType] = useState("");

  // ==========================================
  // PAYMENT MODAL STATE
  // ==========================================

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    paymentReference: "",
    paymentNotes: "",
  });

  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  // ==========================================
  // FETCH INVOICE
  // ==========================================

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/invoices/${id}`);

      const fetchedInvoice = response.data.invoice;

      setInvoice(fetchedInvoice);
      setSelectedStatus(fetchedInvoice.status);
    } catch (error) {
      console.error("Fetch Invoice Error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to fetch invoice details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  // ==========================================
  // PAYMENT CALCULATIONS
  // ==========================================

  const totalAmount = Number(invoice?.total || 0);

  const paidAmount = Number(invoice?.paidAmount || 0);

  const remainingAmount = Math.max(
    totalAmount - paidAmount,
    0
  );

  const paymentPercentage =
    totalAmount > 0
      ? Math.min((paidAmount / totalAmount) * 100, 100)
      : 0;

  const payments = useMemo(() => {
    if (!Array.isArray(invoice?.payments)) {
      return [];
    }

    return [...invoice.payments].sort(
      (a, b) =>
        new Date(b.paymentDate || b.createdAt) -
        new Date(a.paymentDate || a.createdAt)
    );
  }, [invoice]);

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusUpdate = async () => {
    try {
      setUpdatingStatus(true);
      setStatusMessage("");
      setStatusMessageType("");

      const response = await api.patch(
        `/invoices/${id}/status`,
        {
          status: selectedStatus,
        }
      );

      setInvoice(response.data.invoice);

      setStatusMessage(
        "Invoice status updated successfully."
      );

      setStatusMessageType("success");

      setTimeout(() => {
        setStatusMessage("");
        setStatusMessageType("");
      }, 3000);
    } catch (error) {
      console.error("Update Status Error:", error);

      setStatusMessage(
        error.response?.data?.message ||
          "Failed to update invoice status."
      );

      setStatusMessageType("error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==========================================
  // DELETE INVOICE
  // ==========================================

  const handleDeleteInvoice = async () => {
    try {
      setDeleting(true);

      await api.delete(`/invoices/${id}`);

      navigate("/invoices");
    } catch (error) {
      console.error("Delete Invoice Error:", error);

      setStatusMessage(
        error.response?.data?.message ||
          "Failed to delete invoice."
      );

      setStatusMessageType("error");

      setShowDeleteModal(false);
      setDeleting(false);
    }
  };

  // ==========================================
  // PAYMENT FORM HANDLERS
  // ==========================================

  const handlePaymentInputChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPaymentError("");
    setPaymentSuccess("");
  };

  // ==========================================
  // OPEN PAYMENT MODAL
  // ==========================================

  const openPaymentModal = () => {
    setPaymentError("");
    setPaymentSuccess("");

    setPaymentForm({
      amount:
        remainingAmount > 0
          ? remainingAmount.toFixed(2)
          : "",
      paymentDate: new Date()
        .toISOString()
        .split("T")[0],
      paymentMethod: "",
      paymentReference: "",
      paymentNotes: "",
    });

    setShowPaymentModal(true);
  };

  // ==========================================
  // CLOSE PAYMENT MODAL
  // ==========================================

  const closePaymentModal = () => {
    if (recordingPayment) {
      return;
    }

    setShowPaymentModal(false);
    setPaymentError("");
    setPaymentSuccess("");
  };

  // ==========================================
  // RECORD PAYMENT
  // ==========================================

  const handleRecordPayment = async (event) => {
    event.preventDefault();

    setPaymentError("");
    setPaymentSuccess("");

    const amount = Number(paymentForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError(
        "Please enter a valid payment amount."
      );
      return;
    }

    if (amount > remainingAmount) {
      setPaymentError(
        `Payment cannot exceed the outstanding balance of ${formatCurrency(
          remainingAmount
        )}.`
      );
      return;
    }

    if (!paymentForm.paymentDate) {
      setPaymentError("Please select a payment date.");
      return;
    }

    try {
      setRecordingPayment(true);

      const response = await api.post(
        `/invoices/${id}/payments`,
        {
          amount,
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          paymentReference:
            paymentForm.paymentReference.trim(),
          paymentNotes:
            paymentForm.paymentNotes.trim(),
        }
      );

      setInvoice(response.data.invoice);

      setSelectedStatus(
        response.data.invoice.status
      );

      setPaymentSuccess(
        response.data.message ||
          "Payment recorded successfully."
      );

      setPaymentForm({
        amount: "",
        paymentDate: new Date()
          .toISOString()
          .split("T")[0],
        paymentMethod: "",
        paymentReference: "",
        paymentNotes: "",
      });

      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess("");
        setPaymentError("");
      }, 1200);
    } catch (error) {
      console.error("Record Payment Error:", error);

      setPaymentError(
        error.response?.data?.message ||
          "Failed to record payment."
      );
    } finally {
      setRecordingPayment(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ==========================================
  // STATUS STYLES
  // ==========================================

  const statusStyles = {
    Paid:
      "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",

    Sent:
      "border border-blue-500/20 bg-blue-500/10 text-blue-300",

    Draft:
      "border border-slate-500/20 bg-slate-500/10 text-slate-300",

    Overdue:
      "border border-red-500/20 bg-red-500/10 text-red-300",

    "Partially Paid":
      "border border-amber-500/20 bg-amber-500/10 text-amber-300",
  };

  // ==========================================
  // PAYMENT METHOD LABEL
  // ==========================================

  const getPaymentMethodLabel = (method) => {
    if (!method) {
      return "Not specified";
    }

    return method;
  };

  // ==========================================
  // GENERATE PROFESSIONAL BRANDED PDF
  // ==========================================

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      // Fetch the latest business profile so PDF branding always
      // reflects the saved profile data.
      const profileResponse = await api.get("/auth/profile");
      const businessProfile = profileResponse.data?.user || {};

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const primaryColor = [124, 58, 237];
      const darkColor = [15, 23, 42];
      const grayColor = [100, 116, 139];
      const lightGrayColor = [241, 245, 249];
      const greenColor = [16, 185, 129];
      const amberColor = [245, 158, 11];
      const redColor = [239, 68, 68];

      const currencyCode = businessProfile.currency || "INR";

      const currencyMap = {
        INR: "Rs.",
        USD: "$",
        EUR: "€",
        GBP: "£",
        AED: "AED",
      };

      const currencySymbol = currencyMap[currencyCode] || currencyCode;

      const formatPdfCurrency = (amount) => {
        const numericAmount = Number(amount || 0);

        return `${currencySymbol} ${numericAmount.toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`;
      };

      const safeText = (value, fallback = "-") => {
        if (value === null || value === undefined) {
          return fallback;
        }

        const text = String(value).trim();
        return text || fallback;
      };

      const addWrappedText = (
        text,
        x,
        y,
        maxWidth,
        lineHeight = 5
      ) => {
        const lines = doc.splitTextToSize(
          safeText(text),
          maxWidth
        );

        doc.text(lines, x, y);

        return y + lines.length * lineHeight;
      };

      const loadImageAsDataUrl = async (url) => {
        if (!url) return null;

        try {
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(
              `Logo request failed with status ${response.status}`
            );
          }

          const blob = await response.blob();

          return await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (logoError) {
          console.warn(
            "Unable to load business logo into PDF:",
            logoError
          );

          return null;
        }
      };

      const getImageFormat = (dataUrl) => {
        if (!dataUrl || typeof dataUrl !== "string") {
          return "PNG";
        }

        if (dataUrl.startsWith("data:image/jpeg")) {
          return "JPEG";
        }

        if (dataUrl.startsWith("data:image/webp")) {
          return "WEBP";
        }

        return "PNG";
      };

      const businessName = safeText(
        businessProfile.businessName ||
          businessProfile.name ||
          "Your Business"
      );

      const businessEmail = safeText(
        businessProfile.email,
        ""
      );

      const businessPhone = safeText(
        businessProfile.phone,
        ""
      );

      const businessWebsite = safeText(
        businessProfile.website,
        ""
      );

      const businessAddress = safeText(
        businessProfile.address,
        ""
      );

      const businessGst = safeText(
        businessProfile.gstNumber,
        ""
      );

      const businessPan = safeText(
        businessProfile.panNumber,
        ""
      );

      const logoDataUrl = await loadImageAsDataUrl(
        businessProfile.logoUrl
      );

      // =====================================
      // PAGE BACKGROUND / BRAND HEADER
      // =====================================

      doc.setFillColor(...lightGrayColor);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 43, "F");

      // =====================================
      // BUSINESS LOGO
      // =====================================

      let businessTextX = 14;

      if (logoDataUrl) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(14, 8, 27, 27, 3, 3, "F");

          doc.addImage(
            logoDataUrl,
            getImageFormat(logoDataUrl),
            17,
            11,
            21,
            21
          );

          businessTextX = 47;
        } catch (logoError) {
          console.warn(
            "Unable to add business logo to PDF:",
            logoError
          );
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.text(businessName, businessTextX, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      const businessContactParts = [
        businessPhone,
        businessEmail,
        businessWebsite,
      ].filter(Boolean);

      if (businessContactParts.length > 0) {
        const contactText = businessContactParts.join(" • ");

        const contactLines = doc.splitTextToSize(
          contactText,
          115
        );

        doc.text(contactLines, businessTextX, 28);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("INVOICE", pageWidth - 14, 19, {
        align: "right",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(
        safeText(invoice.invoiceNumber),
        pageWidth - 14,
        28,
        { align: "right" }
      );

      // =====================================
      // BUSINESS LEGAL / ADDRESS BLOCK
      // =====================================

      let currentY = 54;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(
        14,
        currentY,
        pageWidth - 28,
        34,
        3,
        3,
        "F"
      );

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("FROM", 20, currentY + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...grayColor);

      let fromY = currentY + 15;

      if (businessAddress) {
        fromY = addWrappedText(
          businessAddress,
          20,
          fromY,
          72,
          4.5
        );
      }

      const legalParts = [
        businessGst ? `GSTIN: ${businessGst}` : "",
        businessPan ? `PAN: ${businessPan}` : "",
        `Currency: ${currencyCode}`,
      ].filter(Boolean);

      if (legalParts.length > 0) {
        doc.text(
          legalParts.join("  •  "),
          20,
          currentY + 29
        );
      }

      // =====================================
      // INVOICE META
      // =====================================

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      const metaX = 112;
      const metaValueX = pageWidth - 20;

      doc.text("Invoice Number", metaX, currentY + 9);
      doc.text(
        safeText(invoice.invoiceNumber),
        metaValueX,
        currentY + 9,
        { align: "right" }
      );

      doc.text("Issue Date", metaX, currentY + 17);
      doc.text(
        formatDate(invoice.issueDate),
        metaValueX,
        currentY + 17,
        { align: "right" }
      );

      doc.text("Due Date", metaX, currentY + 25);
      doc.text(
        formatDate(invoice.dueDate),
        metaValueX,
        currentY + 25,
        { align: "right" }
      );

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text("Status", metaX, currentY + 32);

      const statusColor =
        invoice.status === "Paid"
          ? greenColor
          : invoice.status === "Overdue"
          ? redColor
          : invoice.status === "Partially Paid"
          ? amberColor
          : primaryColor;

      doc.setTextColor(...statusColor);
      doc.setFont("helvetica", "bold");
      doc.text(
        safeText(invoice.status),
        metaValueX,
        currentY + 32,
        { align: "right" }
      );

      currentY += 44;

      // =====================================
      // BILL TO
      // =====================================

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(
        14,
        currentY,
        pageWidth - 28,
        42,
        3,
        3,
        "F"
      );

      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("BILL TO", 20, currentY + 9);

      doc.setTextColor(...darkColor);
      doc.setFontSize(12);
      doc.text(
        safeText(invoice.clientName),
        20,
        currentY + 18
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...grayColor);

      let clientY = currentY + 25;

      if (invoice.clientEmail) {
        doc.text(invoice.clientEmail, 20, clientY);
        clientY += 5;
      }

      if (invoice.clientAddress) {
        addWrappedText(
          invoice.clientAddress,
          20,
          clientY,
          165,
          4.5
        );
      }

      currentY += 51;

      // =====================================
      // ITEMS TABLE
      // =====================================

      const tableData = invoice.items.map((item) => [
        safeText(item.description),
        safeText(item.quantity),
        formatPdfCurrency(item.rate),
        formatPdfCurrency(item.amount),
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: {
          left: 14,
          right: 14,
        },
        head: [
          [
            "Description",
            "Quantity",
            "Rate",
            "Amount",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: {
          textColor: darkColor,
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: {
            cellWidth: "auto",
          },
          1: {
            halign: "center",
            cellWidth: 25,
          },
          2: {
            halign: "right",
            cellWidth: 38,
          },
          3: {
            halign: "right",
            cellWidth: 40,
          },
        },
      });

      currentY =
        (doc.lastAutoTable?.finalY || currentY + 20) + 10;

      // =====================================
      // SUMMARY
      // =====================================

      const summaryWidth = 78;
      const summaryX = pageWidth - 14 - summaryWidth;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(
        summaryX,
        currentY,
        summaryWidth,
        58,
        3,
        3,
        "F"
      );

      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text("Subtotal", summaryX + 7, currentY + 10);
      doc.text(
        formatPdfCurrency(invoice.subtotal),
        pageWidth - 20,
        currentY + 10,
        { align: "right" }
      );

      doc.text("Tax", summaryX + 7, currentY + 18);
      doc.text(
        formatPdfCurrency(invoice.tax),
        pageWidth - 20,
        currentY + 18,
        { align: "right" }
      );

      doc.setDrawColor(226, 232, 240);
      doc.line(
        summaryX + 7,
        currentY + 23,
        pageWidth - 20,
        currentY + 23
      );

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);

      doc.text(
        "Total",
        summaryX + 7,
        currentY + 32
      );

      doc.text(
        formatPdfCurrency(invoice.total),
        pageWidth - 20,
        currentY + 32,
        { align: "right" }
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...greenColor);

      doc.text(
        "Paid",
        summaryX + 7,
        currentY + 41
      );

      doc.text(
        formatPdfCurrency(invoice.paidAmount),
        pageWidth - 20,
        currentY + 41,
        { align: "right" }
      );

      doc.setTextColor(
        ...(remainingAmount > 0 ? amberColor : greenColor)
      );

      doc.text(
        "Outstanding",
        summaryX + 7,
        currentY + 50
      );

      doc.text(
        formatPdfCurrency(remainingAmount),
        pageWidth - 20,
        currentY + 50,
        { align: "right" }
      );

      // =====================================
      // PAYMENT HISTORY
      // =====================================

      currentY += 69;

      const pdfPayments = Array.isArray(invoice.payments)
        ? [...invoice.payments].sort(
            (a, b) =>
              new Date(
                b.paymentDate || b.createdAt
              ) -
              new Date(
                a.paymentDate || a.createdAt
              )
          )
        : [];

      if (pdfPayments.length > 0) {
        doc.setTextColor(...darkColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Payment History", 14, currentY);

        const paymentTableData = pdfPayments.map(
          (payment) => [
            formatDate(
              payment.paymentDate || payment.createdAt
            ),
            formatPdfCurrency(payment.amount),
            safeText(payment.paymentMethod),
            safeText(payment.paymentReference),
          ]
        );

        autoTable(doc, {
          startY: currentY + 6,
          margin: {
            left: 14,
            right: 14,
          },
          head: [
            [
              "Date",
              "Amount",
              "Method",
              "Reference",
            ],
          ],
          body: paymentTableData,
          theme: "grid",
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: "bold",
            fontSize: 8.5,
          },
          bodyStyles: {
            textColor: darkColor,
            fontSize: 8.5,
          },
          styles: {
            cellPadding: 3,
            lineColor: [226, 232, 240],
            lineWidth: 0.2,
          },
          columnStyles: {
            1: {
              halign: "right",
            },
          },
        });

        currentY =
          (doc.lastAutoTable?.finalY || currentY + 25) +
          10;
      }

      // =====================================
      // NOTES
      // =====================================

      if (invoice.notes) {
        const notesHeight = Math.min(
          38,
          Math.max(
            20,
            doc.splitTextToSize(
              invoice.notes,
              pageWidth - 40
            ).length * 4.5 +
              12
          )
        );

        if (currentY + notesHeight > pageHeight - 35) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(
          14,
          currentY,
          pageWidth - 28,
          notesHeight,
          3,
          3,
          "F"
        );

        doc.setTextColor(...darkColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Notes", 20, currentY + 9);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...grayColor);

        const noteLines = doc.splitTextToSize(
          invoice.notes,
          pageWidth - 40
        );

        doc.text(noteLines, 20, currentY + 17);
      }

      // =====================================
      // FOOTER ON ALL PAGES
      // =====================================

      const pageCount = doc.internal.getNumberOfPages();

      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber);

        doc.setDrawColor(226, 232, 240);
        doc.line(
          14,
          pageHeight - 19,
          pageWidth - 14,
          pageHeight - 19
        );

        doc.setTextColor(...grayColor);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);

        const footerParts = [
          businessName,
          businessWebsite,
          businessEmail,
        ].filter(Boolean);

        const footerText =
          footerParts.length > 0
            ? footerParts.join(" • ")
            : "Generated by InvoiceAI";

        doc.text(
          footerText,
          14,
          pageHeight - 11
        );

        doc.text(
          `Page ${pageNumber} of ${pageCount}`,
          pageWidth - 14,
          pageHeight - 11,
          { align: "right" }
        );
      }

      doc.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error(
        "Generate Branded PDF Error:",
        error
      );

      setStatusMessage(
        error.response?.data?.message ||
          "Failed to generate the invoice PDF."
      );

      setStatusMessageType("error");

      setTimeout(() => {
        setStatusMessage("");
        setStatusMessageType("");
      }, 4000);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] px-10 py-8 text-center shadow-xl shadow-black/20">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-violet-400"
          />

          <p className="mt-4 text-sm font-medium text-slate-300">
            Loading invoice details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle
            size={30}
            className="text-red-400"
          />
        </div>

        <h2 className="mt-5 text-xl font-bold text-white">
          Something went wrong
        </h2>

        <p className="mt-2 text-sm text-red-300">
          {error}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={fetchInvoice}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <RefreshCw size={17} />
            Try Again
          </button>

          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500"
          >
            <ArrowLeft size={17} />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <>
      <div className="space-y-8">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#15102b] via-[#111a2e] to-[#1d1238] shadow-2xl shadow-black/20">
          <div className="p-6 md:p-8">

            <Link
              to="/invoices"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
            >
              <ArrowLeft size={17} />
              Back to Invoices
            </Link>

            <div className="mt-7 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <div className="flex flex-wrap items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                    <ReceiptText
                      size={26}
                      className="text-white"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">

                      <h1 className="text-3xl font-bold tracking-tight text-white">
                        {invoice.invoiceNumber}
                      </h1>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[invoice.status] ||
                          "border border-slate-500/20 bg-slate-500/10 text-slate-300"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      Complete invoice overview and payment information.
                    </p>
                  </div>

                </div>
              </div>

              {/* ACTION BUTTONS */}

              <div className="flex flex-wrap gap-3">

                {remainingAmount > 0 &&
                  invoice.status !== "Draft" && (
                    <button
                      type="button"
                      onClick={openPaymentModal}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition hover:from-emerald-500 hover:to-green-500"
                    >
                      <Plus size={17} />
                      Record Payment
                    </button>
                  )}

                <Link
                  to={`/invoices/${invoice._id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
                >
                  <Pencil size={17} />
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Download size={17} />
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteModal(true)
                  }
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={17} />
                  Delete
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            PAYMENT OVERVIEW
        ========================================== */}

        <div className="grid gap-5 md:grid-cols-3">

          {/* TOTAL */}

          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Invoice Total
                </p>

                <p className="mt-3 text-2xl font-bold text-white">
                  {formatCurrency(totalAmount)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                <IndianRupee
                  size={22}
                  className="text-violet-400"
                />
              </div>
            </div>
          </div>

          {/* PAID */}

          <div className="rounded-2xl border border-emerald-500/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Paid Amount
                </p>

                <p className="mt-3 text-2xl font-bold text-emerald-400">
                  {formatCurrency(paidAmount)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2
                  size={22}
                  className="text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* OUTSTANDING */}

          <div
            className={`rounded-2xl border ${
              remainingAmount > 0
                ? "border-amber-500/10"
                : "border-emerald-500/10"
            } bg-[#111a2e] p-6 shadow-xl shadow-black/10`}
          >
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Outstanding
                </p>

                <p
                  className={`mt-3 text-2xl font-bold ${
                    remainingAmount > 0
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {formatCurrency(remainingAmount)}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  remainingAmount > 0
                    ? "bg-amber-500/10"
                    : "bg-emerald-500/10"
                }`}
              >
                {remainingAmount > 0 ? (
                  <Clock3
                    size={22}
                    className="text-amber-400"
                  />
                ) : (
                  <CheckCircle2
                    size={22}
                    className="text-emerald-400"
                  />
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ==========================================
            PAYMENT PROGRESS
        ========================================== */}

        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-bold text-white">
                Payment Progress
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {paymentPercentage.toFixed(0)}% of the invoice has been paid.
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {formatCurrency(paidAmount)}
                <span className="font-normal text-slate-500">
                  {" "}
                  / {formatCurrency(totalAmount)}
                </span>
              </p>
            </div>

          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
              style={{
                width: `${paymentPercentage}%`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>₹0</span>

            <span>
              Outstanding:{" "}
              <span className="font-semibold text-slate-300">
                {formatCurrency(remainingAmount)}
              </span>
            </span>

            <span>{formatCurrency(totalAmount)}</span>
          </div>

        </div>

        {/* ==========================================
            STATUS MANAGEMENT
        ========================================== */}

        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-2">

                <CheckCircle2
                  size={19}
                  className="text-violet-400"
                />

                <h2 className="text-lg font-bold text-white">
                  Invoice Status
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-400">
                Update the current payment status of this invoice.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value)
                }
                className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              >
                <option value="Draft">
                  Draft
                </option>

                <option value="Sent">
                  Sent
                </option>

                <option value="Partially Paid">
                  Partially Paid
                </option>

                <option value="Paid">
                  Paid
                </option>

                <option value="Overdue">
                  Overdue
                </option>
              </select>

              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={
                  updatingStatus ||
                  selectedStatus === invoice.status
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingStatus && (
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />
                )}

                {updatingStatus
                  ? "Updating..."
                  : "Update Status"}
              </button>

            </div>
          </div>

          {statusMessage && (
            <div
              className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                statusMessageType === "error"
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {statusMessageType === "error" ? (
                <AlertCircle size={17} />
              ) : (
                <CheckCircle2 size={17} />
              )}

              {statusMessage}
            </div>
          )}

        </div>

        {/* ==========================================
            CLIENT + INVOICE INFO
        ========================================== */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* CLIENT INFORMATION */}

          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                <User
                  size={21}
                  className="text-violet-400"
                />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Client Information
                </h2>

                <p className="text-sm text-slate-400">
                  Customer billing details
                </p>
              </div>

            </div>

            <div className="mt-7 space-y-6">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Client Name
                </p>

                <p className="mt-2 text-base font-semibold text-white">
                  {invoice.clientName || "-"}
                </p>
              </div>

              {invoice.clientEmail && (
                <div className="flex gap-3">

                  <Mail
                    size={18}
                    className="mt-1 text-slate-500"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </p>

                    <p className="mt-2 break-all text-sm text-violet-300">
                      {invoice.clientEmail}
                    </p>
                  </div>

                </div>
              )}

              {invoice.clientAddress && (
                <div className="flex gap-3">

                  <MapPin
                    size={18}
                    className="mt-1 text-slate-500"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Address
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                      {invoice.clientAddress}
                    </p>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* INVOICE INFORMATION */}

          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                <FileText
                  size={21}
                  className="text-blue-400"
                />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Invoice Information
                </h2>

                <p className="text-sm text-slate-400">
                  Invoice dates and status
                </p>
              </div>

            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Invoice Number
                </p>

                <p className="mt-2 font-semibold text-white">
                  {invoice.invoiceNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </p>

                <div className="mt-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[invoice.status] ||
                      "border border-slate-500/20 bg-slate-500/10 text-slate-300"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Calendar
                    size={15}
                    className="text-slate-500"
                  />

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Issue Date
                  </p>
                </div>

                <p className="mt-2 font-medium text-slate-200">
                  {formatDate(invoice.issueDate)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Calendar
                    size={15}
                    className="text-slate-500"
                  />

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Due Date
                  </p>
                </div>

                <p className="mt-2 font-medium text-slate-200">
                  {formatDate(invoice.dueDate)}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* ==========================================
            INVOICE ITEMS
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111a2e] shadow-xl shadow-black/10">

          <div className="flex items-center gap-3 border-b border-white/10 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10">
              <Package
                size={21}
                className="text-purple-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Invoice Items
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Products and services included in this invoice.
              </p>
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left">

              <thead className="bg-[#0b1220]">
                <tr>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Quantity
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Rate
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Amount
                  </th>

                </tr>
              </thead>

              <tbody>

                {invoice.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-white/5 transition hover:bg-white/[0.03]"
                  >

                    <td className="px-6 py-5 text-sm font-semibold text-white">
                      {item.description}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-300">
                      {item.quantity}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-300">
                      {formatCurrency(item.rate)}
                    </td>

                    <td className="px-6 py-5 text-right text-sm font-bold text-white">
                      {formatCurrency(item.amount)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          </div>
        </div>

        {/* ==========================================
            PAYMENT HISTORY
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111a2e] shadow-xl shadow-black/10">

          <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <History
                  size={21}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Payment History
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  All payments recorded against this invoice.
                </p>
              </div>

            </div>

            {remainingAmount > 0 &&
              invoice.status !== "Draft" && (
                <button
                  type="button"
                  onClick={openPaymentModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  <Plus size={16} />
                  Add Payment
                </button>
              )}

          </div>

          {payments.length === 0 ? (
            <div className="p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                <WalletCards
                  size={25}
                  className="text-slate-500"
                />
              </div>

              <h3 className="mt-4 text-base font-semibold text-white">
                No payments recorded
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Once a payment is recorded, its amount, date, method and reference will appear here.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px] text-left">

                <thead className="bg-[#0b1220]">
                  <tr>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Date
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Method
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Reference
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Notes
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {payments.map((payment, index) => (
                    <tr
                      key={
                        payment._id ||
                        `${payment.paymentDate}-${index}`
                      }
                      className="border-t border-white/5 transition hover:bg-white/[0.03]"
                    >

                      <td className="px-6 py-5 text-sm font-medium text-slate-200">
                        {formatDate(
                          payment.paymentDate ||
                            payment.createdAt
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm font-bold text-emerald-400">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-6 py-5">

                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                          <CreditCard size={13} />
                          {getPaymentMethodLabel(
                            payment.paymentMethod
                          )}
                        </span>

                      </td>

                      <td className="max-w-[180px] truncate px-6 py-5 text-sm text-slate-300">
                        {payment.paymentReference || "-"}
                      </td>

                      <td className="max-w-[250px] px-6 py-5 text-sm text-slate-400">
                        {payment.paymentNotes || "-"}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>
            </div>
          )}

        </div>

        {/* ==========================================
            INVOICE SUMMARY
        ========================================== */}

        <div className="flex justify-end">

          <div className="w-full overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#17112d] to-[#111a2e] shadow-2xl shadow-black/20 sm:w-[420px]">

            <div className="border-b border-white/10 p-6">

              <h2 className="text-lg font-bold text-white">
                Invoice Summary
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Final invoice and payment breakdown
              </p>

            </div>

            <div className="space-y-5 p-6">

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-400">
                  Subtotal
                </span>

                <span className="font-semibold text-white">
                  {formatCurrency(invoice.subtotal)}
                </span>

              </div>

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-400">
                  Tax
                </span>

                <span className="font-semibold text-white">
                  {formatCurrency(invoice.tax)}
                </span>

              </div>

              <div className="border-t border-white/10 pt-5">

                <div className="flex items-center justify-between">

                  <span className="text-base font-bold text-white">
                    Total Amount
                  </span>

                  <span className="text-2xl font-bold text-violet-400">
                    {formatCurrency(invoice.total)}
                  </span>

                </div>

              </div>

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-400">
                  Paid Amount
                </span>

                <span className="font-bold text-emerald-400">
                  {formatCurrency(invoice.paidAmount)}
                </span>

              </div>

              <div className="flex items-center justify-between rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3">

                <span className="font-semibold text-slate-300">
                  Outstanding
                </span>

                <span
                  className={`font-bold ${
                    remainingAmount > 0
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {formatCurrency(remainingAmount)}
                </span>

              </div>

            </div>
          </div>

        </div>

        {/* ==========================================
            NOTES
        ========================================== */}

        {invoice.notes && (
          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">

            <h2 className="text-lg font-bold text-white">
              Notes
            </h2>

            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
              {invoice.notes}
            </p>

          </div>
        )}

      </div>

      {/* ==========================================
          RECORD PAYMENT MODAL
      ========================================== */}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111a2e] shadow-2xl shadow-black/40">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111a2e] px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CreditCard
                    size={21}
                    className="text-emerald-400"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">
                    Record Payment
                  </h2>

                  <p className="text-sm text-slate-400">
                    Invoice {invoice.invoiceNumber}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={recordingPayment}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleRecordPayment}
              className="space-y-6 p-6"
            >

              {/* BALANCE INFO */}

              <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice Total
                  </p>

                  <p className="mt-2 text-lg font-bold text-white">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Already Paid
                  </p>

                  <p className="mt-2 text-lg font-bold text-emerald-400">
                    {formatCurrency(paidAmount)}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Outstanding
                  </p>

                  <p className="mt-2 text-lg font-bold text-amber-400">
                    {formatCurrency(remainingAmount)}
                  </p>
                </div>

              </div>

              {/* PAYMENT AMOUNT */}

              <div>

                <label
                  htmlFor="paymentAmount"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Payment Amount
                  <span className="ml-1 text-red-400">
                    *
                  </span>
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ₹
                  </span>

                  <input
                    id="paymentAmount"
                    type="number"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentInputChange}
                    min="0.01"
                    max={remainingAmount}
                    step="0.01"
                    placeholder="Enter payment amount"
                    disabled={recordingPayment}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  />

                </div>

                <div className="mt-2 flex items-center justify-between text-xs">

                  <span className="text-slate-500">
                    Maximum payment:
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentForm((previous) => ({
                        ...previous,
                        amount:
                          remainingAmount.toFixed(2),
                      }))
                    }
                    disabled={
                      recordingPayment ||
                      remainingAmount <= 0
                    }
                    className="font-semibold text-emerald-400 transition hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {formatCurrency(remainingAmount)}
                  </button>

                </div>

              </div>

              {/* PAYMENT DATE + METHOD */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="paymentDate"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Payment Date
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <input
                    id="paymentDate"
                    type="date"
                    name="paymentDate"
                    value={paymentForm.paymentDate}
                    onChange={handlePaymentInputChange}
                    disabled={recordingPayment}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  />

                </div>

                <div>

                  <label
                    htmlFor="paymentMethod"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Payment Method
                  </label>

                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentInputChange}
                    disabled={recordingPayment}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      Select method
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Credit Card">
                      Credit Card
                    </option>

                    <option value="Debit Card">
                      Debit Card
                    </option>

                    <option value="Cheque">
                      Cheque
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>

                </div>

              </div>

              {/* REFERENCE */}

              <div>

                <label
                  htmlFor="paymentReference"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Payment Reference
                </label>

                <input
                  id="paymentReference"
                  type="text"
                  name="paymentReference"
                  value={paymentForm.paymentReference}
                  onChange={handlePaymentInputChange}
                  disabled={recordingPayment}
                  placeholder="e.g. UTR number, transaction ID, cheque number"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              {/* NOTES */}

              <div>

                <label
                  htmlFor="paymentNotes"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Payment Notes
                </label>

                <textarea
                  id="paymentNotes"
                  name="paymentNotes"
                  value={paymentForm.paymentNotes}
                  onChange={handlePaymentInputChange}
                  disabled={recordingPayment}
                  rows={3}
                  placeholder="Add any additional payment information..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              {/* ERROR */}

              {paymentError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">

                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {paymentError}
                  </span>

                </div>
              )}

              {/* SUCCESS */}

              {paymentSuccess && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">

                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {paymentSuccess}
                  </span>

                </div>
              )}

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={recordingPayment}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    recordingPayment ||
                    remainingAmount <= 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition hover:from-emerald-500 hover:to-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {recordingPayment ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Record Payment
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL
      ========================================== */}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
          }
        }}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice?"
        message={`Are you sure you want to delete invoice "${invoice.invoiceNumber}"? This action cannot be undone.`}
        confirmText="Delete Invoice"
        cancelText="Cancel"
        loading={deleting}
        variant="danger"
      />
    </>
  );
};

export default InvoiceDetails;