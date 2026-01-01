"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function Home() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      setLoading(false);
    })();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
  }

  return (
    <main className="min-h-screen p-10 space-y-6">
      <h1 className="text-3xl font-semibold">EMU Jobs</h1>

      {loading ? (
        <p>Loading...</p>
      ) : email ? (
        <div className="space-y-3">
          <p>Signed in as: <b>{email}</b></p>
          <button className="rounded-md bg-black text-white px-4 py-2" onClick={signOut}>
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p>You are not signed in.</p>
          <a className="underline" href="/auth/sign-in">Sign in</a>
          <br />
          <a className="underline" href="/auth/sign-up">Create account</a>
        </div>
      )}
    </main>
  );
}
