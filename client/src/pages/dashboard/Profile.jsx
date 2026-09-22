
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  Pencil,
  CheckCircle2,
  Calendar,
  Building2,
  Phone,
  MapPin,
  Save,
  X,
  Loader2,
  Globe,
  FileText,
  CreditCard,
  Landmark,
  ReceiptText,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

import api from "../../services/api";

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [selectedLogoName, setSelectedLogoName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    phone: "",
    address: "",
    website: "",
    gstNumber: "",
    panNumber: "",
    currency: "INR",
  });

  // =====================================
  // FETCH USER PROFILE
  // =====================================

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await api.get("/auth/profile");

      const profileUser = response.data.user;

      setUser(profileUser);
      setLogoPreview(profileUser.logoUrl || "");
      setSelectedLogoName("");

      setFormData({
        name: profileUser.name || "",
        businessName: profileUser.businessName || "",
        phone: profileUser.phone || "",
        address: profileUser.address || "",
        website: profileUser.website || "",
        gstNumber: profileUser.gstNumber || "",
        panNumber: profileUser.panNumber || "",
        currency: profileUser.currency || "INR",
      });

      localStorage.setItem(
        "user",
        JSON.stringify(profileUser)
      );
    } catch (error) {
      console.error("Profile Fetch Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =====================================
  // HANDLE INPUT CHANGE
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "gstNumber" || name === "panNumber"
          ? value.toUpperCase()
          : value,
    }));
  };

  // =====================================
  // BUSINESS LOGO
  // =====================================

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, PNG and WebP images are allowed"
      );

      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        "Logo image must be smaller than 2 MB"
      );

      e.target.value = "";
      return;
    }

    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setLogoPreview(previewUrl);
    setSelectedLogoName(file.name);
  };

  const handleLogoUpload = async () => {
    const input = document.getElementById(
      "business-logo-input"
    );

    const file = input?.files?.[0];

    if (!file) {
      toast.error("Please select a logo first");
      return;
    }

    try {
      setUploadingLogo(true);

      const uploadData = new FormData();

      uploadData.append("logo", file);

      const response = await api.post(
        "/uploads/business-logo",
        uploadData
      );

      const updatedUser = response.data.user;

      setUser(updatedUser);
      setLogoPreview(updatedUser.logoUrl || "");
      setSelectedLogoName("");

      const existingUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const updatedLocalUser = {
        ...existingUser,
        ...updatedUser,
        createdAt:
          updatedUser.createdAt ||
          existingUser.createdAt,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedLocalUser)
      );

      if (input) {
        input.value = "";
      }

      toast.success(
        "Business logo uploaded successfully"
      );
    } catch (error) {
      console.error("Logo Upload Error:", error);

      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }

      setLogoPreview(user?.logoUrl || "");

      toast.error(
        error.response?.data?.message ||
          "Failed to upload business logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!user?.logoUrl) return;

    try {
      setRemovingLogo(true);

      await api.delete("/uploads/business-logo");

      const updatedUser = {
        ...user,
        logoUrl: "",
        logoPublicId: "",
      };

      setUser(updatedUser);
      setLogoPreview("");
      setSelectedLogoName("");

      const existingUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...existingUser,
          ...updatedUser,
        })
      );

      const input = document.getElementById(
        "business-logo-input"
      );

      if (input) {
        input.value = "";
      }

      toast.success(
        "Business logo removed successfully"
      );
    } catch (error) {
      console.error("Logo Remove Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to remove business logo"
      );
    } finally {
      setRemovingLogo(false);
    }
  };

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  // =====================================
  // SAVE PROFILE
  // =====================================

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (
      formData.website.trim() &&
      !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i.test(
        formData.website.trim()
      )
    ) {
      toast.error("Please enter a valid website URL");
      return;
    }

    if (
      formData.gstNumber.trim() &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
        formData.gstNumber.trim().toUpperCase()
      )
    ) {
      toast.error("Please enter a valid GSTIN");
      return;
    }

    if (
      formData.panNumber.trim() &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
        formData.panNumber.trim().toUpperCase()
      )
    ) {
      toast.error("Please enter a valid PAN number");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        "/auth/profile",
        {
          ...formData,
          gstNumber: formData.gstNumber
            .trim()
            .toUpperCase(),
          panNumber: formData.panNumber
            .trim()
            .toUpperCase(),
          website: formData.website.trim(),
        }
      );

      const updatedUser = response.data.user;

      setUser(updatedUser);

      setFormData({
        name: updatedUser.name || "",
        businessName: updatedUser.businessName || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        website: updatedUser.website || "",
        gstNumber: updatedUser.gstNumber || "",
        panNumber: updatedUser.panNumber || "",
        currency: updatedUser.currency || "INR",
      });

      const existingUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const updatedLocalUser = {
        ...existingUser,
        ...updatedUser,
        createdAt:
          updatedUser.createdAt ||
          existingUser.createdAt,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedLocalUser)
      );

      setUser(updatedLocalUser);

      toast.success(
        "Business profile updated successfully"
      );

      setIsEditing(false);
    } catch (error) {
      console.error("Profile Update Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // CANCEL EDITING
  // =====================================

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      businessName: user?.businessName || "",
      phone: user?.phone || "",
      address: user?.address || "",
      website: user?.website || "",
      gstNumber: user?.gstNumber || "",
      panNumber: user?.panNumber || "",
      currency: user?.currency || "INR",
    });

    setIsEditing(false);
  };

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    toast.success("Logged out successfully");

    navigate("/");
  };

  // =====================================
  // GET INITIALS
  // =====================================

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // =====================================
  // FIELD COMPONENT
  // =====================================

  const renderField = ({
    label,
    name,
    value,
    icon: Icon,
    placeholder,
    type = "text",
  }) => {
    if (isEditing) {
      return (
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </label>

          <div className="relative">
            <Icon
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>

        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800">
            <Icon
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="break-all font-medium text-white">
            {value || "Not added yet"}
          </p>
        </div>
      </div>
    );
  };

  // =====================================
  // LOADING STATE
  // =====================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={36}
            className="animate-spin text-violet-400"
          />

          <p className="text-sm text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="space-y-8">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
            <Building2
              size={23}
              className="text-white"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Business Profile
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage your account and invoice business information.
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Pencil size={17} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              <X size={17} />
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* =====================================
          PROFILE HERO
      ===================================== */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#17112d] via-[#111a2e] to-[#1d1238] shadow-xl shadow-black/20">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* AVATAR / LOGO */}

            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-3xl font-bold text-white shadow-xl shadow-violet-500/20">
              {user?.logoUrl ? (
                <img
                  src={user.logoUrl}
                  alt={`${user?.businessName || "Business"} logo`}
                  className="h-full w-full object-contain bg-[#0b1220] p-2"
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>

            {/* USER DETAILS */}

            <div className="flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {user?.businessName ||
                      user?.name ||
                      "Your Business"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {user?.name || "User"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {user?.email ||
                      "No email available"}
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 size={15} />
                  Active Account
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================
          PERSONAL + BUSINESS
      ===================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* PERSONAL INFORMATION */}

        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
          <div>
            <h2 className="text-lg font-bold text-white">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Your basic account details.
            </p>
          </div>

          <div className="mt-7 space-y-6">
            {renderField({
              label: "Full Name",
              name: "name",
              value: formData.name,
              icon: User,
              placeholder: "Enter your full name",
            })}

            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email Address
              </label>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800">
                  <Mail
                    size={18}
                    className="text-slate-400"
                  />
                </div>

                <p className="break-all font-medium text-violet-300">
                  {user?.email || "Not available"}
                </p>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Email address cannot be changed from profile settings.
              </p>
            </div>

            {renderField({
              label: "Phone Number",
              name: "phone",
              value: formData.phone,
              icon: Phone,
              placeholder: "Enter your phone number",
              type: "tel",
            })}
          </div>
        </div>

        {/* BUSINESS INFORMATION */}

        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
          <div>
            <h2 className="text-lg font-bold text-white">
              Business Information
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Details that can appear on your invoices.
            </p>
          </div>

          <div className="mt-7 space-y-6">
            {renderField({
              label: "Business Name",
              name: "businessName",
              value: formData.businessName,
              icon: Building2,
              placeholder: "Enter your business name",
            })}

            {/* ADDRESS */}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Business Address
              </label>

              {isEditing ? (
                <div className="relative">
                  <MapPin
                    size={17}
                    className="absolute left-4 top-4 text-slate-500"
                  />

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Enter your business address"
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                  />
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <MapPin
                      size={18}
                      className="text-blue-400"
                    />
                  </div>

                  <p className="leading-relaxed whitespace-pre-line text-white">
                    {user?.address || "Not added yet"}
                  </p>
                </div>
              )}
            </div>

            {renderField({
              label: "Website",
              name: "website",
              value: formData.website,
              icon: Globe,
              placeholder: "example.com",
              type: "url",
            })}
          </div>
        </div>
      </div>

      {/* =====================================
          TAX + INVOICE SETTINGS
      ===================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3">
            <ReceiptText
              size={20}
              className="text-emerald-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Tax & Invoice Settings
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Business tax information and default invoice currency.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-3">
          {renderField({
            label: "GSTIN",
            name: "gstNumber",
            value: formData.gstNumber,
            icon: FileText,
            placeholder: "22AAAAA0000A1Z5",
          })}

          {renderField({
            label: "PAN Number",
            name: "panNumber",
            value: formData.panNumber,
            icon: CreditCard,
            placeholder: "ABCDE1234F",
          })}

          {/* CURRENCY */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Default Currency
            </label>

            {isEditing ? (
              <div className="relative">
                <Landmark
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-violet-500"
                >
                  <option value="INR">
                    INR — Indian Rupee
                  </option>

                  <option value="USD">
                    USD — US Dollar
                  </option>

                  <option value="EUR">
                    EUR — Euro
                  </option>

                  <option value="GBP">
                    GBP — British Pound
                  </option>

                  <option value="AED">
                    AED — UAE Dirham
                  </option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                  <Landmark
                    size={18}
                    className="text-violet-400"
                  />
                </div>

                <p className="font-medium text-white">
                  {user?.currency || "INR"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================
          BRANDING + LOGO
      ===================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-500/10 p-3">
            <Building2
              size={20}
              className="text-violet-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Business Branding
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Add your business logo and review the identity used on invoices.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* LOGO MANAGEMENT */}

          <div className="rounded-xl border border-white/10 bg-[#0b1220] p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#111a2e]">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Business logo"
                    className="h-full w-full object-contain p-4"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <ImageIcon size={42} />

                    <span className="text-sm">
                      No logo uploaded
                    </span>
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm font-semibold text-white">
                Business Logo
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                JPG, PNG or WebP. Maximum file size 2 MB.
              </p>

              <input
                id="business-logo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoSelect}
                className="hidden"
              />

              <label
                htmlFor="business-logo-input"
                className={`mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 ${
                  uploadingLogo || removingLogo
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                <Upload size={17} />

                {logoPreview
                  ? "Choose Another Logo"
                  : "Choose Logo"}
              </label>

              {selectedLogoName && (
                <p className="mt-3 w-full break-all text-xs text-violet-300">
                  {selectedLogoName}
                </p>
              )}

              {selectedLogoName && (
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  disabled={
                    uploadingLogo ||
                    removingLogo
                  }
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingLogo ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Upload size={17} />
                  )}

                  {uploadingLogo
                    ? "Uploading..."
                    : "Upload Logo"}
                </button>
              )}

              {user?.logoUrl &&
                !selectedLogoName && (
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    disabled={
                      uploadingLogo ||
                      removingLogo
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingLogo ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={17} />
                    )}

                    {removingLogo
                      ? "Removing..."
                      : "Remove Logo"}
                  </button>
                )}
            </div>
          </div>

          {/* BUSINESS IDENTITY PREVIEW */}

          <div className="rounded-xl border border-white/10 bg-[#0b1220] p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-5">
                {user?.logoUrl && (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111a2e]">
                    <img
                      src={user.logoUrl}
                      alt={`${
                        user?.businessName ||
                        "Business"
                      } logo`}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xl font-bold text-white">
                    {user?.businessName ||
                      "Your Business Name"}
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm text-slate-400">
                    {user?.address ||
                      "Business address not added"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    {user?.phone && (
                      <span>{user.phone}</span>
                    )}

                    {user?.email && (
                      <span>{user.email}</span>
                    )}

                    {user?.website && (
                      <span>{user.website}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-left sm:text-right">
                {user?.gstNumber && (
                  <p className="text-xs text-slate-400">
                    GSTIN:{" "}
                    <span className="font-semibold text-white">
                      {user.gstNumber}
                    </span>
                  </p>
                )}

                {user?.panNumber && (
                  <p className="text-xs text-slate-400">
                    PAN:{" "}
                    <span className="font-semibold text-white">
                      {user.panNumber}
                    </span>
                  </p>
                )}

                <p className="text-xs text-slate-400">
                  Currency:{" "}
                  <span className="font-semibold text-violet-300">
                    {user?.currency || "INR"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-violet-500/10 bg-violet-500/5 p-4">
          <p className="text-xs leading-relaxed text-slate-400">
            Your logo is stored securely in Cloudinary and its URL is saved with your business profile for use in professional invoices.
          </p>
        </div>
      </div>

      {/* =====================================
          ACCOUNT INFORMATION
      ===================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
        <div>
          <h2 className="text-lg font-bold text-white">
            Account Information
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Information about your InvoiceAI account.
          </p>
        </div>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          {/* ACCOUNT STATUS */}

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <ShieldCheck
                size={18}
                className="text-emerald-400"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Account Status
              </p>

              <p className="mt-1 font-medium text-emerald-300">
                Active
              </p>
            </div>
          </div>

          {/* MEMBER SINCE */}

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Calendar
                size={18}
                className="text-blue-400"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Member Since
              </p>

              <p className="mt-1 font-medium text-white">
                {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================
          SECURITY
      ===================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6 shadow-xl shadow-black/10">
        <div>
          <h2 className="text-lg font-bold text-white">
            Account Security
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage your account access and security.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0b1220] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">
              Logout from InvoiceAI
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Sign out securely from your current session.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;