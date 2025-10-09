import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

export default function Invite(){
  const { user, loading } = useAuth();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  useEffect(()=>{
    if (!loading && !user) nav("/auth/login");
  }, [user, loading]);

  async function apply(){
    setMsg("");
    const { error } = await supabase.rpc("apply_invite_code", { p_code: code.trim() });
    if (error) { setMsg(error.message); return; }
    setMsg("Beitritt erfolgreich. Weiter zur Startseite…");
    setTimeout(()=> nav("/"), 800);
  }

  return (
    <div className="max-w-sm mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold">Einladungs-Code</h1>
      <p className="text-sm opacity-80">Gib den Code ein, den du von deinem Team erhalten hast.</p>
      <div className="space-y-2">
        <input className="w-full border rounded px-3 py-2" value={code} onChange={e=>setCode(e.target.value)} placeholder="z. B. TSV-Herren-2025" />
        <button className="border rounded px-3 py-2 w-full" onClick={apply} disabled={!code.trim()}>Code anwenden</button>
        {msg && <div className="text-sm mt-1">{msg}</div>}
      </div>
    </div>
  );
}
