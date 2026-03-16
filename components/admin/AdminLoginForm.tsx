"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError("Credenciales incorrectas.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      void err;
      setError("No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-wide">Iniciar sesión</h1>
        <p className="text-sm text-neutral-400">
          Acceso al panel de gestión de contenido de Nacho Mas Design.
        </p>
      </div>

      {searchParams.get("error") === "forbidden" ? (
        <p className="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Tu usuario no tiene permisos de administrador/editor en `admin_profiles`.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-neutral-300">Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-neutral-300">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>
    </div>
  );
}
