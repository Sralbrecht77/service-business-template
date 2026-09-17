import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { LogoMark } from "@/components/icons";
import { businessConfig } from "@/lib/business-config";
import { getAdminContext } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: `Admin Login | ${businessConfig.company.name}`,
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  let isAdmin = false;

  try {
    const context = await getAdminContext();
    isAdmin = context.isAdmin;
  } catch {
    // The form shows a configuration error if environment values are missing.
  }

  if (isAdmin) redirect("/admin");

  return (
    <main className="admin-grid min-h-screen bg-navy px-5 py-12 sm:px-8 sm:py-20">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden text-white lg:block">
          <LogoMark className="size-16 text-blue-500" />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
            Private owner portal
          </p>
          <h1 className="mt-5 max-w-lg text-5xl font-extrabold tracking-[-0.05em]">
            Keep every move on track.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Review requests, confirm upcoming jobs, and manage booking status from one secure dashboard.
          </p>
        </div>

        <div className="mx-auto w-full max-w-lg rounded-[2rem] bg-white p-7 shadow-2xl shadow-black/25 sm:p-10 lg:mr-0">
          <div className="flex items-center gap-3 lg:hidden">
            <LogoMark className="size-11 text-blue-600" />
            <div>
              <p className="font-extrabold text-navy">{businessConfig.company.shortName}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Owner portal</p>
            </div>
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-blue-600 lg:mt-0">
            Admin access
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy">Welcome back.</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Sign in with the owner account created in Supabase. There is no public registration.
          </p>
          <AdminLoginForm />
          <a href="/" className="mt-7 block text-center text-sm font-bold text-blue-700 hover:text-blue-500">
            ← Return to website
          </a>
        </div>
      </div>
    </main>
  );
}
