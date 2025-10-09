


import { Routes, Route } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import Header from "@/components/Header";

// Hauptseiten
import Aktuelles from "@/pages/Aktuelles";
import Chat from "@/pages/Chat";

// Verwaltung
import VerwaltungHome from "@/pages/Verwaltung";
import Gruppen from "@/pages/Verwaltung/Gruppen";
import Mitglieder from "@/pages/Verwaltung/Mitglieder";
import News from "@/pages/Verwaltung/News";
import Umfragen from "@/pages/Verwaltung/Umfragen";
import Termine from "@/pages/Verwaltung/Termine";

// Profil
import ProfileRoot from "@/pages/Profileinstellungen";
import ProfileData from "@/pages/Profileinstellungen/Data";
import ProfileEmail from "@/pages/Profileinstellungen/Email";
import ProfilePassword from "@/pages/Profileinstellungen/Password";
import ProfileDelete from "@/pages/Profileinstellungen/Delete";

// Auth
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";

function AppShell(){
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Aktuelles />} />
          <Route path="/chat" element={<Chat />} />

          <Route path="/verwaltung" element={<VerwaltungHome />} />
          <Route path="/Gruppe bearbeiten" element={<Gruppen />} />
          <Route path="/verwaltung/mitglieder" element={<Mitglieder />} />
          <Route path="/verwaltung/news" element={<News />} />
          <Route path="/verwaltung/umfragen" element={<Umfragen />} />
          <Route path="/verwaltung/termine" element={<Termine />} />

          <Route path="/profil" element={<ProfileRoot />}>
            <Route index element={<ProfileData />} />
            <Route path="email" element={<ProfileEmail />} />
            <Route path="passwort" element={<ProfilePassword />} />
            <Route path="loeschen" element={<ProfileDelete />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default function App(){
  return (
    <Routes>
      {/* Auth-Öffentlich */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      {/* Geschützte App */}
      <Route path="/*" element={
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      } />
    </Routes>
  );

}