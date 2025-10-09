import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Rolle laden (Trainer/Admin?) direkt aus v_profiles -> fallback profiles */
async function getMyRole() {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return { role: "", isTrainer: false };

    // View zuerst probieren
    let { data, error } = await supabase
      .from("v_profiles")
      .select("role")
      .eq("user_id", uid)
      .maybeSingle();

    // Fallback auf Basistabelle
    if (error?.code === "42P01" || (!data && !error)) {
      const fb = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle();
      data = fb.data;
    }
    const role = (data?.role || "").toLowerCase();
    const isTrainer = role.includes("trainer") || role.includes("admin");
    return { role, isTrainer };
  } catch {
    return { role: "", isTrainer: false };
  }
}

/** Nummernfreundliche Sortierung: U8 < U10 */
function sortByNameNumeric(a, b) {
  const A = String(a?.name ?? "");
  const B = String(b?.name ?? "");
  const na = A.match(/\d+/);
  const nb = B.match(/\d+/);
  if (na && nb) {
    const ia = parseInt(na[0], 10);
    const ib = parseInt(nb[0], 10);
    if (!Number.isNaN(ia) && !Number.isNaN(ib) && ia !== ib) return ia - ib;
  }
  return A.localeCompare(B, "de", { numeric: true, sensitivity: "base" });
}

