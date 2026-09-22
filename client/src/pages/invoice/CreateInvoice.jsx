
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  FileText,
  User,
  CalendarDays,
  ReceiptText,
  IndianRupee,
  StickyNote,
  Loader2,
} from "lucide-react";
import api from "../../services/api";

const CreateInvoice = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([
    {
      description: "",
      quantity: 1,
      rate: 0,
    },
  ]);

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    tax: 0,
    status: "Draft",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===============================
  // HANDLE NORMAL INPUTS
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // ===============================
  // HANDLE ITEM CHANGES
  // ===============================
  const handleItemChange = (index, field, value) => {
    setItems((previousItems) =>
      previousItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // ===============================
  // ADD ITEM
  // ===============================
  const addItem = () => {
    setItems((previousItems) => [
      ...previousItems,
      {
        description: "",
        quantity: 1,
        rate: 0,
      },
    ]);
  };

  // ===============================
  // REMOVE ITEM
  // ===============================
  const removeItem = (index) => {
    if (items.length === 1) return;

    setItems((previousItems) =>
      previousItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  // ===============================
  // CALCULATIONS
  // ===============================
  const subtotal = items.reduce((total, item) => {
    return (
      total +
      Number(item.quantity || 0) *
        Number(item.rate || 0)
    );
  }, 0);

  const tax = Number(formData.tax) || 0;

  const total = subtotal + tax;

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  // ===============================
  // SUBMIT FORM
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const invoiceData = {
        ...formData,
        tax: Number(formData.tax) || 0,
        items: items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
        })),
      };

      const response = await api.post(
        "/invoices",
        invoiceData
      );

      console.log(
        "Invoice created:",
        response.data
      );

      navigate("/invoices");
    } catch (error) {
      console.error(
        "Create Invoice Error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to create invoice. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // COMMON INPUT STYLE
  // ===============================
  const inputStyle =
    "mt-2 w-full rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";

  const labelStyle =
    "text-sm font-medium text-slate-300";

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* ================= PAGE HEADER ================= */}

      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/20">
              <FileText
                size={22}
                className="text-violet-400"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Create Invoice
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Create a professional invoice for your client.
              </p>
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
          <p className="text-xs text-slate-400">
            Invoice Total
          </p>

          <p className="mt-1 text-lg font-bold text-violet-300">
            {formatCurrency(total)}
          </p>
        </div>

      </div>


      {/* ================= ERROR ================= */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">
            {error}
          </p>
        </div>
      )}


      {/* ================= FORM ================= */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* ================= CLIENT INFORMATION ================= */}

        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl shadow-black/10">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <User
                size={20}
                className="text-blue-400"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Client Information
              </h2>

              <p className="text-sm text-slate-400">
                Enter your client's details.
              </p>
            </div>

          </div>


          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className={labelStyle}>
                Client Name *
              </label>

              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                placeholder="Enter client name"
                className={inputStyle}
              />
            </div>


            <div>
              <label className={labelStyle}>
                Client Email
              </label>

              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                placeholder="Enter client email"
                className={inputStyle}
              />
            </div>


            <div className="md:col-span-2">

              <label className={labelStyle}>
                Client Address
              </label>

              <textarea
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleChange}
                placeholder="Enter client address"
                rows="3"
                className={inputStyle}
              />

            </div>

          </div>

        </div>


        {/* ================= INVOICE INFORMATION ================= */}

        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl shadow-black/10">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <CalendarDays
                size={20}
                className="text-violet-400"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Invoice Information
              </h2>

              <p className="text-sm text-slate-400">
                Configure invoice details and dates.
              </p>
            </div>

          </div>


          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className={labelStyle}>
                Invoice Number *
              </label>

              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
                placeholder="INV-001"
                className={inputStyle}
              />
            </div>


            <div>
              <label className={labelStyle}>
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputStyle}
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>


            <div>
              <label className={labelStyle}>
                Issue Date *
              </label>

              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                required
                className={inputStyle}
              />
            </div>


            <div>
              <label className={labelStyle}>
                Due Date *
              </label>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className={inputStyle}
              />
            </div>

          </div>

        </div>


        {/* ================= INVOICE ITEMS ================= */}

        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl shadow-black/10">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <ReceiptText
                  size={20}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Invoice Items
                </h2>

                <p className="text-sm text-slate-400">
                  Add products or services to your invoice.
                </p>
              </div>

            </div>


            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
            >
              <Plus size={18} />

              Add Item
            </button>

          </div>


          <div className="mt-6 space-y-4">

            {items.map((item, index) => (

              <div
                key={index}
                className="rounded-xl border border-white/10 bg-[#111827] p-5"
              >

                <div className="mb-4 flex items-center justify-between">

                  <p className="text-sm font-semibold text-slate-300">
                    Item {index + 1}
                  </p>

                  {items.length > 1 && (

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 size={16} />

                      Remove
                    </button>

                  )}

                </div>


                <div className="grid gap-4 md:grid-cols-12">

                  <div className="md:col-span-5">

                    <label className={labelStyle}>
                      Description *
                    </label>

                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      required
                      placeholder="Web Development Service"
                      className={inputStyle}
                    />

                  </div>


                  <div className="md:col-span-2">

                    <label className={labelStyle}>
                      Quantity *
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      required
                      className={inputStyle}
                    />

                  </div>


                  <div className="md:col-span-2">

                    <label className={labelStyle}>
                      Rate (₹) *
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "rate",
                          e.target.value
                        )
                      }
                      required
                      className={inputStyle}
                    />

                  </div>


                  <div className="md:col-span-3">

                    <label className={labelStyle}>
                      Amount
                    </label>

                    <div className="mt-2 flex h-[46px] items-center rounded-xl border border-violet-500/20 bg-violet-500/10 px-4">

                      <IndianRupee
                        size={16}
                        className="mr-1 text-violet-400"
                      />

                      <span className="font-semibold text-violet-200">
                        {Number(item.quantity || 0) *
                          Number(item.rate || 0)}
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>


        {/* ================= PAYMENT SUMMARY ================= */}

        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#111827] to-violet-950/30 p-6 shadow-xl shadow-black/10">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <IndianRupee
                size={20}
                className="text-violet-400"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Payment Summary
              </h2>

              <p className="text-sm text-slate-400">
                Review the invoice amount.
              </p>
            </div>

          </div>


          <div className="mt-6 ml-auto max-w-md space-y-5">

            <div className="flex justify-between text-sm">

              <span className="text-slate-400">
                Subtotal
              </span>

              <span className="font-medium text-slate-200">
                {formatCurrency(subtotal)}
              </span>

            </div>


            <div className="flex items-center justify-between gap-5">

              <label className="text-sm text-slate-400">
                Tax (₹)
              </label>

              <input
                type="number"
                min="0"
                name="tax"
                value={formData.tax}
                onChange={handleChange}
                className="w-40 rounded-xl border border-slate-700 bg-[#0b1120] px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />

            </div>


            <div className="flex items-center justify-between border-t border-white/10 pt-5">

              <span className="text-base font-semibold text-white">
                Total Amount
              </span>

              <span className="text-2xl font-bold text-violet-300">
                {formatCurrency(total)}
              </span>

            </div>

          </div>

        </div>


        {/* ================= NOTES ================= */}

        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl shadow-black/10">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <StickyNote
                size={20}
                className="text-amber-400"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Notes
              </h2>

              <p className="text-sm text-slate-400">
                Add additional information for your client.
              </p>
            </div>

          </div>


          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Additional notes for the client..."
            className={inputStyle}
          />

        </div>


        {/* ================= ACTIONS ================= */}

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() => navigate("/invoices")}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>


          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Creating Invoice...
              </>
            ) : (
              <>
                <Plus size={18} />

                Create Invoice
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
};

export default CreateInvoice;