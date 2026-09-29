// 1) أنشئ مشروع Supabase
// 2) شغّل ملف schema.sql داخل SQL Editor
// 3) ضع بيانات مشروعك أدناه (مفتاح anon فقط، وليس service_role)
const SUPABASE_URL = "https://eayaesctpsoyaruabher.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Gl4UYd3rike0LojA7G-LXQ_KULVNqQp";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (s) => document.querySelector(s);
const authView = $("#authView");
const appView = $("#appView");
const authMsg = $("#authMsg");
const loginForm = $("#loginForm");
const patientForm = $("#patientForm");
const patientList = $("#patientList");
const emptyState = $("#emptyState");
const saveState = $("#saveState");
const deleteBtn = $("#deleteBtn");
const searchInput = $("#searchInput");
const tpl = $("#patientCardTpl");

let rows = [];
let saveTimer = null;
let saving = false;

function setSaveState(text, kind="ok"){
  saveState.textContent = text;
  saveState.style.color = kind === "error" ? "#fecaca" : "#bbf7d0";
}

function normalizePhone(phone){
  return (phone || "").replace(/[^\d+]/g,"");
}
function waPhone(phone){
  return (phone || "").replace(/\D/g,"");
}
function escText(v){ return (v || "").trim(); }

async function refreshSession(){
  const { data } = await supabaseClient.auth.getSession();
  renderAuth(data.session);
}
function renderAuth(session){
  const logged = !!session;
  authView.classList.toggle("hidden", logged);
  appView.classList.toggle("hidden", !logged);
  if(logged){
    $("#userLabel").textContent = `${session.user.email} — الحفظ التلقائي مفعّل`;
    loadPatients();
  }
}

loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  authMsg.textContent = "جارٍ تسجيل الدخول...";
  const email = $("#email").value.trim();
  const password = $("#password").value;
  const { error } = await supabaseClient.auth.signInWithPassword({email,password});
  authMsg.textContent = error ? error.message : "";
});

$("#logoutBtn").addEventListener("click", async ()=>{
  await supabaseClient.auth.signOut();
  rows = [];
  patientList.innerHTML = "";
  renderAuth(null);
});

supabaseClient.auth.onAuthStateChange((_event, session)=>renderAuth(session));

async function loadPatients(){
  const { data, error } = await supabaseClient
    .from("patients")
    .select("id,name,complaint,phone,created_at,updated_at")
    .order("updated_at",{ascending:false});
  if(error){ console.error(error); return; }
  rows = data || [];
  renderList();
}

function renderList(){
  const q = searchInput.value.trim().toLowerCase();
  const filtered = rows.filter(r =>
    (r.name || "").toLowerCase().includes(q) ||
    (r.phone || "").toLowerCase().includes(q) ||
    (r.complaint || "").toLowerCase().includes(q)
  );

  patientList.innerHTML = "";
  emptyState.classList.toggle("hidden", filtered.length !== 0);

  filtered.forEach(row=>{
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector(".patient-card");
    node.querySelector(".card-name").textContent = row.name || "بدون اسم";
    node.querySelector(".card-phone").textContent = row.phone || "بدون رقم";
    node.querySelector(".card-complaint").textContent = row.complaint || "";

    node.querySelector(".card-main").addEventListener("click",()=>fillForm(row));

    const call = node.querySelector(".call");
    const phone = normalizePhone(row.phone);
    call.href = phone ? `tel:${phone}` : "#";
    if(!phone) call.style.opacity = ".35";

    const wa = node.querySelector(".whatsapp");
    const wap = waPhone(row.phone);
    wa.href = wap ? `https://wa.me/${wap}` : "#";
    if(!wap) wa.style.opacity = ".35";

    card.dataset.id = row.id;
    patientList.appendChild(node);
  });
}

function fillForm(row){
  $("#recordId").value = row.id;
  $("#patientName").value = row.name || "";
  $("#complaint").value = row.complaint || "";
  $("#phone").value = row.phone || "";
  deleteBtn.classList.remove("hidden");
  setSaveState("تم تحميل السجل");
  window.scrollTo({top:0,behavior:"smooth"});
}

function clearForm(){
  patientForm.reset();
  $("#recordId").value = "";
  deleteBtn.classList.add("hidden");
  setSaveState("جاهز");
}

$("#newBtn").addEventListener("click", clearForm);
searchInput.addEventListener("input", renderList);

["patientName","complaint","phone"].forEach(id=>{
  $("#"+id).addEventListener("input",()=>{
    setSaveState("بانتظار الحفظ...");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(savePatient, 650);
  });
});

async function savePatient(){
  if(saving) return;
  const name = escText($("#patientName").value);
  const complaint = escText($("#complaint").value);
  const phone = escText($("#phone").value);

  // لا ننشئ سجلاً فارغاً تماماً.
  if(!name && !complaint && !phone){
    setSaveState("جاهز");
    return;
  }

  saving = true;
  setSaveState("جارٍ الحفظ...");

  const id = $("#recordId").value;
  const payload = { name, complaint, phone };

  let result;
  if(id){
    result = await supabaseClient
      .from("patients")
      .update(payload)
      .eq("id",id)
      .select()
      .single();
  }else{
    result = await supabaseClient
      .from("patients")
      .insert(payload)
      .select()
      .single();
  }

  saving = false;

  if(result.error){
    console.error(result.error);
    setSaveState("فشل الحفظ", "error");
    return;
  }

  $("#recordId").value = result.data.id;
  deleteBtn.classList.remove("hidden");
  setSaveState("تم الحفظ ✓");

  const idx = rows.findIndex(r=>r.id === result.data.id);
  if(idx >= 0) rows[idx] = result.data;
  else rows.unshift(result.data);
  rows.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));
  renderList();
}

deleteBtn.addEventListener("click", async ()=>{
  const id = $("#recordId").value;
  if(!id) return;
  if(!confirm("هل تريد حذف هذا السجل نهائيًا؟")) return;

  const { error } = await supabaseClient.from("patients").delete().eq("id",id);
  if(error){
    setSaveState("تعذر الحذف","error");
    return;
  }
  rows = rows.filter(r=>r.id !== id);
  clearForm();
  renderList();
});

refreshSession();
