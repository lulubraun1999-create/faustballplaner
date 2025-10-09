import { Outlet } from "react-router-dom";
export default function Chat(){
  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <Outlet/>
    </section>
  );
}
