import { api, getUser, clearSession } from "./api.js";

const who = document.querySelector("#who");
const tasksDiv = document.querySelector("#tasks");
const msg = document.querySelector("#msg");

document.querySelector("#logout").addEventListener("click", () => {
  clearSession();
  window.location.href = "./login.html";
});

document.querySelector("#refresh").addEventListener("click", load);

const user = getUser();
if (!user) window.location.href = "./login.html";
if (user.mustChangePassword) window.location.href = "./change-password.html";
if (user.role === "admin") window.location.href = "./admin.html";

who.textContent = `${user.firstName} ${user.lastName} (${user.employeeId})`;

function statusBadge(s){
  if (s === "todo") return '<span class="badge orange">To do</span>';
  if (s === "in_progress") return '<span class="badge blue">In progress</span>';
  return '<span class="badge green">Done</span>';
}

function formatDate(d){
  try { return new Date(d).toLocaleString(); } catch { return ""; }
}

function render(tasks){
  if (!tasks.length){
    tasksDiv.innerHTML = "<small>No tasks assigned yet.</small>";
    return;
  }

  tasksDiv.innerHTML = tasks.map(t => `
    <div class="card task">
      <div style="flex:1">
        <h4>${t.title}</h4>
        <small>${t.description || ""}</small><br/>
        ${statusBadge(t.status)}
        <div class="comments">
          <b>Comments</b>
          ${(t.comments || []).length ? (t.comments.map(c => `
            <div class="comment">
              <div class="meta">
                <small><b>${c.author?.firstName || ""} ${c.author?.lastName || ""}</b> (${c.author?.employeeId || ""})</small>
                <small>${formatDate(c.createdAt)}</small>
              </div>
              <div>${c.text}</div>
            </div>
          `).join("")) : "<small>No comments.</small>"}
          <div style="margin-top:10px" class="row">
            <input placeholder="Write a comment..." data-comment="${t._id}" />
            <button data-send="${t._id}">Send</button>
          </div>
        </div>
      </div>

      <div style="min-width:210px">
        <label><small>Update status</small></label>
        <select data-status="${t._id}">
          <option value="todo" ${t.status==="todo"?"selected":""}>To do</option>
          <option value="in_progress" ${t.status==="in_progress"?"selected":""}>In progress</option>
          <option value="done" ${t.status==="done"?"selected":""}>Done</option>
        </select>
      </div>
    </div>
  `).join("");

  // status changes
  document.querySelectorAll("select[data-status]").forEach(sel => {
    sel.addEventListener("change", async () => {
      msg.textContent = "";
      const id = sel.getAttribute("data-status");
      try{
        await api(`/tasks/${id}/status`, { method: "PATCH", body: { status: sel.value } });
      }catch(e){
        msg.textContent = e.message;
      }
    });
  });

  // send comments
  document.querySelectorAll("button[data-send]").forEach(btn => {
    btn.addEventListener("click", async () => {
      msg.textContent = "";
      const id = btn.getAttribute("data-send");
      const input = document.querySelector(`input[data-comment="${id}"]`);
      const text = (input?.value || "").trim();
      if (!text) { msg.textContent = "Write a comment first."; return; }
      try{
        await api(`/tasks/${id}/comments`, { method: "POST", body: { text } });
        await load();
      }catch(e){
        msg.textContent = e.message;
      }
    });
  });
}

async function load(){
  msg.textContent = "";
  try{
    const tasks = await api("/tasks/mine");
    render(tasks);
  }catch(e){
    msg.textContent = e.message;
  }
}

load();
