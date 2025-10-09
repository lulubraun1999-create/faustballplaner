import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const POS_OPTS = ["Abwehr","Zuspiel","Angriff"];

function displayRole(role){
  const r = String(role||"").toLowerCase();
  if (r === "admin" || r === "trainer") return "Trainer, Spieler";
  if (r === "betreuer") return "Betreuer, Spieler";
  return r ? "Spieler" : "—";
}

export default function DataEdit(){
  const [form, setForm] = useState({
    first_name:"", last_name:"", phone:"", city:"", birthdate:"", position:[], role:""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const ic = "w-full border rounded-md px-3 py-2 dark:bg-black dark:text-neutral-100 dark:placeholder-neutral-400 dark:border-neutral-700";

  async function loadProfile() {
    setLoading(true);
    setMsg("");

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) { setMsg("Auth-Fehler: " + userErr.message); setLoading(false); return; }
    if (!user)   { setMsg("Nicht eingeloggt."); setLoading(false); return; }

    // Versuch: Profil abrufen
    let { data, error } = await supabase
      .from("profiles")
      .select("user_id,email,first_name,last_name,phone,city,birthdate,position,role")
      .eq("user_id", user.id)
      .maybeSingle();

    // Falls es noch keins gibt (z.B. alter Account ohne Trigger): nachträglich anlegen
    if (!data && !error) {
      const ins = await supabase
        .from("profiles")
        .insert({ user_id: user.id, email: user.email, role: "spieler" })
        .select("user_id,email,first_name,last_name,phone,city,birthdate,position,role")
        .maybeSingle();
      data = ins.data;
      error = ins.error;
    }

    if (error) {
      // Häufigste RLS-Ursache sichtbar machen
      setMsg("Konnte Profil nicht laden: " + (error.message || JSON.stringify(error)));
      setLoading(false);
      return;
    }

    if (!data) {
      setMsg("Kein Profil gefunden/angelegt.");
      setLoading(false);
      return;
    }

    const pos = Array.isArray(data.position)
      ? data.position
      : (typeof data.position === "string" && data.position ? data.position.split(",").map(s=>s.trim()) : []);

    setForm({
      first_name: data.first_name || "",
      last_name : data.last_name  || "",
      phone     : data.phone      || "",
      city      : data.city       || "",
      birthdate : data.birthdate  || "",
      position  : pos,
      role      : data.role       || ""
    });

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function onChange(e){
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }
  function togglePos(opt){
    setForm(prev => {
      const has = prev.position.includes(opt);
      return { ...prev, position: has ? prev.position.filter(p=>p!==opt) : [...prev.position, opt] };
    });
  }

  async function onSubmit(e){
    e.preventDefault();
    setSaving(true); setMsg("");

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) { setSaving(false); setMsg(userErr ? userErr.message : "Nicht eingeloggt."); return; }

    const payload = {
      first_name: form.first_name,
      last_name : form.last_name,
      phone     : form.phone,
      city      : form.city,
      birthdate : form.birthdate,
      position  : form.position
      // role ist read-only
    };

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) setMsg("Fehler beim Speichern: " + error.message);
    else setMsg("Gespeichert.");
  }

  const roleLabel = displayRole(form.role);

  if (loading) {
    return <div className="opacity-70">Lade Profil…</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Daten ändern</h2>

      {msg && <div className={"text-sm " + (msg.startsWith("Fehler") || msg.startsWith("Konnte") ? "text-red-600" : "opacity-80")}>{msg}</div>}

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm block mb-1">Vorname</label>
          <input className={ic} name="first_name" value={form.first_name} onChange={onChange}/>
        </div>
        <div>
          <label className="text-sm block mb-1">Nachname</label>
          <input className={ic} name="last_name" value={form.last_name} onChange={onChange}/>
        </div>

        <div>
          <label className="text-sm block mb-1">Telefon</label>
          <input className={ic} name="phone" value={form.phone} onChange={onChange}/>
        </div>
        <div>
          <label className="text-sm block mb-1">Wohnort</label>
          <input className={ic} name="city" value={form.city} onChange={onChange}/>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm block mb-2">Position</label>
          <div className="flex flex-wrap gap-2">
            {POS_OPTS.map(opt => {
              const active = form.position.includes(opt);
              return (
                <label key={opt}
                  className={"flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer select-none " +
                             (active
                               ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                               : "hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:border-neutral-700")}
                >
                  <input type="checkbox" className="accent-black dark:accent-white" checked={active} onChange={()=>togglePos(opt)} />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm block mb-1">Geburtstag</label>
          <input type="date" className={ic} name="birthdate" value={form.birthdate || ""} onChange={onChange}/>
        </div>

        <div>
          <label className="text-sm block mb-1">Rolle</label>
          <input className={ic + " bg-neutral-100 dark:bg-neutral-900"} value={roleLabel} disabled />
        </div>

        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md border bg-black text-white dark:bg-white dark:text-black">
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
