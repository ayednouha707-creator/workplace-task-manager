import { API_BASE } from "./config.js";

export function getToken(){ return localStorage.getItem("token"); }
export function getUser(){ const raw = localStorage.getItem("user"); return raw ? JSON.parse(raw) : null; }
export function setSession({token,user}){ localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(user)); }
export function clearSession(){ localStorage.removeItem("token"); localStorage.removeItem("user"); }

export async function api(path, {method="GET", body} = {}){
  const headers = {"Content-Type":"application/json"};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(()=> ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
