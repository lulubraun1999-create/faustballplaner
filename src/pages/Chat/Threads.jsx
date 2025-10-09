import { useEffect, useState } from "react";
import { listGeneralChat, sendGeneralMessage } from "@/lib/api/chat";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
export default function Threads(){
  const [messages,setMessages]=useState([]);
  const [text,setText]=useState("");
  async function refresh(){ const { data } = await listGeneralChat(); setMessages(data ?? []); }
  useEffect(()=>{ refresh(); },[]);
  async function send(){ if(!text.trim()) return; await sendGeneralMessage(text.trim()); setText(""); refresh(); }
  return (
    <div className="space-y-3">
      <div className="border rounded p-3 min-h-[200px]">
        {messages.map(m=>(
          <div key={m.id} className="text-sm py-1">
            <span className="opacity-60">{new Date(m.created_at).toLocaleTimeString()}:</span> {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Nachricht…"/>
        <Button onClick={send}>Senden</Button>
      </div>
    </div>
  );
}
