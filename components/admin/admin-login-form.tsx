"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-navy">Email address</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className="booking-input"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-navy">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          maxLength={128}
          className="booking-input"
        />
      </label>
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800"
        >
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="button button-primary w-full disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in to dashboard"}
      </button>
    </form>
  );
}
