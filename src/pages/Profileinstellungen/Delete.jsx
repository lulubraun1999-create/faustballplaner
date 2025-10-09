import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DeleteAccount(){
  const [msg,setMsg] = useState("");

  async function requestDelete(){
    // Ohne Service-Role-Key kann der Client den User nicht löschen.
    // Sauber: Admin-Flow (Edge Function / Server) oder Support-Kontakt.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Nicht eingeloggt."); return; }
    setMsg("Die Löschung kann nur ein Admin durchführen. Bitte an einen Admin wenden.");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Konto löschen</h2>
      <p className="opacity-80">Zum Schutz kann ein Konto nur vom Administrator endgültig gelöscht werden.</p>
      <div className="flex gap-2">
        <button onClick={requestDelete} className="px-4 py-2 rounded-md border text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
          Löschung anfragen
        </button>
      </div>
      {msg && <div className="text-sm opacity-80 mt-2">{msg}</div>}
    </div>
  );
}
