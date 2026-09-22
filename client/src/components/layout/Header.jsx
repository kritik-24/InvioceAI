
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  FileText,
  X,
  Loader2,
} from "lucide-react";

import toast from "react-hot-toast";
import api from "../../services/api";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  // =====================================
  // LOAD USER
  // =====================================

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };

    loadUser();

    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, [location.pathname]);

  // =====================================
  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  // =====================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

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
  // GET PAGE TITLE
  // =====================================

  const getPageDetails = () => {
    const path = location.pathname;

    if (path === "/dashboard") {
      return {
        title: "Dashboard",
        subtitle: "Manage your invoices and business finances",
      };
    }

    if (path === "/invoices") {
      return {
        title: "Invoices",
        subtitle: "Manage all your invoices in one place",
      };
    }

    if (path === "/invoices/create") {
      return {
        title: "Create Invoice",
        subtitle: "Create a new professional invoice",
      };
    }

    if (path === "/profile") {
      return {
        title: "My Profile",
        subtitle: "Manage your account and business information",
      };
    }

    if (path.includes("/edit")) {
      return {
        title: "Edit Invoice",
        subtitle: "Update your invoice information",
      };
    }

    if (path.startsWith("/invoices/")) {
      return {
        title: "Invoice Details",
        subtitle: "View your invoice information",
      };
    }

    return {
      title: "InvoiceAI",
      subtitle: "Manage your business finances",
    };
  };

  const pageDetails = getPageDetails();

  // =====================================
  // SEARCH INVOICES
  // =====================================

  const handleSearch = async (value) => {
    setSearchQuery(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);

      const response = await api.get("/invoices");

      const invoices =
        response.data.invoices ||
        response.data ||
        [];

      const query = value.toLowerCase();

      const filteredInvoices = invoices.filter((invoice) => {
        return (
          invoice.clientName
            ?.toLowerCase()
            .includes(query) ||
          invoice.invoiceNumber
            ?.toLowerCase()
            .includes(query) ||
          invoice.status
            ?.toLowerCase()
            .includes(query)
        );
      });

      setSearchResults(filteredInvoices.slice(0, 5));
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    toast.success("Logged out successfully");

    navigate("/");
  };

  // =====================================
  // NOTIFICATIONS
  // =====================================

  const notifications = [
    {
      id: 1,
      title: "Welcome to InvoiceAI",
      message: "Start creating invoices to manage your business finances.",
    },
    {
      id: 2,
      title: "Profile",
      message: "Complete your business information for a better experience.",
    },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#080d1a]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">

      {/* PAGE TITLE */}

      <div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          {pageDetails.title}
        </h2>

        <p className="mt-1 hidden text-sm text-slate-500 sm:block">
          {pageDetails.subtitle}
        </p>
      </div>


      {/* RIGHT ACTIONS */}

      <div className="flex items-center gap-3">

        {/* SEARCH */}

        <div
          ref={searchRef}
          className="relative"
        >
          <button
            onClick={() => {
              setShowSearch((prev) => !prev);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300 sm:flex"
            title="Search invoices"
          >
            <Search size={18} />
          </button>

          {showSearch && (
            <div className="absolute right-0 top-14 w-[360px] rounded-2xl border border-white/10 bg-[#111a2e] p-4 shadow-2xl shadow-black/40">

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#080d1a] px-3">

                <Search
                  size={18}
                  className="text-slate-400"
                />

                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    handleSearch(e.target.value)
                  }
                  placeholder="Search invoices..."
                  className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />

                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={17} />
                  </button>
                )}

              </div>


              <div className="mt-3">

                {searchLoading && (
                  <div className="flex justify-center py-6">

                    <Loader2
                      size={22}
                      className="animate-spin text-violet-400"
                    />

                  </div>
                )}


                {!searchLoading &&
                  searchQuery &&
                  searchResults.length === 0 && (

                    <p className="py-6 text-center text-sm text-slate-500">
                      No invoices found
                    </p>

                  )}


                {!searchLoading &&
                  searchResults.map((invoice) => (

                    <button
                      key={invoice._id}
                      onClick={() => {
                        navigate(`/invoices/${invoice._id}`);
                        setShowSearch(false);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/5"
                    >

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">

                        <FileText
                          size={18}
                          className="text-violet-400"
                        />

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold text-white">
                          {invoice.invoiceNumber}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {invoice.clientName}
                        </p>

                      </div>

                      <span className="text-xs text-slate-500">
                        {invoice.status}
                      </span>

                    </button>

                  ))}

              </div>

            </div>
          )}

        </div>


        {/* NOTIFICATIONS */}

        <div
          ref={notificationRef}
          className="relative"
        >

          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowSearch(false);
              setShowUserMenu(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
            title="Notifications"
          >

            <Bell size={18} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-[#080d1a]" />

          </button>


          {showNotifications && (

            <div className="absolute right-0 top-14 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#111a2e] shadow-2xl shadow-black/40">

              <div className="border-b border-white/10 px-5 py-4">

                <div className="flex items-center justify-between">

                  <h3 className="font-semibold text-white">
                    Notifications
                  </h3>

                  <span className="rounded-full bg-violet-500/10 px-2 py-1 text-xs text-violet-300">
                    {notifications.length} new
                  </span>

                </div>

              </div>


              <div className="max-h-80 overflow-y-auto">

                {notifications.map((notification) => (

                  <div
                    key={notification.id}
                    className="border-b border-white/5 p-4 transition hover:bg-white/[0.03]"
                  >

                    <p className="text-sm font-medium text-white">
                      {notification.title}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {notification.message}
                    </p>

                  </div>

                ))}

              </div>


              <button
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/profile");
                }}
                className="w-full border-t border-white/10 py-3 text-sm font-medium text-violet-400 transition hover:bg-violet-500/5"
              >
                View Profile
              </button>

            </div>

          )}

        </div>


        {/* USER PROFILE */}

        <div
          ref={userMenuRef}
          className="relative"
        >

          <button
            onClick={() => {
              setShowUserMenu((prev) => !prev);
              setShowSearch(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-3 transition hover:bg-white/[0.06]"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-violet-500/20">

              {getInitials(user?.name)}

            </div>


            <div className="hidden text-left sm:block">

              <p className="max-w-[120px] truncate text-sm font-semibold text-slate-200">

                {user?.name || "User"}

              </p>

              <p className="text-xs text-slate-500">
                Invoice Manager
              </p>

            </div>


            <ChevronDown
              size={16}
              className={`hidden text-slate-500 transition-transform sm:block ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />

          </button>


          {showUserMenu && (

            <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111a2e] shadow-2xl shadow-black/40">

              {/* USER INFO */}

              <div className="border-b border-white/10 p-4">

                <p className="truncate font-semibold text-white">
                  {user?.name || "User"}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {user?.email || "No email"}
                </p>

              </div>


              {/* PROFILE */}

              <button
                onClick={() => {
                  navigate("/profile");
                  setShowUserMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >

                <User
                  size={18}
                  className="text-violet-400"
                />

                My Profile

              </button>


              {/* SETTINGS */}

              <button
                onClick={() => {
                  navigate("/profile");
                  setShowUserMenu(false);

                  toast("Profile settings are available here");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >

                <Settings
                  size={18}
                  className="text-slate-400"
                />

                Settings

              </button>


              {/* LOGOUT */}

              <div className="border-t border-white/10">

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                >

                  <LogOut size={18} />

                  Logout

                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </header>
  );
};

export default Header;