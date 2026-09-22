
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Landmark,
  FileText,
  ReceiptText,
  Wallet,
  AlertCircle,
  IndianRupee,
  RefreshCw,
  Calendar,
  Eye,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";

import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusStyles = {
    Paid: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    Sent: "border border-blue-500/20 bg-blue-500/10 text-blue-300",
    Draft: "border border-slate-500/20 bg-slate-500/10 text-slate-300",
    Overdue:
      "border border-red-500/20 bg-red-500/10 text-red-300",
    "Partially Paid":
      "border border-amber-500/20 bg-amber-500/10 text-amber-300",
  };

  const fetchClient = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/clients/${id}`);

      setClient(response.data.client);
      setStats(response.data.stats);
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error("Fetch Client Details Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch client details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);

      await api.delete(`/clients/${id}`);

      toast.success("Client deleted successfully.");

      navigate("/clients");
    } catch (error) {
      console.error("Delete Client Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to delete client."
      );
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] px-10 py-8 text-center shadow-xl shadow-black/20">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-violet-400"
          />

          <p className="mt-4 text-sm font-medium text-slate-300">
            Loading client details...
          </p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
        <AlertCircle
          size={30}
          className="mx-auto text-red-400"
        />

        <h2 className="mt-5 text-xl font-bold text-white">
          Client not found
        </h2>

        <Link
          to="/clients"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
        >
          <ArrowLeft size={17} />
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#15102b] via-[#111a2e] to-[#1d1238] shadow-2xl shadow-black/20">
          <div className="p-6 md:p-8">
            <Link
              to="/clients"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
            >
              <ArrowLeft size={17} />
              Back to Clients
            </Link>

            <div className="mt-7 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/20">
                  {client.name
                    ?.charAt(0)
                    ?.toUpperCase() || "C"}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                      {client.name}
                    </h1>

                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                      Client
                    </span>
                  </div>

                  {client.company && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                      <Building2 size={15} />
                      {client.company}
                    </div>
                  )}

                  <p className="mt-2 text-sm text-slate-500">
                    Customer profile, invoice history, and
                    financial overview.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/clients/${id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
                >
                  <Pencil size={17} />
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setDeleteModalOpen(true)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  <Trash2 size={17} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            FINANCIAL STATISTICS
        ========================================== */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                <ReceiptText
                  size={20}
                  className="text-blue-400"
                />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Total
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Invoices
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {stats?.totalInvoices || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                <IndianRupee
                  size={20}
                  className="text-violet-400"
                />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Revenue
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Billed
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {formatCurrency(stats?.totalBilled)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <Wallet
                  size={20}
                  className="text-emerald-400"
                />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Collected
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Paid
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {formatCurrency(stats?.totalPaid)}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertCircle
                  size={20}
                  className="text-amber-400"
                />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Pending
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outstanding
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-300">
              {formatCurrency(
                stats?.outstandingAmount
              )}
            </p>
          </div>
        </div>

        {/* ==========================================
            CLIENT + CONTACT INFORMATION
        ========================================== */}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact */}
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
                  Contact Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Customer contact details
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              {client.email && (
                <div className="flex gap-3">
                  <Mail
                    size={18}
                    className="mt-1 shrink-0 text-slate-500"
                  />

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </p>

                    <a
                      href={`mailto:${client.email}`}
                      className="mt-2 block break-all text-sm text-violet-300 transition hover:text-violet-200"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              )}

              {client.phone && (
                <div className="flex gap-3">
                  <Phone
                    size={18}
                    className="mt-1 shrink-0 text-slate-500"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Phone
                    </p>

                    <a
                      href={`tel:${client.phone}`}
                      className="mt-2 block text-sm text-violet-300 transition hover:text-violet-200"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}

              {client.company && (
                <div className="flex gap-3">
                  <Building2
                    size={18}
                    className="mt-1 shrink-0 text-slate-500"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Company
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      {client.company}
                    </p>
                  </div>
                </div>
              )}

              {!client.email &&
                !client.phone &&
                !client.company && (
                  <p className="text-sm text-slate-500">
                    No additional contact information has
                    been provided.
                  </p>
                )}
            </div>
          </div>

          {/* Address / Tax */}
          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                <MapPin
                  size={21}
                  className="text-blue-400"
                />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Billing Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Address and tax information
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              {(client.address ||
                client.city ||
                client.state ||
                client.country ||
                client.postalCode) && (
                <div className="flex gap-3">
                  <MapPin
                    size={18}
                    className="mt-1 shrink-0 text-slate-500"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Address
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                      {[
                        client.address,
                        [
                          client.city,
                          client.state,
                          client.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", "),
                        client.country,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                    </p>
                  </div>
                </div>
              )}

              {client.gstNumber && (
                <div className="flex gap-3">
                  <Landmark
                    size={18}
                    className="mt-1 shrink-0 text-slate-500"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      GST Number
                    </p>

                    <p className="mt-2 text-sm font-semibold text-emerald-300">
                      {client.gstNumber}
                    </p>
                  </div>
                </div>
              )}

              {!client.address &&
                !client.city &&
                !client.state &&
                !client.country &&
                !client.postalCode &&
                !client.gstNumber && (
                  <p className="text-sm text-slate-500">
                    No billing information has been provided.
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* ==========================================
            NOTES
        ========================================== */}

        {client.notes && (
          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
            <div className="flex items-center gap-3">
              <FileText
                size={19}
                className="text-amber-400"
              />

              <h2 className="font-bold text-white">
                Notes
              </h2>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
              {client.notes}
            </p>
          </div>
        )}

        {/* ==========================================
            INVOICE HISTORY
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111a2e] shadow-xl shadow-black/10">
          <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10">
                <ReceiptText
                  size={21}
                  className="text-purple-400"
                />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Invoice History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  All invoices associated with this client
                </p>
              </div>
            </div>

            <Link
              to="/invoices/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500"
            >
              <Plus size={16} />
              Create Invoice
            </Link>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <ReceiptText
                size={30}
                className="mx-auto text-slate-600"
              />

              <h3 className="mt-4 font-bold text-white">
                No invoices yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                There are no invoices associated with this
                client.
              </p>

              <Link
                to="/invoices/create"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Plus size={16} />
                Create Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#0b1220]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Invoice
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Issue Date
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Due Date
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Total
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Paid
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice._id}
                      className="border-t border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-5">
                        <Link
                          to={`/invoices/${invoice._id}`}
                          className="font-semibold text-violet-300 transition hover:text-violet-200"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar
                            size={14}
                            className="text-slate-600"
                          />
                          {formatDate(
                            invoice.issueDate
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {formatDate(invoice.dueDate)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[
                              invoice.status
                            ] ||
                            "border border-slate-500/20 bg-slate-500/10 text-slate-300"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right text-sm font-semibold text-white">
                        {formatCurrency(invoice.total)}
                      </td>

                      <td className="px-6 py-5 text-right text-sm font-semibold text-emerald-300">
                        {formatCurrency(
                          invoice.paidAmount
                        )}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          to={`/invoices/${invoice._id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==========================================
            CLIENT CREATED
        ========================================== */}

        {client.createdAt && (
          <div className="flex items-center justify-center gap-2 pb-4 text-xs text-slate-600">
            <CheckCircle2 size={13} />
            Client profile created on{" "}
            {formatDate(client.createdAt)}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Client?"
        message={`Are you sure you want to delete "${client.name}"? This action cannot be undone. The backend will prevent deletion if invoices are associated with this client.`}
        confirmText="Delete Client"
        cancelText="Keep Client"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
          }
        }}
        loading={deleting}
        danger
      />
    </>
  );
};

export default ClientDetails;