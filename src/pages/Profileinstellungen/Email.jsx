import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EmailChange(){
  const [a,setA] = useState(""); const [b,setB] = useState("");
  const [msg,setMsg] = useState(""); const [saving,setSaving] = useState(false);
  const ic = "w-full border rounded-md px-3 py-2 dark:bg-black dark:text-neutral-100 dark:placeholder-neutral-400 dark:border-neutral-700";

  async function onSubmit(e){
    e.preventDefault();
    if (!a || a!==b) { setMsg("E-Mails stimmen nicht überein."); return; }
    setSaving(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ email: a });
    setSaving(false);
    setMsg(error ? ("Fehler: " + error.message) : "E-Mail aktualisiert. Bitte Posteingang prüfen.");
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">E-Mail ändern</h2>
      <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
        <input className={ic} placeholder="Neue E-Mail" value={a} onChange={e=>setA(e.target.value)} />
        <input className={ic} placeholder="E-Mail bestätigen" value={b} onChange={e=>setB(e.target.value)} />
        <div className="flex justify-end">
          <button className="px-4 py-2 rounded-md border bg-black text-white dark:bg-white dark:text-black" disabled={saving}>
            {saving ? "Aktualisiere…" : "Aktualisieren"}
          </button>
        </div>
      </form>
      {msg && <div className="text-sm opacity-80">{msg}</div>}
    </div>
  );
}
