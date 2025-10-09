import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { syncProfileEmailOnce } from "@/lib/syncProfileEmail";

export default function Login(){
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [needConfirm, setNeedConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const [params] = useSearchParams();

  const justConfirmed = params.get("confirmed"); // ?confirmed=1 nach E-Mail-Bestätigung

  async function onSubmit(e){
    e.preventDefault(); setBusy(true); setMsg(""); setNeedConfirm(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);

    if (error) {
      const txt = (error.message || "").toLowerCase();
      if (txt.includes("email not confirmed")) {
        setNeedConfirm(true);
        setMsg("E-Mail ist noch nicht bestätigt.");
      } else {
        setMsg("Login fehlgeschlagen: " + error.message);
      }
      return;
    }

    // Nach erfolgreichem Login Email in profiles spiegeln (Safety-Net)
    try {
  // 1) Serverseitig auth.users -> profiles.email spiegeln
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.rpc("sync_profile_email_now", { uid: user.id });
  }
  // 2) Safety-Net: Client-seitig nachziehen, falls RLS Insert/Update nötig
  await syncProfileEmailOnce();
} catch {}

    nav("/", { replace: true });
  }

  async function resend(){
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    setMsg(error ? ("Konnte E-Mail nicht senden: " + error.message) : "Bestätigungs-E-Mail erneut gesendet.");
  }

  const ic = "w-full border rounded-md px-3 py-2 dark:bg-black dark:text-neutral-100 dark:placeholder-neutral-400 dark:border-neutral-700";

  return (
    <div className="min-h-screen grid place-items-center bg-white dark:bg-neutral-950">
      <form onSubmit={onSubmit} className="w-full max-w-sm border rounded-2xl p-6 dark:border-neutral-800">
        <h1 className="text-xl font-semibold mb-4">Login</h1>
        {justConfirmed && <div className="mb-3 text-sm text-green-600">E-Mail bestätigt. Du kannst dich jetzt anmelden.</div>}
        <input className={ic} type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className={ic + " mt-2"} type="password" placeholder="Passwort" value={pw} onChange={e=>setPw(e.target.value)} />

        <button disabled={busy} className="mt-4 w-full px-4 py-2 rounded-md border bg-black text-white dark:bg-white dark:text-black">
          {busy ? "Anmelden…" : "Anmelden"}
        </button>

        {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

        {needConfirm && (
          <div className="mt-2">
            <button type="button" onClick={resend} className="text-sm underline">
              Bestätigungs-E-Mail erneut senden
            </button>
          </div>
        )}

        <div className="mt-4 text-sm opacity-80">
          Noch kein Konto? <Link to="/auth/register" className="underline">Registrieren</Link>
        </div>
      </form>
    </div>
  );
}
