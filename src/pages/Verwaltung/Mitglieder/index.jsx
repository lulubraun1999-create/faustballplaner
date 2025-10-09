import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient"; // ggf. anpassen: "@/lib/supabaseClient"

export default function Mitglieder() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainerGroupIds, setTrainerGroupIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      await fetchTrainerGroups();
      await fetchMembers();
    })();
  }, []);

  async function fetchTrainerGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("profile_id", user.id)
      .eq("role", "Trainer");
    if (!error && data) {
      setTrainerGroupIds(new Set(data.map(r => r.group_id)));
    }
  }

  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("v_members_with_groups")
      .select("*")
      .order("group_name", { ascending: true })
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true });

    if (error) {
      console.error(error);
      setMembers([]);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  }

  async function deleteMember(profileId, groupId) {
    if (!confirm("Mitglied wirklich aus der Gruppe entfernen?")) return;
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("profile_id", profileId)
      .eq("group_id", groupId);
    if (error) {
      console.error(error);
      alert("Fehler beim Löschen: " + error.message);
    } else {
      fetchMembers();
    }
  }

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Mitgliederverwaltung</h1>

      {loading ? (
        <p>Lade...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr className="bg-gray-800">
              <th className="border border-gray-700 p-2">Gruppe</th>
              <th className="border border-gray-700 p-2">Vorname</th>
              <th className="border border-gray-700 p-2">Nachname</th>
              <th className="border border-gray-700 p-2">Position</th>
              <th className="border border-gray-700 p-2">Rolle</th>
              <th className="border border-gray-700 p-2">Geschlecht</th>
              <th className="border border-gray-700 p-2">Geburtstag</th>
              <th className="border border-gray-700 p-2">Email</th>
              <th className="border border-gray-700 p-2">Telefon</th>
              <th className="border border-gray-700 p-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {(members || []).map((m, idx) => {
              const canDelete = m.group_id ? trainerGroupIds.has(m.group_id) : false;
              const prettyPosition = Array.isArray(m.position) ? m.position.join(", ") : (m.position || "-");
              return (
                <tr key={idx} className="hover:bg-gray-900">
                  <td className="border border-gray-700 p-2">{m.group_name || "—"}</td>
                  <td className="border border-gray-700 p-2">{m.first_name || "—"}</td>
                  <td className="border border-gray-700 p-2">{m.last_name || "—"}</td>
                  <td className="border border-gray-700 p-2">{prettyPosition}</td>
                  <td className="border border-gray-700 p-2">{m.role || "—"}</td>
                  <td className="border border-gray-700 p-2">{m.gender || "—"}</td>
                  <td className="border border-gray-700 p-2">
                    {m.birthday ? new Date(m.birthday).toLocaleDateString() : "—"}
                  </td>
                  <td className="border border-gray-700 p-2">{m.email || "—"}</td>
                  <td className="border border-gray-700 p-2">{m.phone || "—"}</td>
                  <td className="border border-gray-700 p-2">
                    {canDelete ? (
                      <button
                        onClick={() => deleteMember(m.profile_id, m.group_id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Löschen
                      </button>
                    ) : (
                      <span className="text-gray-400">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
