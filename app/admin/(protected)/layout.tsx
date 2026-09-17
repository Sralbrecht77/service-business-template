import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/icons";
import { businessConfig } from "@/lib/business-config";
import { getAdminContext } from "@/lib/supabase/auth";
import { logoutAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: React.PropsWithChildren) {
  let context;

  try {
    context = await getAdminContext();
  } catch {
    redirect("/admin/login");
  }

  if (!context.user || !context.isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-7">
            <Link href="/admin" className="flex shrink-0 items-center gap-3">
              <LogoMark className="size-10 text-blue-500" />
              <span className="hidden sm:block">
                <span className="block font-extrabold">{businessConfig.company.shortName}</span>
                <span className="block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Admin dashboard</span>
              </span>
            </Link>
            <nav aria-label="Admin navigation" className="hidden border-l border-white/15 pl-7 md:block">
              <Link href="/admin" className="text-sm font-bold text-slate-200 transition hover:text-white">Bookings</Link>
            </nav>
          </div>
          <div className="flex min-w-0 items-center gap-4">
            <p className="hidden max-w-56 truncate text-xs text-slate-400 sm:block">{context.user.email}</p>
            <form action={logoutAdmin}>
              <button type="submit" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold transition hover:border-white/40 hover:bg-white/10">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
