"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

type Profile = {
  full_name: string | null;
  major: string | null;
  graduation_year: string | null;
  resume_path: string | null;
};

export default function StudentProfilePage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    major: "",
    graduation_year: null,
    resume_path: null,
  });

  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/auth/sign-in");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? null);

      const { data: row, error } = await supabase
        .from("student_profiles")
        .select("full_name, major, grad_term, resume_path")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) setErr(error.message);
      if (row) {
        setProfile({
          full_name: row.full_name ?? "",
          major: row.major ?? "",
          graduation_year: row.grad_term ?? null,
          resume_path: row.resume_path ?? null,
        });
      }

      setLoading(false);
    })();
  }, [router, supabase]);

  async function saveProfile() {
    setErr(null);
    setMsg(null);
    if (!userId) return;

    const payload = {
      user_id: userId,
      full_name: profile.full_name?.trim() || null,
      major: profile.major?.trim() || null,
      grad_term: profile.graduation_year || null,
      resume_path: profile.resume_path,
      auth_type: "citizen"
    };

    const { error } = await supabase
      .from("student_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) return setErr(error.message);
    setMsg("Profile saved.");
  }

  async function uploadResume() {
    setErr(null);
    setMsg(null);

    if (!userId) return;
    if (!file) return setErr("Choose a PDF first.");
    if (file.type !== "application/pdf") return setErr("Resume must be a PDF.");

    const filePath = `${userId}/resume.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, { upsert: true, contentType: "application/pdf" });

    if (uploadError) return setErr(uploadError.message);

    setProfile((p) => ({ ...p, resume_path: filePath }));

    const { error: dbError } = await supabase
  .from("student_profiles")
  .upsert(
    {
      user_id: userId,
      full_name: profile.full_name?.trim() || "",     // satisfy NOT NULL
      major: profile.major?.trim() || "",
      grad_term: profile.graduation_year,
      resume_path: filePath,
    },
    { onConflict: "user_id" }
  );
    if (dbError) return setErr(dbError.message);

    setMsg("Resume uploaded.");
    setFile(null);
  }

  async function viewResume() {
    setErr(null);
    setMsg(null);

    if (!profile.resume_path) return setErr("No resume uploaded yet.");

    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(profile.resume_path, 60);

    if (error) return setErr(error.message);

    window.open(data.signedUrl, "_blank");
  }

  if (loading) return <main className="p-10">Loading...</main>;

  return (
    <main className="min-h-screen p-10 space-y-8 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Student Profile</h1>
        {email && <p className="text-sm text-neutral-400">Signed in as: {email}</p>}
      </div>

      <section className="space-y-4 border rounded-xl p-6">
        <h2 className="text-xl font-semibold">Basic info</h2>

        <label className="block space-y-1">
          <span className="text-sm">Full name</span>
          <input
            className="w-full border rounded-md p-2 bg-transparent"
            value={profile.full_name ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm">Major</span>
          <input
            className="w-full border rounded-md p-2 bg-transparent"
            value={profile.major ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, major: e.target.value }))}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm">Graduation year</span>
          <input
            type="text"
            className="w-full border rounded-md p-2 bg-transparent"
            value={profile.graduation_year ?? ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                graduation_year: e.target.value || null,
              }))
            }
            placeholder="e.g., Fall 2026"
          />
        </label>

        <button className="rounded-md bg-black text-white px-4 py-2" onClick={saveProfile}>
          Save profile
        </button>
      </section>

      <section className="space-y-4 border rounded-xl p-6">
        <h2 className="text-xl font-semibold">Resume (PDF)</h2>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div className="flex gap-3 flex-wrap">
          <button className="rounded-md bg-black text-white px-4 py-2" onClick={uploadResume}>
            Upload resume
          </button>

          <button className="rounded-md border px-4 py-2" onClick={viewResume}>
            View resume
          </button>
        </div>

        {profile.resume_path && (
          <p className="text-sm text-neutral-400">Saved as: {profile.resume_path}</p>
        )}
      </section>

      {(err || msg) && (
        <div className="border rounded-xl p-4">
          {err && <p className="text-red-600">{err}</p>}
          {msg && <p className="text-green-600">{msg}</p>}
        </div>
      )}
    </main>
  );
}

