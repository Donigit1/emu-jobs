"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

type Role = "STUDENT" | "EMPLOYER";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [role, setRole] = useState<Role>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (role === "STUDENT" && !normalizedEmail.endsWith("@emich.edu")) {
      setError("Student accounts must use an @emich.edu email.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("No user returned from sign up.");

      // Save role in public.user_roles
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role,
      });

      if (roleError) throw roleError;

      // Route to the right next step later
      router.push("/");
    } catch (err: any) {
      setError(err?.message ?? "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 border rounded-xl p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>

        <label className="block space-y-1">
          <span className="text-sm">Account type</span>
          <select
            className="w-full border rounded-md p-2"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="STUDENT">Student (EMU email required)</option>
            <option value="EMPLOYER">Employer</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm">Email</span>
          <input
            className="w-full border rounded-md p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@emich.edu"
            autoComplete="email"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="w-full border rounded-md p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-md bg-black text-white p-2 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Sign up"}
        </button>

        <p className="text-sm">
          Already have an account?{" "}
          <a className="underline" href="/auth/sign-in">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}
