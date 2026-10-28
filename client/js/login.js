import { api, setSession, clearSession } from "./api.js";

const employeeId = document.querySelector("#employeeId");
const password = document.querySelector("#password");
const msg = document.querySelector("#msg");

clearSession(); // optional: clear previous sessions when opening login page

document.querySelector("#btnLogin").addEventListener("click", async () => {
  msg.textContent = "";
  try{
    const data = await api("/auth/login", {
      method: "POST",
      body: { employeeId: employeeId.value.trim(), password: password.value }
    });

    setSession(data);

    // Force first login password change
    if (data.user.mustChangePassword) {
      window.location.href = "./change-password.html";
      return;
    }

    // Redirect by role
    if (data.user.role === "admin") window.location.href = "./admin.html";
    else window.location.href = "./employee.html";
  }catch(e){
    msg.textContent = e.message;
  }
});
