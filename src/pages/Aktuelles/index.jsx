import { useEffect, useState } from "react";
import { listNews } from "@/lib/api/news";
export default function Aktuelles(){
  const [news,setNews]=useState([]);
  useEffect(()=>{ listNews().then(({data})=>setNews(data ?? [])); },[]);
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Aktuelles</h1>
      <ul className="space-y-2">
        {news?.map(n=>(
          <li key={n.id} className="border rounded-md p-3">
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm opacity-70">{n.published_at && new Date(n.published_at).toLocaleString()}</div>
            <p className="mt-1">{n.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
