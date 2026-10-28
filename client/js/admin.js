import { api, getUser, clearSession } from "./api.js";

const who = document.querySelector("#who");
const msg = document.querySelector("#msg");
const msgTask = document.querySelector("#msgTask");

const allTasksDiv = document.querySelector("#allTasks");
const assignSel = document.querySelector("#t_assign");
const filterEmp = document.querySelector("#filterEmp");
const filterStatus = document.querySelector("#filterStatus");

const cTodo = document.querySelector("#countTodo");
const cProg = document.querySelector("#countProg");
const cDone = document.querySelector("#countDone");

document.querySelector("#logout").addEventListener("click", () => {
  clearSession();
  window.location.href = "./login.html";
});

document.querySelector("#refresh").addEventListener("click", () => loadAll());

document.querySelector("#btnApply").addEventListener("click", () => loadAll());
document.querySelector("#btnClear").addEventListener("click", () => {
  filterEmp.value = "all";
  filterStatus.value = "all";
  loadAll();
});

const user = getUser();
if (!user) window.location.href = "./login.html";
if (user.mustChangePassword) window.location.href = "./change-password.html";
if (user.role !== "admin") window.location.href = "./employee.html";

who.textContent = `${user.firstName} ${user.lastName} (${user.employeeId})`;

function statusBadge(s){
  if (s === "todo") return '<span class="badge orange">To do</span>';
  if (s === "in_progress") return '<span class="badge blue">In progress</span>';
  return '<span class="badge green">Done</span>';
}

function formatDate(d){ try { return new Date(d).toLocaleString(); } catch { return ""; } }

async function loadEmployees(){
  const emps = await api("/users/employees");
  const options = ['<option value="" disabled selected>Select employee</option>']
    .concat(emps.map(u => `<option value="${u.employeeId}">${u.firstName} ${u.lastName} (${u.employeeId})</option>`));
  assignSel.innerHTML = options.join("");

  filterEmp.innerHTML = ['<option value="all">All</option>']
    .concat(emps.map(u => `<option value="${u.employeeId}">${u.firstName} ${u.lastName} (${u.employeeId})</option>`))
    .join("");
}

function computeCounts(tasks){
  const t = tasks.filter(x => x.status === "todo").length;
  const p = tasks.filter(x => x.status === "in_progress").length;
  const d = tasks.filter(x => x.status === "done").length;
  cTodo.textContent = `To do: ${t}`;
  cProg.textContent = `In progress: ${p}`;
  cDone.textContent = `Done: ${d}`;
}

function render(tasks){
  if (!tasks.length){
    allTasksDiv.innerHTML = "<small>No tasks found.</small>";
    return;
  }

  allTasksDiv.innerHTML = tasks.map(t => `
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

      <div style="min-width:260px">
        <small>Assigned to:</small><br/>
        <b>${t.assignedTo?.firstName || ""} ${t.assignedTo?.lastName || ""}</b><br/>
        <small>${t.assignedTo?.employeeId || ""}</small>
      </div>
    </div>
  `).join("");

  // comment send
  document.querySelectorAll("button[data-send]").forEach(btn => {
    btn.addEventListener("click", async () => {
      msg.textContent = "";
      const id = btn.getAttribute("data-send");
      const input = document.querySelector(`input[data-comment="${id}"]`);
      const text = (input?.value || "").trim();
      if (!text) { msg.textContent = "Write a comment first."; return; }
      try{
        await api(`/tasks/${id}/comments`, { method: "POST", body: { text } });
        await loadAll();
      }catch(e){
        msg.textContent = e.message;
      }
    });
  });
}

async function loadAll(){
  msg.textContent = "";
  try{
    const tasks = await api("/tasks/all");

    // apply filters client-side
    const emp = filterEmp.value || "all";
    const st = filterStatus.value || "all";

    const filtered = tasks.filter(t => {
      const okEmp = emp === "all" ? true : (t.assignedTo?.employeeId === emp);
      const okSt = st === "all" ? true : (t.status === st);
      return okEmp && okSt;
    });

    computeCounts(tasks);
    render(filtered);
  }catch(e){
    msg.textContent = e.message;
  }
}

document.querySelector("#btnCreateTask").addEventListener("click", async () => {
  msgTask.textContent = "";
  try{
    const title = document.querySelector("#t_title").value.trim();
    const description = document.querySelector("#t_desc").value.trim();
    const assignedEmployeeId = assignSel.value;

    if (!assignedEmployeeId) { msgTask.textContent = "Select an employee."; return; }
    if (!title) { msgTask.textContent = "Title is required."; return; }

    await api("/tasks", { method: "POST", body: { title, description, assignedEmployeeId } });
    msgTask.textContent = "Task assigned ✅";
    document.querySelector("#t_title").value = "";
    document.querySelector("#t_desc").value = "";
    assignSel.selectedIndex = 0;

    await loadAll();
  }catch(e){
    msgTask.textContent = e.message;
  }
});

(async () => {
  await loadEmployees();
  await loadAll();
})();
