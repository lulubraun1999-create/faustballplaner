import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const INVITE_CODE = "ellaistnett"; // case-insensitive

export default function Register(){
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [pw,        setPw]        = useState("");
  const [code,      setCode]      = useState("");
  const [msg,       setMsg]       = useState("");
  const [busy,      setBusy]      = useState(false);
  const nav = useNavigate();

  function notEmpty(s){ return (s||"").trim().length > 0; }

  async function onSubmit(e){
    e.preventDefault(); setBusy(true); setMsg("");

    if ((code||"").trim().toLowerCase() !== INVITE_CODE){
      setBusy(false); setMsg("Falscher Registrierungscode."); return;
    }
    if (!notEmpty(firstName) || !notEmpty(lastName)){
      setBusy(false); setMsg("Bitte Vorname und Nachname angeben."); return;
    }
    if (!notEmpty(email) || !notEmpty(pw)){
      setBusy(false); setMsg("Bitte E-Mail und Passwort angeben."); return;
    }

    // 1) Account anlegen
    const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/auth/login?confirmed=1` } });
    if (error){ setBusy(false); setMsg(error.message); return; }

    // 2) Wenn es bereits eine Session gibt (Bestätigung aus), können wir Profil updaten
    const { data: sess } = await supabase.auth.getSession();
    if (sess?.session) {
      // Profil-Eintrag wurde durch Trigger erzeugt -> jetzt Namen setzen
      await supabase.from("profiles")
        .update({ first_name: firstName, last_name: lastName })
        .eq("user_id", sess.session.user.id);
      // optional Metadaten am Auth-User
      try { await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } }); } catch {}
      setBusy(false);
      nav("/", { replace: true });
      return;
    }

    // 3) Keine Session => E-Mail-Bestätigung aktiv. Nutzer informieren.
    setBusy(false);
    setMsg("Registrierung erstellt. Bitte E-Mail bestätigen und dann einloggen.");
  }

  const ic = "w-full border rounded-md px-3 py-2 dark:bg-black dark:text-neutral-100 dark:placeholder-neutral-400 dark:border-neutral-700";

  return (
    <div className="min-h-screen grid place-items-center bg-white dark:bg-neutral-950">
      <form onSubmit={onSubmit} className="w-full max-w-sm border rounded-2xl p-6 dark:border-neutral-800">
        <h1 className="text-xl font-semibold mb-4">Registrieren</h1>

        <div className="grid grid-cols-1 gap-2">
          <input className={ic} placeholder="Vorname" value={firstName} onChange={e=>setFirstName(e.target.value)} />
          <input className={ic} placeholder="Nachname" value={lastName} onChange={e=>setLastName(e.target.value)} />
          <input className={ic} type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className={ic} type="password" placeholder="Passwort" value={pw} onChange={e=>setPw(e.target.value)} />
          <input className={ic} placeholder="Registrierungscode" value={code} onChange={e=>setCode(e.target.value)} />
          <p className="text-xs opacity-70">Bitte Code vom Verein eingeben.</p>
        </div>

        <button disabled={busy} className="mt-4 w-full px-4 py-2 rounded-md border bg-black text-white dark:bg-white dark:text-black">
          {busy ? "Erstelle Konto…" : "Konto erstellen"}
        </button>

        {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

        <div className="mt-4 text-sm opacity-80">
          Schon ein Konto? <Link to="/auth/login" className="underline">Login</Link>
        </div>
      </form>
    </div>
  );
}
