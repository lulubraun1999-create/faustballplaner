import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const POS_OPTS = ["Abwehr", "Zuspiel", "Angriff"];
const GENDER_OPTS = [
  "Mann",
  "Frau",
  "Divers (spielt Damen)",
  "Divers (spielt Herren)",
];

function displayRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "admin" || r === "trainer") return "Trainer, Spieler";
  if (r === "betreuer") return "Betreuer, Spieler";
  return r ? "Spieler" : "—";
}

export default function ProfileIndex() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    birthdate: "",
    position: [],
    gender: "",
    role: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

  const ic =
    "w-full border rounded-md px-3 py-2 bg-white text-black dark:bg-black dark:text-white dark:placeholder-neutral-400 dark:border-neutral-700";

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true); setMsg("");
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) { setMsg(userErr ? userErr.message : "Nicht eingeloggt."); setLoading(false); return; }

    let { data, error } = await supabase
      .from("profiles")
      .select("user_id,email,first_name,last_name,phone,city,birthdate,position,gender,role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data && !error) {
      const ins = await supabase
        .from("profiles")
        .insert({ user_id: user.id, email: user.email, role: "spieler" })
        .select("user_id,email,first_name,last_name,phone,city,birthdate,position,gender,role")
        .maybeSingle();
      data = ins.data; error = ins.error;
    }
    if (error) { setMsg("Konnte Profil nicht laden: " + error.message); setLoading(false); return; }

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
      gender    : data.gender     || "",
      role      : data.role       || "",
      email     : data.email      || "",
    });
    setLoading(false);
  }

  function onChange(e){ const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); }
  function togglePos(opt){
    setForm(prev => {
      const has = prev.position.includes(opt);
      return { ...prev, position: has ? prev.position.filter(p=>p!==opt) : [...prev.position, opt] };
    });
  }

  async function onSubmit(e){
    e.preventDefault(); setSaving(true); setMsg("");
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      first_name: form.first_name,
      last_name : form.last_name,
      phone     : form.phone,
      city      : form.city,
      birthdate : form.birthdate,
      position  : form.position,
      gender    : form.gender,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
    setSaving(false);
    if (error) setMsg("Fehler beim Speichern: " + error.message); else setMsg("✅ Gespeichert.");
  }

  async function handleDeleteAccount(){
    if (!confirm("Bist du sicher? Diese Aktion ist dauerhaft und kann nicht rückgängig gemacht werden.")) return;
    setDeleting(true);
    try { await supabase.rpc("delete_my_account"); } catch(e) { console.warn(e); }
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const roleLabel = displayRole(form.role);
  if (loading) return <div className="opacity-70">Lade Profil…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT: Menü + Danger Card */}
        <aside className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Menü</h2>

          <a href="/profileinstellungen" className="block border rounded-md px-4 py-3 text-white/90 hover:bg-white/5 border-white/20">
            Daten ändern
          </a>
          <a href="/profileinstellungen/passwort" className="block border rounded-md px-4 py-3 text-white/90 hover:bg-white/5 border-white/20">
            Passwort ändern
          </a>
          <a href="/logout" className="block border rounded-md px-4 py-3 text-white/90 hover:bg-white/5 border-white/20">
            Logout
          </a>

          <div className="border rounded-xl p-4 mt-4 border-white/20 bg-white/5">
            <h3 className="text-lg font-semibold text-white mb-2">Konto löschen</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-3">
              Achtung: Diese Aktion ist dauerhaft und kann nicht rückgängig gemacht werden.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-3 rounded-md disabled:opacity-60"
            >
              {deleting ? "Bitte warten…" : "Konto dauerhaft löschen"}
            </button>
          </div>
        </aside>

        {/* RIGHT: Formular */}
        <main className="md:col-span-2">
          <h1 className="text-2xl font-bold mb-6 text-white">Daten ändern</h1>

          {msg && (
            <div className={"text-sm mb-4 " + (msg.startsWith("Fehler") ? "text-red-400" : "text-white/80")}>
              {msg}
            </div>
          )}

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm block mb-1 text-white">Vorname</label>
              <input className={ic} name="first_name" value={form.first_name} onChange={onChange}/>
            </div>
            <div>
              <label className="text-sm block mb-1 text-white">Nachname</label>
              <input className={ic} name="last_name" value={form.last_name} onChange={onChange}/>
            </div>

            <div>
              <label className="text-sm block mb-1 text-white">Telefon</label>
              <input className={ic} name="phone" value={form.phone} onChange={onChange}/>
            </div>
            <div>
              <label className="text-sm block mb-1 text-white">Wohnort</label>
              <input className={ic} name="city" value={form.city} onChange={onChange}/>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm block mb-2 text-white">Position</label>
              <div className="flex flex-wrap gap-2">
                {POS_OPTS.map(opt => {
                  const active = form.position.includes(opt);
                  return (
                    <label key={opt}
                           className={"flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer select-none " +
                                     (active
                                       ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                       : "hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:border-neutral-700")}>
                      <input type="checkbox" className="accent-black dark:accent-white"
                             checked={active} onChange={()=>togglePos(opt)}/>
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm block mb-1 text-white">Geschlecht</label>
              <select name="gender" className={ic} value={form.gender} onChange={onChange}>
                <option value="">Bitte wählen</option>
                {GENDER_OPTS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1 text-white">Geburtstag</label>
              <input type="date" className={ic} name="birthdate" value={form.birthdate || ""} onChange={onChange}/>
            </div>

            <div>
              <label className="text-sm block mb-1 text-white">Rolle</label>
              <input className={ic + " bg-neutral-100 text-black dark:bg-neutral-900"} value={roleLabel} disabled/>
            </div>

            <div>
              <label className="text-sm block mb-1 text-white">E-Mail</label>
              <input className={ic + " bg-neutral-100 text-black dark:bg-neutral-900"} value={form.email} disabled/>
            </div>

            <div className="md:col-span-2 flex justify-end mt-4">
              <button type="submit" disabled={saving}
                      className="px-6 py-3 rounded-md bg-black text-white hover:bg-gray-800">
                {saving ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
