
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  User,
  ReceiptText,
  Sparkles,
  Users,
  BrainCircuit,
} from "lucide-react";

const Sidebar = () => {
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Invoices",
      path: "/invoices",
      icon: FileText,
    },
    {
      name: "Clients",
      path: "/clients",
      icon: Users,
    },
    {
      name: "Create Invoice",
      path: "/invoices/create",
      icon: PlusCircle,
    },
    {
      name: "AI Assistant",
      path: "/ai-assistant",
      icon: BrainCircuit,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-white/10 bg-[#0d1424]">
      {/* Logo */}

      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/20">
            <ReceiptText
              size={21}
              className="text-white"
            />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Invoice
              <span className="text-violet-400">
                AI
              </span>
            </h1>

            <p className="text-xs text-slate-400">
              Smart Finance
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}

      <nav className="px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </p>

        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600/30 to-purple-600/15 text-white shadow-sm ring-1 ring-violet-500/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={20}
                      className={
                        isActive
                          ? "text-violet-300"
                          : "text-slate-400 transition-colors group-hover:text-white"
                      }
                    />

                    <span>
                      {item.name}
                    </span>

                    {isActive && (
                      <Sparkles
                        size={15}
                        className="ml-auto text-violet-300"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}

      <div className="absolute bottom-0 left-0 w-full border-t border-white/10 p-5">
        <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-purple-500/10 p-4">
          <p className="text-sm font-semibold text-white">
            InvoiceAI
          </p>

          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Manage your invoices and business finances
            smarter.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;