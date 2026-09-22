
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserPen,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Landmark,
  FileText,
  Save,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import api from "../../services/api";

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    gstNumber: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/clients/${id}`);
        const client = response.data.client;

        setForm({
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          company: client.company || "",
          address: client.address || "",
          city: client.city || "",
          state: client.state || "",
          country: client.country || "",
          postalCode: client.postalCode || "",
          gstNumber: client.gstNumber || "",
          notes: client.notes || "",
        });
      } catch (error) {
        console.error("Fetch Client Error:", error);

        setError(
          error.response?.data?.message ||
            "Failed to fetch client."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Client name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(`/clients/${id}`, {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        postalCode: form.postalCode.trim(),
        gstNumber: form.gstNumber.trim(),
        notes: form.notes.trim(),
      });

      toast.success(
        response.data.message ||
          "Client updated successfully."
      );

      navigate(`/clients/${id}`);
    } catch (error) {
      console.error("Update Client Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update client."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10";

  const labelClass =
    "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] px-10 py-8 text-center shadow-xl shadow-black/20">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-violet-400"
          />

          <p className="mt-4 text-sm font-medium text-slate-300">
            Loading client...
          </p>
        </div>
      </div>
    );
  }

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

        <Link
          to="/clients"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500"
        >
          <ArrowLeft size={17} />
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#15102b] via-[#111a2e] to-[#1d1238] shadow-2xl shadow-black/20">
        <div className="p-6 md:p-8">
          <Link
            to={`/clients/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
          >
            <ArrowLeft size={17} />
            Back to Client
          </Link>

          <div className="mt-7 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <UserPen
                size={27}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Edit Client
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Update customer information and billing
                details.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic */}
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <User
                size={19}
                className="text-violet-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Main customer contact details
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className={labelClass}
              >
                Client Name *
              </label>

              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label
                htmlFor="company"
                className={labelClass}
              >
                Company
              </label>

              <div className="relative">
                <Building2
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className={labelClass}
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className={labelClass}
              >
                Phone
              </label>

              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <MapPin
                size={19}
                className="text-blue-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Address
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Customer billing address
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="address"
                className={labelClass}
              >
                Address
              </label>

              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="city"
                  className={labelClass}
                >
                  City
                </label>

                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className={labelClass}
                >
                  State
                </label>

                <input
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="country"
                  className={labelClass}
                >
                  Country
                </label>

                <input
                  id="country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="postalCode"
                  className={labelClass}
                >
                  Postal Code
                </label>

                <input
                  id="postalCode"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tax */}
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Landmark
                size={19}
                className="text-emerald-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Tax Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                GST information
              </p>
            </div>
          </div>

          <div className="mt-7 max-w-xl">
            <label
              htmlFor="gstNumber"
              className={labelClass}
            >
              GST Number
            </label>

            <input
              id="gstNumber"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <FileText
                size={19}
                className="text-amber-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Notes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Additional client information
              </p>
            </div>
          </div>

          <div className="mt-7">
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={5}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to={`/clients/${id}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClient;