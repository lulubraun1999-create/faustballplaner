import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const genders = [
    "Mann",
    "Frau",
    "Divers (spielt Damen)",
    "Divers (spielt Herren)"
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error) setProfile(data);
    setLoading(false);
  }

  async function updateProfile(e) {
    e.preventDefault();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        position: profile.position,
        gender: profile.gender,
        birthday: profile.birthday,
        phone: profile.phone
      })
      .eq("user_id", profile.user_id);

    if (error) alert("Fehler beim Speichern: " + error.message);
    else alert("✅ Profil gespeichert!");
  }

  if (loading) return <div className="bg-black text-white p-6">Lade...</div>;

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Profil bearbeiten</h1>

      <form onSubmit={updateProfile} className="space-y-4">
        <input
          type="text"
          placeholder="Vorname"
          value={profile.first_name || ""}
          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
          className="w-full p-2 bg-gray-800 text-white rounded"
        />
        <input
          type="text"
          placeholder="Nachname"
          value={profile.last_name || ""}
          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
          className="w-full p-2 bg-gray-800 text-white rounded"
        />
        <input
          type="text"
          placeholder="Position"
          value={profile.position || ""}
          onChange={(e) => setProfile({ ...profile, position: e.target.value })}
          className="w-full p-2 bg-gray-800 text-white rounded"
        />
        <select
          value={profile.gender || ""}
          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          className="w-full p-2 bg-gray-800 text-white rounded"
        >
          <option value="">Geschlecht wählen</option>
          {genders.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <input
          type="date"
          value={profile.birthday || ""}
          onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
          className="w-full p-2 bg-gray-800 text-white rounded"
        />
        <input
          type="text"
          placeholder="Telefon"
          value={profile.phone || ""}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          className="w-full p-2 bg-gray-800 text-white rounded"
        />

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
        >
          Speichern
        </button>
      </form>
    </div>
  );
}
