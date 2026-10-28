import { api, getUser, clearSession, setSession } from "./api.js";

const msg = document.querySelector("#msg");
const cur = document.querySelector("#currentPassword");
const nw = document.querySelector("#newPassword");
const cf = document.querySelector("#confirmPassword");

document.querySelector("#logout").addEventListener("click", () => {
  clearSession();
  window.location.href = "./login.html";
});

const user = getUser();
if (!user) window.location.href = "./login.html";

document.querySelector("#btnChange").addEventListener("click", async () => {
  msg.textContent = "";

  if (nw.value.length < 6) { msg.textContent = "New password must be at least 6 characters."; return; }
  if (nw.value !== cf.value) { msg.textContent = "Passwords do not match."; return; }

  try{
    await api("/auth/first-change-password", {
      method: "POST",
      body: { currentPassword: cur.value, newPassword: nw.value }
    });

    // Update local stored user mustChangePassword flag
    const updated = { ...user, mustChangePassword: false };
    localStorage.setItem("user", JSON.stringify(updated));

    if (updated.role === "admin") window.location.href = "./admin.html";
    else window.location.href = "./employee.html";
  }catch(e){
    msg.textContent = e.message;
  }
});
