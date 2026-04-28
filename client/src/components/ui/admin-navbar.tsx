import { useAuth } from "@/hooks/useAuth";
import { Building2, Shield, LogOut } from "lucide-react";

export default function AdminNavbar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#051A3E] shadow-lg border-b border-white/10">
      <div className="bg-amber-600 text-amber-50 text-xs px-4 py-1 text-center font-medium">
        Admin Control Panel — Restricted Access
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00C896] rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#051A3E]" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-white">Finora</span>
              <span className="text-[#00C896] font-bold"> Bank</span>
              <span className="text-amber-400 text-xs font-semibold ml-2 bg-amber-400/20 px-1.5 py-0.5 rounded">ADMIN</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-blue-200 text-sm">
              <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0]}
              </div>
              <span className="font-medium">{user?.firstName}</span>
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 border border-red-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