export default function Gruppen() {
  // Basis-Status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Berechtigungen
  const [isTrainer, setIsTrainer] = useState(false);

  // Daten
  const [rows, setRows] = useState([]); // alle Gruppen
  const [selectedParentId, setSelectedParentId] = useState(""); // gewählte Obergruppe

  // Busy-Flag für Mutationen
  const [busy, setBusy] = useState(false);

  // Modal zum Bearbeiten
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("parent"); // "parent" | "sub"
  const [action, setAction] = useState("add"); // "add" | "rename" | "delete"

  // Felder Obergruppe
  const [parentAddName, setParentAddName] = useState("");
  const [parentRenameId, setParentRenameId] = useState("");
  const [parentRenameNew, setParentRenameNew] = useState("");
  const [parentDeleteId, setParentDeleteId] = useState("");

  // Felder Untergruppe
  const [subParentId, setSubParentId] = useState("");
  const [subAddName, setSubAddName] = useState("");
  const [subRenameId, setSubRenameId] = useState("");
  const [subRenameNew, setSubRenameNew] = useState("");
  const [subDeleteId, setSubDeleteId] = useState("");

  /** Daten laden */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setInfo("");

        const r = await getMyRole();
        setIsTrainer(r.isTrainer);

        const { data, error } = await supabase
          .from("groups")
          .select("id, name, parent_id");
        if (error) throw error;

        const list = (data ?? []).slice();
        setRows(list);

        // erste Obergruppe automatisch auswählen
        const firstParent = list.find((x) => x?.parent_id == null);
        setSelectedParentId(firstParent?.id ?? "");
      } catch (e) {
        setError("Konnte Gruppen nicht laden: " + (e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** Ableitungen */
  const parents = useMemo(
    () => (rows ?? []).filter((r) => r?.parent_id == null).sort(sortByNameNumeric),
    [rows]
  );

  const selectedParent = useMemo(
    () => parents.find((p) => p?.id === selectedParentId) ?? null,
    [parents, selectedParentId]
  );

  const subsOfSelected = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r?.parent_id === selectedParentId)
        .sort(sortByNameNumeric),
    [rows, selectedParentId]
  );

  const subsByParent = useMemo(() => {
    const map = {};
    (rows ?? []).forEach((r) => {
      const pid = r?.parent_id ?? null;
      if (!map[pid]) map[pid] = [];
      map[pid].push(r);
    });
    return map;
  }, [rows]);

  /** Reload helper */
  async function reload() {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name, parent_id");
      if (error) throw error;
      setRows(data ?? []);
    } catch (e) {
      setError(e?.message ?? String(e));
    }
  }

  /** CRUD Obergruppe (nur via Modal-Button, nicht in der Liste) */
  async function addParent() {
    if (!parentAddName.trim()) return setError("Bitte Namen angeben.");
    setBusy(true);
    const { error } = await supabase
      .from("groups")
      .insert({ name: parentAddName.trim(), parent_id: null });
    setBusy(false);
    if (error) return setError(error.message);
    setInfo("Obergruppe angelegt.");
    setParentAddName("");
    await reload();
  }

  async function renameParent() {
    if (!parentRenameId || !parentRenameNew.trim())
      return setError("Bitte Obergruppe und neuen Namen wählen.");
    setBusy(true);
    const { error } = await supabase
      .from("groups")
      .update({ name: parentRenameNew.trim() })
      .eq("id", parentRenameId);
    setBusy(false);
    if (error) return setError(error.message);
    setInfo("Obergruppe umbenannt.");
    setParentRenameId("");
    setParentRenameNew("");
    await reload();
  }

  async function deleteParent() {
    if (!parentDeleteId) return setError("Bitte Obergruppe wählen.");
    if (!confirm("Obergruppe inkl. Untergruppen löschen?")) return;
    setBusy(true);
    const { error: e1 } = await supabase
      .from("groups")
      .delete()
      .eq("parent_id", parentDeleteId);
    if (e1) {
      setBusy(false);
      return setError(e1.message);
    }
    const { error: e2 } = await supabase
      .from("groups")
      .delete()
      .eq("id", parentDeleteId);
    setBusy(false);
    if (e2) return setError(e2.message);
    setInfo("Obergruppe (inkl. Untergruppen) gelöscht.");
    if (selectedParentId === parentDeleteId) setSelectedParentId("");
    setParentDeleteId("");
    await reload();
  }

  /** CRUD Untergruppe (nur via Modal-Button, nicht in der Liste) */
  async function addSub() {
    if (!subParentId || !subAddName.trim())
      return setError("Bitte Obergruppe und Namen angeben.");
    setBusy(true);
    const { error } = await supabase
      .from("groups")
      .insert({ name: subAddName.trim(), parent_id: subParentId });
    setBusy(false);
    if (error) return setError(error.message);
    setInfo("Untergruppe angelegt.");
    setSubAddName("");
    await reload();
  }

  async function renameSub() {
    if (!subRenameId || !subRenameNew.trim())
      return setError("Bitte Untergruppe und neuen Namen wählen.");
    setBusy(true);
    const { error } = await supabase
      .from("groups")
      .update({ name: subRenameNew.trim() })
      .eq("id", subRenameId);
    setBusy(false);
    if (error) return setError(error.message);
    setInfo("Untergruppe umbenannt.");
    setSubRenameId("");
    setSubRenameNew("");
    await reload();
  }

  async function deleteSub() {
    if (!subDeleteId) return setError("Bitte Untergruppe wählen.");
    if (!confirm("Untergruppe wirklich löschen?")) return;
    setBusy(true);
    const { error } = await supabase.from("groups").delete().eq("id", subDeleteId);
    setBusy(false);
    if (error) return setError(error.message);
    setInfo("Untergruppe gelöscht.");
    setSubDeleteId("");
    await reload();
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6 text-neutral-300">Lädt …</div>;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gruppen</h1>
        {isTrainer && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 transition"
          >
            Gruppe bearbeiten
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-red-200">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-3 rounded-md border border-emerald-800 bg-emerald-900/30 px-3 py-2 text-emerald-200">
          {info}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Linke Spalte: Obergruppen */}
        <div className="rounded-lg border border-neutral-800 p-3">
          <div className="mb-3 text-sm text-neutral-400">TSV Bayer Leverkusen</div>
          <ul className="space-y-2">
            {(parents ?? []).map((p) => (
              <li key={p?.id}>
                <button
                  className={
                    "w-full rounded-md px-3 py-2 text-left " +
                    (selectedParentId === p?.id
                      ? "bg-neutral-800"
                      : "hover:bg-neutral-900")
                  }
                  onClick={() => setSelectedParentId(p?.id)}
                >
                  {p?.name}
                </button>
              </li>
            ))}
            {(parents ?? []).length === 0 && (
              <li className="text-neutral-400 text-sm">
                Keine Obergruppen vorhanden.
              </li>
            )}
          </ul>
        </div>

        {/* Rechte Spalte: Untergruppen (ohne Buttons in der Liste) */}
        <div className="rounded-lg border border-neutral-800 p-3">
          <div className="mb-3 text-sm text-neutral-400">
            {selectedParent ? selectedParent.name : "Untergruppen"}
          </div>
          <ul className="space-y-2">
            {(subsOfSelected ?? []).map((s) => (
              <li key={s?.id} className="rounded-md px-3 py-2 bg-neutral-900">
                {s?.name}
              </li>
            ))}
            {selectedParent && (subsOfSelected ?? []).length === 0 && (
              <li className="text-neutral-400 text-sm">Keine Untergruppen.</li>
            )}
            {!selectedParent && (
              <li className="text-neutral-400 text-sm">
                Bitte Obergruppe auswählen.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Modal: Gruppe bearbeiten (nur für Trainer/Admin) */}
      {isOpen && isTrainer && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4">
          <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gruppe bearbeiten</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md px-2 py-1 text-sm hover:bg-neutral-800"
              >
                Schließen
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <select
                value={tab}
                onChange={(e) => setTab(e.target.value)}
                className="rounded-md bg-neutral-900 px-2 py-1"
              >
                <option value="parent">Obergruppe</option>
                <option value="sub">Untergruppe</option>
              </select>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="rounded-md bg-neutral-900 px-2 py-1"
              >
                <option value="add">Hinzufügen</option>
                <option value="rename">Umbenennen</option>
                <option value="delete">Löschen</option>
              </select>
            </div>

            {/* Obergruppe */}
            {tab === "parent" && (
              <div className="space-y-3">
                {action === "add" && (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-md bg-neutral-900 px-3 py-2"
                      placeholder="Name der Obergruppe"
                      value={parentAddName}
                      onChange={(e) => setParentAddName(e.target.value)}
                    />
                    <button
                      onClick={addParent}
                      disabled={busy}
                      className="rounded-md bg-white/10 px-3 py-2 hover:bg-white/20"
                    >
                      Anlegen
                    </button>
                  </div>
                )}

                {action === "rename" && (
                  <div className="flex gap-2">
                    <select
                      className="rounded-md bg-neutral-900 px-2 py-2"
                      value={parentRenameId}
                      onChange={(e) => setParentRenameId(e.target.value)}
                    >
                      <option value="">Obergruppe wählen…</option>
                      {(parents ?? []).map((p) => (
                        <option key={p?.id} value={p?.id}>
                          {p?.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="flex-1 rounded-md bg-neutral-900 px-3 py-2"
                      placeholder="Neuer Name"
                      value={parentRenameNew}
                      onChange={(e) => setParentRenameNew(e.target.value)}
                    />
                    <button
                      onClick={renameParent}
                      disabled={busy}
                      className="rounded-md bg-white/10 px-3 py-2 hover:bg-white/20"
                    >
                      Umbenennen
                    </button>
                  </div>
                )}

                {action === "delete" && (
                  <div className="flex gap-2">
                    <select
                      className="rounded-md bg-neutral-900 px-2 py-2"
                      value={parentDeleteId}
                      onChange={(e) => setParentDeleteId(e.target.value)}
                    >
                      <option value="">Obergruppe wählen…</option>
                      {(parents ?? []).map((p) => (
                        <option key={p?.id} value={p?.id}>
                          {p?.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={deleteParent}
                      disabled={busy}
                      className="rounded-md bg-red-600/80 px-3 py-2 hover:bg-red-600"
                    >
                      Löschen
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Untergruppe */}
            {tab === "sub" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    className="rounded-md bg-neutral-900 px-2 py-2"
                    value={subParentId}
                    onChange={(e) => setSubParentId(e.target.value)}
                  >
                    <option value="">Obergruppe wählen…</option>
                    {(parents ?? []).map((p) => (
                      <option key={p?.id} value={p?.id}>
                        {p?.name}
                      </option>
                    ))}
                  </select>

                  {action === "add" && (
                    <>
                      <input
                        className="flex-1 rounded-md bg-neutral-900 px-3 py-2"
                        placeholder="Name der Untergruppe"
                        value={subAddName}
                        onChange={(e) => setSubAddName(e.target.value)}
                      />
                      <button
                        onClick={addSub}
                        disabled={busy}
                        className="rounded-md bg-white/10 px-3 py-2 hover:bg-white/20"
                      >
                        Anlegen
                      </button>
                    </>
                  )}

                  {action === "rename" && (
                    <>
                      <select
                        className="rounded-md bg-neutral-900 px-2 py-2"
                        value={subRenameId}
                        onChange={(e) => setSubRenameId(e.target.value)}
                      >
                        <option value="">Untergruppe wählen…</option>
                        {(subsByParent[subParentId] ?? []).map((s) => (
                          <option key={s?.id} value={s?.id}>
                            {s?.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="flex-1 rounded-md bg-neutral-900 px-3 py-2"
                        placeholder="Neuer Name"
                        value={subRenameNew}
                        onChange={(e) => setSubRenameNew(e.target.value)}
                      />
                      <button
                        onClick={renameSub}
                        disabled={busy}
                        className="rounded-md bg-white/10 px-3 py-2 hover:bg-white/20"
                      >
                        Umbenennen
                      </button>
                    </>
                  )}

                  {action === "delete" && (
                    <>
                      <select
                        className="rounded-md bg-neutral-900 px-2 py-2"
                        value={subDeleteId}
                        onChange={(e) => setSubDeleteId(e.target.value)}
                      >
                        <option value="">Untergruppe wählen…</option>
                        {(subsByParent[subParentId] ?? []).map((s) => (
                          <option key={s?.id} value={s?.id}>
                            {s?.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={deleteSub}
                        disabled={busy}
                        className="rounded-md bg-red-600/80 px-3 py-2 hover:bg-red-600"
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
