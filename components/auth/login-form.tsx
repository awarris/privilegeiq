"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n/config";

export function LoginForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dictionary = getDictionary(locale);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!response.ok) {
      setError(dictionary.login.unable);
      setBusy(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label>
        <span>{dictionary.login.email}</span>
        <input name="email" type="email" autoComplete="username" required placeholder="admin@privilegeiq.dev" />
      </label>
      <label>
        <span>{dictionary.login.password}</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button--primary" type="submit" disabled={busy}>
        {busy ? dictionary.login.signingIn : dictionary.login.signIn}
      </button>
    </form>
  );
}
