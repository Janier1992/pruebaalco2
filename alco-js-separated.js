// Supabase cliente
import { supabase } from './js/supabase.js'

let user = null;

// --- LOGIN ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('loginError').style.display = 'block';
  } else {
    user = data.user;
    await loadUserProfile();
    showApp();
  }
});

async function loadUserProfile() {
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  document.getElementById('sidebarUserDisplay').textContent = data?.full_name || user.email;
  document.getElementById('sidebarUserRole').textContent = data?.role || 'Usuario';
}

function showApp() {
  document.getElementById('loginContainer').classList.remove('active');
  document.getElementById('mainAppContainer').classList.add('active');
  loadDashboard();
  activateModule('dashboardPrincipalModule');
}

// --- LOGOUT ---
document.getElementById('logoutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.reload();
});

// --- NAVEGACIÓN ---
function activateModule(moduleId) {
  document.querySelectorAll('.module-content').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const target = document.getElementById(moduleId);
  if (target) {
    target.classList.add('active');
    const link = document.querySelector(`[data-module="${moduleId}"]`);
    if (link) link.classList.add('active');
  }
}

// --- DASHBOARD ---
async function loadDashboard() {
  const { count: formCount } = await supabase.from('inspection_forms').select('*', { count: 'exact' });
  const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact' });
  document.getElementById('totalForms').textContent = formCount || 0;
  document.getElementById('totalDocs').textContent = docCount || 0;
}

// --- FORMULARIOS ---
document.getElementById('inspectionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  data.user_id = user.id;

  const { error } = await supabase.from('inspection_forms').insert([data]);
  if (!error) {
    alert('Formulario guardado');
    e.target.reset();
    loadDashboard();
  } else {
    alert('Error al guardar: ' + error.message);
  }
});

// --- BIBLIOTECA ---
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const file = document.getElementById('uploadPdf').files[0];
  if (!file) return alert('Selecciona un archivo');

  const filePath = `${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
  if (uploadError) return alert('Error al subir: ' + uploadError.message);

  await supabase.from('documents').insert([{
    name: file.name,
    type: 'Manual',
    file_path: filePath,
    file_size: file.size,
    uploaded_by: user.id
  }]);

  alert('Documento subido');
  loadDashboard();
});

document.addEventListener('DOMContentLoaded', () => {
  activateModule('dashboardPrincipalModule');
});
