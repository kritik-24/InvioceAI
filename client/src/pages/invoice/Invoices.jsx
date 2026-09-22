
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  Search,
  Plus,
  FileText,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Filter,
  ReceiptText,
  IndianRupee,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FilePenLine,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  WalletCards,
} from "lucide-react";

import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ===============================
  // FETCH INVOICES
  // ===============================

  const fetchInvoices = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = {};

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (sortConfig.key) {
        params.sortBy = sortConfig.key;
        params.order = sortConfig.direction;
      }

      const response = await api.get("/invoices", {
        params,
      });

      setInvoices(response.data.invoices || []);

      if (showRefresh) {
        toast.success("Invoices refreshed successfully");
      }
    } catch (error) {
      console.error(
        "Fetch Invoices Error:",
        error.response?.data || error.message
      );

      const message =
        error.response?.data?.message ||
        "Failed to fetch invoices. Please try again.";

      setError(message);

      if (showRefresh) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ===============================
  // DELETE INVOICE
  // ===============================

  const openDeleteModal = (invoice) => {
    setInvoiceToDelete(invoice);
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setInvoiceToDelete(null);
    }
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      setDeleting(true);

      await api.delete(`/invoices/${invoiceToDelete._id}`);

      setInvoices((previousInvoices) =>
        previousInvoices.filter(
          (invoice) => invoice._id !== invoiceToDelete._id
        )
      );

      toast.success(
        `Invoice ${invoiceToDelete.invoiceNumber} deleted successfully`
      );

      setInvoiceToDelete(null);
    } catch (error) {
      console.error(
        "Delete Invoice Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to delete invoice. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===============================
  // LOCAL SEARCH / FILTER
  // ===============================

  const filteredInvoices = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return invoices.filter((invoice) => {
      const invoiceClientName =
        invoice.client?.name || invoice.clientName || "";

      const invoiceClientEmail =
        invoice.client?.email || invoice.clientEmail || "";

      const invoiceClientCompany = invoice.client?.company || "";

      const matchesSearch =
        !searchText ||
        invoice.invoiceNumber?.toLowerCase().includes(searchText) ||
        invoiceClientName.toLowerCase().includes(searchText) ||
        invoiceClientEmail.toLowerCase().includes(searchText) ||
        invoiceClientCompany.toLowerCase().includes(searchText);

      const matchesStatus =
        !statusFilter || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  // ===============================
  // SORTING
  // ===============================

  const sortedInvoices = useMemo(() => {
    const invoicesCopy = [...filteredInvoices];

    invoicesCopy.sort((a, b) => {
      let aValue;
      let bValue;

      if (sortConfig.key === "clientName") {
        aValue = a.client?.name || a.clientName || "";
        bValue = b.client?.name || b.clientName || "";
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      if (
        sortConfig.key === "issueDate" ||
        sortConfig.key === "dueDate" ||
        sortConfig.key === "createdAt"
      ) {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (
        sortConfig.key === "total" ||
        sortConfig.key === "paidAmount"
      ) {
        aValue = Number(aValue || 0);
        bValue = Number(bValue || 0);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
      }

      if (typeof bValue === "string") {
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return invoicesCopy;
  }, [filteredInvoices, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((previousConfig) => {
      if (previousConfig.key === key) {
        return {
          key,
          direction:
            previousConfig.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });

    setCurrentPage(1);
  };

  // ===============================
  // PAGINATION
  // ===============================

  const totalPages = Math.max(
    1,
    Math.ceil(sortedInvoices.length / rowsPerPage)
  );

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;

    return sortedInvoices.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [sortedInvoices, currentPage, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startInvoice =
    sortedInvoices.length === 0
      ? 0
      : (currentPage - 1) * rowsPerPage + 1;

  const endInvoice = Math.min(
    currentPage * rowsPerPage,
    sortedInvoices.length
  );

  // ===============================
  // FINANCIAL HELPERS
  // ===============================

  const getPaidAmount = (invoice) => {
    return Math.min(
      Number(invoice.paidAmount || 0),
      Number(invoice.total || 0)
    );
  };

  const getOutstandingAmount = (invoice) => {
    const total = Number(invoice.total || 0);
    const paid = getPaidAmount(invoice);

    return Math.max(total - paid, 0);
  };

  // ===============================
  // STATISTICS
  // ===============================

  const statistics = useMemo(() => {
    const totalInvoices = invoices.length;

    const totalBilled = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );

    const totalCollected = invoices.reduce(
      (sum, invoice) => sum + getPaidAmount(invoice),
      0
    );

    const totalOutstanding = invoices.reduce(
      (sum, invoice) => sum + getOutstandingAmount(invoice),
      0
    );

    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "Paid"
    );

    const partiallyPaidInvoices = invoices.filter(
      (invoice) => invoice.status === "Partially Paid"
    );

    const sentInvoices = invoices.filter(
      (invoice) => invoice.status === "Sent"
    );

    const draftInvoices = invoices.filter(
      (invoice) => invoice.status === "Draft"
    );

    const overdueInvoices = invoices.filter(
      (invoice) => invoice.status === "Overdue"
    );

    return {
      totalInvoices,
      totalBilled,
      totalCollected,
      totalOutstanding,
      paidInvoices: paidInvoices.length,
      partiallyPaidInvoices: partiallyPaidInvoices.length,
      sentInvoices: sentInvoices.length,
      draftInvoices: draftInvoices.length,
      overdueInvoices: overdueInvoices.length,
    };
  }, [invoices]);

  // ===============================
  // STATUS STYLES
  // ===============================

  const statusStyles = {
    Paid: {
      className:
        "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      icon: CheckCircle2,
    },

    Sent: {
      className:
        "border border-blue-500/20 bg-blue-500/10 text-blue-300",
      icon: Clock3,
    },

    "Partially Paid": {
      className:
        "border border-amber-500/20 bg-amber-500/10 text-amber-300",
      icon: CircleDollarSign,
    },

    Draft: {
      className:
        "border border-slate-500/20 bg-slate-500/10 text-slate-300",
      icon: FilePenLine,
    },

    Overdue: {
      className:
        "border border-red-500/20 bg-red-500/10 text-red-300",
      icon: AlertCircle,
    },
  };

  // ===============================
  // FORMAT DATE
  // ===============================

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

  // ===============================
  // FORMAT CURRENCY
  // ===============================

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  // ===============================
  // CLEAR FILTERS
  // ===============================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search || statusFilter);

  // ===============================
  // STATUS FILTER CLICK
  // ===============================

  const applyStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // ===============================
  // SEARCH
  // ===============================

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ===============================
  // SORT ICON
  // ===============================

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return (
        <ChevronsUpDown
          size={14}
          className="text-slate-600"
        />
      );
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp
        size={14}
        className="text-violet-400"
      />
    ) : (
      <ChevronDown
        size={14}
        className="text-violet-400"
      />
    );
  };

  // ===============================
  // SORTABLE HEADER
  // ===============================

  const SortableHeader = ({
    label,
    column,
    className = "",
  }) => (
    <th
      className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="flex items-center gap-2 transition hover:text-violet-400"
      >
        {label}
        <SortIcon column={column} />
      </button>
    </th>
  );

  // ===============================
  // RENDER
  // ===============================

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* ================= PAGE HEADER ================= */}

      <div className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
            <ReceiptText
              size={24}
              className="text-white"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Invoices
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage, track and organize all your business invoices.
            </p>
          </div>

        </div>

        <div className="flex flex-col gap-3 sm:flex-row">

          <button
            type="button"
            onClick={() => fetchInvoices(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />

            Refresh
          </button>

          <Link
            to="/invoices/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-purple-500"
          >
            <Plus size={18} />
            Create Invoice
          </Link>

        </div>

      </div>

      {/* ================= FINANCIAL OVERVIEW ================= */}

      {!loading && !error && invoices.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <button
              type="button"
              onClick={() => applyStatusFilter("")}
              className="rounded-2xl border border-white/10 bg-[#0f172a] p-5 text-left shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-violet-500/40 hover:bg-[#121c32]"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-400">
                    Total Invoices
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-white">
                    {statistics.totalInvoices}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatCurrency(statistics.totalBilled)} billed
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                  <ReceiptText
                    size={21}
                    className="text-violet-400"
                  />
                </div>

              </div>
            </button>

            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-400">
                    Total Collected
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-emerald-400">
                    {formatCurrency(statistics.totalCollected)}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    From {statistics.paidInvoices} paid invoices
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                  <IndianRupee
                    size={21}
                    className="text-emerald-400"
                  />
                </div>

              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-400">
                    Outstanding
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-amber-400">
                    {formatCurrency(statistics.totalOutstanding)}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Amount yet to collect
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                  <WalletCards
                    size={21}
                    className="text-amber-400"
                  />
                </div>

              </div>
            </div>

            <button
              type="button"
              onClick={() => applyStatusFilter("Overdue")}
              className="rounded-2xl border border-white/10 bg-[#0f172a] p-5 text-left shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-red-500/40 hover:bg-[#121c32]"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-400">
                    Overdue Invoices
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-red-400">
                    {statistics.overdueInvoices}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatCurrency(
                      invoices
                        .filter(
                          (invoice) =>
                            invoice.status === "Overdue"
                        )
                        .reduce(
                          (sum, invoice) =>
                            sum + getOutstandingAmount(invoice),
                          0
                        )
                    )}{" "}
                    outstanding
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                  <AlertCircle
                    size={21}
                    className="text-red-400"
                  />
                </div>

              </div>
            </button>

          </div>

          {/* ================= STATUS SUMMARY ================= */}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            <button
              type="button"
              onClick={() => applyStatusFilter("Draft")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                statusFilter === "Draft"
                  ? "border-slate-400/40 bg-slate-500/10"
                  : "border-white/10 bg-[#0f172a] hover:border-slate-400/30"
              }`}
            >
              <p className="text-xs text-slate-500">
                Draft
              </p>
              <p className="mt-1 text-lg font-bold text-slate-200">
                {statistics.draftInvoices}
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyStatusFilter("Sent")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                statusFilter === "Sent"
                  ? "border-blue-400/40 bg-blue-500/10"
                  : "border-white/10 bg-[#0f172a] hover:border-blue-400/30"
              }`}
            >
              <p className="text-xs text-slate-500">
                Sent
              </p>
              <p className="mt-1 text-lg font-bold text-blue-300">
                {statistics.sentInvoices}
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyStatusFilter("Partially Paid")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                statusFilter === "Partially Paid"
                  ? "border-amber-400/40 bg-amber-500/10"
                  : "border-white/10 bg-[#0f172a] hover:border-amber-400/30"
              }`}
            >
              <p className="text-xs text-slate-500">
                Partially Paid
              </p>
              <p className="mt-1 text-lg font-bold text-amber-300">
                {statistics.partiallyPaidInvoices}
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyStatusFilter("Paid")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                statusFilter === "Paid"
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 bg-[#0f172a] hover:border-emerald-400/30"
              }`}
            >
              <p className="text-xs text-slate-500">
                Paid
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-300">
                {statistics.paidInvoices}
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyStatusFilter("Overdue")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                statusFilter === "Overdue"
                  ? "border-red-400/40 bg-red-500/10"
                  : "border-white/10 bg-[#0f172a] hover:border-red-400/30"
              }`}
            >
              <p className="text-xs text-slate-500">
                Overdue
              </p>
              <p className="mt-1 text-lg font-bold text-red-300">
                {statistics.overdueInvoices}
              </p>
            </button>

          </div>
        </>
      )}

      {/* ================= SEARCH & FILTERS ================= */}

      <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5 shadow-xl shadow-black/10">

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Filter
                size={19}
                className="text-violet-400"
              />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Search & Filters
              </h2>

              <p className="text-xs text-slate-500">
                Find and organize invoices quickly.
              </p>
            </div>

          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 self-start text-sm font-medium text-violet-400 transition hover:text-violet-300 sm:self-auto"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}

        </div>

        <div className="flex flex-col gap-4 md:flex-row">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              placeholder="Search by invoice number, client, email or company..."
              value={search}
              onChange={(e) =>
                handleSearchChange(e.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-[#111827] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              applyStatusFilter(e.target.value)
            }
            className="rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-sm font-medium text-slate-200 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Partially Paid">
              Partially Paid
            </option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>

        </div>

        {!loading && !error && invoices.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">

            <span>
              Showing{" "}
              <span className="font-semibold text-white">
                {filteredInvoices.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-white">
                {invoices.length}
              </span>{" "}
              loaded invoices
            </span>

            {statusFilter && (
              <span className="text-violet-400">
                Filter: {statusFilter}
              </span>
            )}

          </div>
        )}

      </div>

      {/* ================= LOADING ================= */}

      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0f172a] p-16 text-center">

          <RefreshCw
            size={30}
            className="animate-spin text-violet-400"
          />

          <h3 className="mt-5 font-semibold text-white">
            Loading invoices
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Please wait while we fetch your invoice data.
          </p>

        </div>
      )}

      {/* ================= ERROR ================= */}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">

          <AlertCircle
            size={30}
            className="mx-auto text-red-400"
          />

          <h3 className="mt-5 text-lg font-semibold text-white">
            Unable to load invoices
          </h3>

          <p className="mt-2 text-sm text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={() => fetchInvoices()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            <RefreshCw size={17} />
            Try Again
          </button>

        </div>
      )}

      {/* ================= EMPTY STATE ================= */}

      {!loading && !error && invoices.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-14 text-center shadow-xl shadow-black/10">

          <FileText
            size={35}
            className="mx-auto text-violet-400"
          />

          <h3 className="mt-6 text-xl font-semibold text-white">
            No invoices yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
            Create your first professional invoice and start
            managing your business finances efficiently.
          </p>

          <Link
            to="/invoices/create"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white"
          >
            <Plus size={18} />
            Create First Invoice
          </Link>

        </div>
      )}

      {/* ================= NO RESULTS ================= */}

      {!loading &&
        !error &&
        invoices.length > 0 &&
        filteredInvoices.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-14 text-center">

            <Search
              size={32}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-6 text-lg font-semibold text-white">
              No matching invoices found
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Try adjusting your search or status filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 font-semibold text-violet-400 transition hover:text-violet-300"
            >
              Clear all filters
            </button>

          </div>
        )}

      {/* ================= INVOICE TABLE ================= */}

      {!loading &&
        !error &&
        paginatedInvoices.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-xl shadow-black/10">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px] text-left">

                <thead className="border-b border-white/10 bg-[#111827]">

                  <tr>

                    <SortableHeader
                      label="Invoice"
                      column="invoiceNumber"
                    />

                    <SortableHeader
                      label="Client"
                      column="clientName"
                    />

                    <SortableHeader
                      label="Issue Date"
                      column="issueDate"
                    />

                    <SortableHeader
                      label="Due Date"
                      column="dueDate"
                    />

                    <SortableHeader
                      label="Amount"
                      column="total"
                    />

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Payment
                    </th>

                    <SortableHeader
                      label="Status"
                      column="status"
                    />

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedInvoices.map((invoice) => {
                    const status =
                      statusStyles[invoice.status] ||
                      statusStyles.Draft;

                    const StatusIcon = status.icon;

                    const total = Number(invoice.total || 0);
                    const paid = getPaidAmount(invoice);
                    const outstanding =
                      getOutstandingAmount(invoice);

                    const paymentPercentage =
                      total > 0
                        ? Math.min(
                            (paid / total) * 100,
                            100
                          )
                        : 0;

                    const clientName =
                      invoice.client?.name ||
                      invoice.clientName ||
                      "-";

                    const clientEmail =
                      invoice.client?.email ||
                      invoice.clientEmail ||
                      "";

                    return (
                      <tr
                        key={invoice._id}
                        className="border-b border-white/5 transition hover:bg-white/[0.025]"
                      >

                        {/* INVOICE */}

                        <td className="px-6 py-5">

                          <Link
                            to={`/invoices/${invoice._id}`}
                            className="font-semibold text-violet-300 transition hover:text-violet-200"
                          >
                            {invoice.invoiceNumber}
                          </Link>

                          <p className="mt-1 text-xs text-slate-600">
                            Created {formatDate(invoice.createdAt)}
                          </p>

                        </td>

                        {/* CLIENT */}

                        <td className="px-6 py-5">

                          <p className="text-sm font-medium text-slate-200">
                            {clientName}
                          </p>

                          {clientEmail && (
                            <p className="mt-1 text-xs text-slate-500">
                              {clientEmail}
                            </p>
                          )}

                        </td>

                        {/* ISSUE DATE */}

                        <td className="px-6 py-5 text-sm text-slate-400">
                          {formatDate(invoice.issueDate)}
                        </td>

                        {/* DUE DATE */}

                        <td className="px-6 py-5">

                          <p
                            className={`text-sm ${
                              invoice.status === "Overdue"
                                ? "font-semibold text-red-400"
                                : "text-slate-400"
                            }`}
                          >
                            {formatDate(invoice.dueDate)}
                          </p>

                          {invoice.status === "Overdue" && (
                            <p className="mt-1 text-xs text-red-500">
                              Payment overdue
                            </p>
                          )}

                        </td>

                        {/* AMOUNT */}

                        <td className="px-6 py-5">

                          <span className="font-semibold text-white">
                            {formatCurrency(total)}
                          </span>

                        </td>

                        {/* PAYMENT */}

                        <td className="px-6 py-5">

                          <div className="min-w-[150px]">

                            <div className="flex items-center justify-between gap-3 text-xs">

                              <span className="font-medium text-emerald-400">
                                {formatCurrency(paid)}
                              </span>

                              <span className="text-slate-500">
                                {Math.round(paymentPercentage)}%
                              </span>

                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">

                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${paymentPercentage}%`,
                                }}
                              />

                            </div>

                            <p className="mt-1.5 text-xs text-slate-500">
                              {outstanding > 0
                                ? `${formatCurrency(
                                    outstanding
                                  )} due`
                                : "Fully paid"}
                            </p>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <button
                            type="button"
                            onClick={() =>
                              applyStatusFilter(invoice.status)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition hover:scale-105 ${status.className}`}
                            title={`Filter ${invoice.status} invoices`}
                          >
                            <StatusIcon size={14} />
                            {invoice.status || "Draft"}
                          </button>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">

                          <div className="flex items-center justify-end gap-2">

                            <Link
                              to={`/invoices/${invoice._id}`}
                              title="View Invoice"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 transition hover:bg-blue-500/20"
                            >
                              <Eye size={16} />
                            </Link>

                            <Link
                              to={`/invoices/${invoice._id}/edit`}
                              title="Edit Invoice"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 transition hover:bg-amber-500/20"
                            >
                              <Pencil size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                openDeleteModal(invoice)
                              }
                              title="Delete Invoice"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

            {/* ================= PAGINATION ================= */}

            <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-3 text-sm text-slate-400">

                <span>
                  Showing {startInvoice}–{endInvoice} of{" "}
                  {sortedInvoices.length}
                </span>

                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>

              </div>

              <div className="flex items-center justify-between gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(page - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="text-sm font-medium text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(page + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ================= DELETE MODAL ================= */}

      <ConfirmModal
        isOpen={Boolean(invoiceToDelete)}
        title="Delete Invoice?"
        message={
          invoiceToDelete
            ? `Are you sure you want to permanently delete invoice ${invoiceToDelete.invoiceNumber}? This action cannot be undone.`
            : ""
        }
        confirmText={
          deleting ? "Deleting..." : "Delete Invoice"
        }
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={closeDeleteModal}
        loading={deleting}
      />

    </div>
  );
};

export default Invoices;