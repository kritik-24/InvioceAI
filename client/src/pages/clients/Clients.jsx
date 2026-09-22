
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Users,
  Mail,
  Phone,
  Building2,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Wallet,
  ReceiptText,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    client: null,
  });

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const fetchClients = useCallback(
    async (searchValue = "") => {
      try {
        setLoading(true);

        const response = await api.get("/clients", {
          params: searchValue
            ? { search: searchValue }
            : {},
        });

        setClients(response.data.clients || []);
      } catch (error) {
        console.error("Fetch Clients Error:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to fetch clients."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchClients(search);
  }, [fetchClients, search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const openDeleteModal = (client) => {
    setDeleteModal({
      isOpen: true,
      client,
    });
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteModal({
      isOpen: false,
      client: null,
    });
  };

  const handleDeleteClient = async () => {
    const client = deleteModal.client;

    if (!client) return;

    try {
      setDeleting(true);

      await api.delete(`/clients/${client._id}`);

      toast.success("Client deleted successfully.");

      closeDeleteModal();

      await fetchClients(search);
    } catch (error) {
      console.error("Delete Client Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to delete client."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* ==========================================
            PAGE HEADER
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#15102b] via-[#111a2e] to-[#1d1238] shadow-2xl shadow-black/20">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                    <Users
                      size={27}
                      className="text-white"
                    />
                  </div>

                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                      Clients
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                      Manage customers, invoice history, and
                      financial relationships.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/clients/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:from-violet-500 hover:to-purple-500"
              >
                <Plus size={18} />
                Add Client
              </Link>
            </div>
          </div>
        </div>

        {/* ==========================================
            SEARCH
        ========================================== */}

        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-5 shadow-xl shadow-black/10">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by name, email, company, or phone..."
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Search
            </button>

            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* ==========================================
            CLIENT COUNT
        ========================================== */}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {clients.length}{" "}
              {clients.length === 1
                ? "Client"
                : "Clients"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {search
                ? `Search results for "${search}"`
                : "All customers in your account"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchClients(search)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ==========================================
            LOADING
        ========================================== */}

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-[#111a2e] px-6 py-16 text-center shadow-xl shadow-black/10">
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-violet-400"
            />

            <p className="mt-4 text-sm font-medium text-slate-300">
              Loading clients...
            </p>
          </div>
        )}

        {/* ==========================================
            EMPTY STATE
        ========================================== */}

        {!loading && clients.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#111a2e] px-6 py-16 text-center shadow-xl shadow-black/10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
              <Users
                size={30}
                className="text-violet-400"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              {search
                ? "No clients found"
                : "No clients yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {search
                ? "Try another search term or clear the search to see all clients."
                : "Create your first client to start managing customer relationships and invoice history."}
            </p>

            {search ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-6 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Clear Search
              </button>
            ) : (
              <Link
                to="/clients/create"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500"
              >
                <Plus size={17} />
                Create First Client
              </Link>
            )}
          </div>
        )}

        {/* ==========================================
            CLIENT GRID
        ========================================== */}

        {!loading && clients.length > 0 && (
          <div className="grid gap-5 xl:grid-cols-2">
            {clients.map((client) => {
              const stats = client.stats || {};

              return (
                <div
                  key={client._id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111a2e] shadow-xl shadow-black/10 transition hover:border-violet-500/30 hover:shadow-violet-500/5"
                >
                  {/* Client Header */}
                  <div className="border-b border-white/10 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 text-lg font-bold text-violet-300">
                          {client.name
                            ?.charAt(0)
                            ?.toUpperCase() || "C"}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-white">
                            {client.name}
                          </h2>

                          {client.company && (
                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                              <Building2 size={14} />
                              <span className="truncate">
                                {client.company}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                        Client
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {client.email && (
                        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-400">
                          <Mail
                            size={15}
                            className="shrink-0 text-slate-500"
                          />
                          <span className="truncate">
                            {client.email}
                          </span>
                        </div>
                      )}

                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Phone
                            size={15}
                            className="shrink-0 text-slate-500"
                          />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10">
                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <ReceiptText
                          size={15}
                          className="text-blue-400"
                        />
                        <span className="text-xs text-slate-500">
                          Invoices
                        </span>
                      </div>

                      <p className="mt-2 text-lg font-bold text-white">
                        {stats.totalInvoices || 0}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <IndianRupee
                          size={15}
                          className="text-violet-400"
                        />
                        <span className="text-xs text-slate-500">
                          Billed
                        </span>
                      </div>

                      <p className="mt-2 text-lg font-bold text-white">
                        {formatCurrency(
                          stats.totalBilled
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10">
                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <Wallet
                          size={15}
                          className="text-emerald-400"
                        />
                        <span className="text-xs text-slate-500">
                          Paid
                        </span>
                      </div>

                      <p className="mt-2 text-lg font-bold text-emerald-300">
                        {formatCurrency(
                          stats.totalPaid
                        )}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          size={15}
                          className="text-amber-400"
                        />
                        <span className="text-xs text-slate-500">
                          Outstanding
                        </span>
                      </div>

                      <p className="mt-2 text-lg font-bold text-amber-300">
                        {formatCurrency(
                          stats.outstandingAmount
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 p-5">
                    <Link
                      to={`/clients/${client._id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <Eye size={16} />
                      View
                    </Link>

                    <Link
                      to={`/clients/${client._id}/edit`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
                    >
                      <Pencil size={16} />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        openDeleteModal(client)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          DELETE CONFIRMATION
      ========================================== */}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Client?"
        message={
          deleteModal.client
            ? `Are you sure you want to delete "${deleteModal.client.name}"? This action cannot be undone. Clients with associated invoices cannot be deleted.`
            : ""
        }
        confirmText="Delete Client"
        cancelText="Keep Client"
        onConfirm={handleDeleteClient}
        onCancel={closeDeleteModal}
        loading={deleting}
        danger
      />
    </>
  );
};

export default Clients;