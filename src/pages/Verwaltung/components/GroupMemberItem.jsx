// src/components/GroupMemberItem.jsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Props:
 * - gm: {
 *     id, user_id, role, visible_role, group_id,
 *     profile?: { first_name?, last_name? }
 *   }
 * - currentUserId: string (auth.user.id)
 * - currentUserGlobalRole: string (z.B. "admin"|"trainer"|"betreuer"|"member")
 * - onChanged?: (nextVisibleRole: "trainer"|"spieler") => void
 */

// einfache Hilfen (unabhängig von externen Utils)
function isTrainerRoleGlobal(role) {
  if (!role) return false;
  const r = String(role).toLowerCase();
  return r.includes("admin") || r.includes("trainer");
}

function roleLabelsForGroupMember(role) {
  if (!role) return [];
  const r = String(role).toLowerCase();

  // mehrere Rollen möglich -> in Labels umwandeln
  const labels = [];
  if (r.includes("trainer")) labels.push("Trainer");
  if (r.includes("betreuer")) labels.push("Betreuer");
  if (labels.length === 0) labels.push("Spieler"); // default
  return labels;
}

export default function GroupMemberItem({
  gm,
  currentUserId,
  currentUserGlobalRole,
  onChanged,
}) {
  const name = [gm?.profile?.first_name, gm?.profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const badges = roleLabelsForGroupMember(gm?.role);

  // Darf der Nutzer seine sichtbare Rolle toggeln?
  // Regeln:
  // - es ist sein eigener Eintrag (gm.user_id === currentUserId)
  // - seine Gruppenrolle enthält "trainer"
  // - und seine globale Rolle ist (mind.) Trainer/Admin
  const canToggleVisible =
    gm?.user_id === currentUserId &&
    String(gm?.role ?? "").toLowerCase().includes("trainer") &&
    isTrainerRoleGlobal(currentUserGlobalRole);

  const [saving, setSaving] = useState(false);

  async function toggleVisibleRole() {
    if (!canToggleVisible || saving) return;

    const next = gm?.visible_role === "Trainer" ? "Spieler" : "Trainer";
    try {
      setSaving(true);
      const { error } = await supabase
        .from("group_members")
        .update({ visible_role: next })
        .eq("id", gm.id);

      if (error) throw error;

      if (typeof onChanged === "function") onChanged(next);
    } catch (e) {
      console.error("toggleVisibleRole failed:", e);
      alert(`Konnte Anzeige-Rolle nicht umschalten: ${e.message ?? e}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="font-medium">{name || "Unbekannt"}</div>

      <div className="flex items-center gap-2">
        {badges.map((b) => (
          <span
            key={b}
            className={
              "px-2 py-0.5 rounded-md text-xs border " +
              (b === "Trainer"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : b === "Betreuer"
                ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100")
            }
          >
            {b}
          </span>
        ))}

        {canToggleVisible && (
          <button
            onClick={toggleVisibleRole}
            disabled={saving}
            className="ml-2 px-2 py-1 rounded-md border text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60"
            title="Anzeige-Rolle in dieser Gruppe umschalten"
          >
            Als {gm?.visible_role === "trainer" ? "Spieler" : "Trainer"} anzeigen
          </button>
        )}
      </div>
    </div>
  );
}
