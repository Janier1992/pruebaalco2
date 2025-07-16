// =================================================================
// PASO 1: CONFIGURACIÓN DE SUPABASE
// =================================================================
// Deberás obtener estas credenciales desde el panel de tu proyecto en Supabase
// Ve a Project Settings > API
const SUPABASE_URL = 'https://iflroysfsuoceemyrtqi.supabase.co'; // <-- REEMPLAZA ESTO
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmbHJveXNmc3VvY2VlbXlydHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTE2MDgsImV4cCI6MjA2ODI2NzYwOH0.6EldIeFT-cffbMIwGtQMSkVCRNYBanCTw2eIlK7O-4A'; // <-- REEMPLAZA ESTO

// Inicializamos el cliente de Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Initialized');


let isDesktopSidebarCollapsed = false;
let isMobileSidebarOpen = false;
const SIDEBAR_COLLAPSED_KEY = 'sidebarAlcoDesktopCollapsedState_v3';

// --- Funciones de la barra lateral (sin cambios) ---
function updateSidebarToggleButtonIcon() { const toggleBtnIcon = document.getElementById('sidebarToggleBtn').querySelector('i'); if (window.innerWidth <= 768) { toggleBtnIcon.classList.remove('fa-angle-double-left', 'fa-angle-double-right'); if (isMobileSidebarOpen) { toggleBtnIcon.classList.add('fa-times'); document.getElementById('sidebarToggleBtn').title = "Cerrar Menú"; } else { toggleBtnIcon.classList.add('fa-bars'); document.getElementById('sidebarToggleBtn').title = "Abrir Menú"; } } else { toggleBtnIcon.classList.remove('fa-bars', 'fa-times'); if (isDesktopSidebarCollapsed) { toggleBtnIcon.classList.add('fa-angle-double-right'); document.getElementById('sidebarToggleBtn').title = "Expandir Menú"; } else { toggleBtnIcon.classList.add('fa-angle-double-left'); document.getElementById('sidebarToggleBtn').title = "Minimizar Menú"; } } }
function toggleSidebar() { const sidebar = document.getElementById('sidebar'); const appContainer = document.getElementById('mainAppContainer'); if (window.innerWidth <= 768) { isMobileSidebarOpen = !isMobileSidebarOpen; sidebar.classList.toggle('open-mobile', isMobileSidebarOpen); } else { isDesktopSidebarCollapsed = !isDesktopSidebarCollapsed; sidebar.classList.toggle('collapsed', isDesktopSidebarCollapsed); appContainer.classList.toggle('sidebar-collapsed', isDesktopSidebarCollapsed); localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isDesktopSidebarCollapsed.toString()); } updateSidebarToggleButtonIcon(); }
function applyInitialSidebarState() { if (window.innerWidth > 768) { const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY); if (savedState === 'true') { isDesktopSidebarCollapsed = false; toggleSidebar(); } else { isDesktopSidebarCollapsed = true; toggleSidebar(); } } else { document.getElementById('sidebar').classList.remove('open-mobile', 'collapsed'); document.getElementById('mainAppContainer').classList.remove('sidebar-collapsed'); isMobileSidebarOpen = false; updateSidebarToggleButtonIcon(); } }


async function intentLogin() {
    console.log("Intentando login con Supabase...");
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const email = usernameInput.value;
    const password = passwordInput.value;

    try {
        const { data, error } = await _supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            throw error;
        }

        console.log("Login exitoso para:", data.user.email);
        await loadUserProfile(data.user.id);

        document.getElementById('loginContainer').classList.remove('active');
        document.getElementById('mainAppContainer').classList.add('active');

        usernameInput.value = '';
        passwordInput.value = '';

        applyInitialSidebarState();
        activateModule('dashboardPrincipalModule');

    } catch (error) {
        alert(`Error de autenticación: ${error.message}`);
        console.error("Login fallido:", error);
        passwordInput.value = '';
    }
}

async function loadUserProfile(userId) {
    try {
        const { data: profile, error } = await _supabase
            .from('profiles')
            .select('username, role')
            .eq('id', userId)
            .single();

        if (error) throw error;

        if (profile) {
            document.getElementById('sidebarUserDisplay').textContent = profile.username;
            document.querySelector('.sidebar-user-profile .user-role').textContent = profile.role;
            document.getElementById('userAvatarInitial').textContent = profile.username.charAt(0).toUpperCase();
        } else {
            document.getElementById('sidebarUserDisplay').textContent = 'Usuario';
            document.querySelector('.sidebar-user-profile .user-role').textContent = 'Rol Desconocido';
        }
    } catch (error) {
        console.error('Error cargando el perfil del usuario:', error);
    }
}

async function logout() {
    console.log("Cerrando sesión con Supabase...");
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Hubo un problema al cerrar la sesión.');
        return;
    }
    document.getElementById('mainAppContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.add('active');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    console.log("Sesión cerrada exitosamente.");
}

function activateModule(moduleId, isSubmenuLink = false) { console.log("Activando módulo:", moduleId); document.querySelectorAll('.module-content').forEach(moduleEl => { moduleEl.classList.remove('active'); }); const targetModuleElement = document.getElementById(moduleId); if (targetModuleElement) { targetModuleElement.classList.add('active'); const moduleTitleElement = targetModuleElement.querySelector('.content-title, .content-subtitle'); document.title = `Alco Suite - ${moduleTitleElement ? moduleTitleElement.textContent.trim() : moduleId.replace('Module', '')}`; document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => { link.classList.remove('active'); }); const activeLink = document.querySelector(`.sidebar-nav .nav-link[data-module="${moduleId}"]`); if (activeLink) { activeLink.classList.add('active'); const parentLi = activeLink.closest('.nav-item-has-children'); if (parentLi) { parentLi.querySelector('a[data-module-parent]').classList.add('active'); if (!parentLi.classList.contains('open')) parentLi.classList.add('open'); } } if (window.innerWidth <= 768 && isMobileSidebarOpen) { toggleSidebar(); } if (moduleId === 'formulariosModule') setupInspectionForm(); else if (moduleId === 'bibliotecaModule') setupLibraryModule(); else if (moduleId === 'indicadoresModule') initCharts(); } else { console.error("Módulo no encontrado:", moduleId, ". Mostrando Dashboard Principal por defecto."); activateModule('dashboardPrincipalModule'); } }

function setupInspectionForm() {
    const inspectionForm = document.getElementById('inspectionForm');
    if (!inspectionForm || inspectionForm.dataset.initialized === 'true') return;
    console.log("Configurando Formularios de Inspección...");
    inspectionForm.dataset.initialized = 'true';
    const formInputs = inspectionForm.querySelectorAll('input, select, textarea');
    const DRAFT_KEY = 'inspectionFormDraft_v3';
    function saveDraft() { const draftData = {}; formInputs.forEach(input => { if (input.name) draftData[input.name] = input.value; }); localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData)); }
    function loadDraft() { const draft = localStorage.getItem(DRAFT_KEY); if (draft) { if (confirm("Borrador encontrado. ¿Cargar?")) { const draftData = JSON.parse(draft); formInputs.forEach(input => { if (input.name && draftData[input.name] !== undefined) { input.value = draftData[input.name]; } }); console.log('Borrador cargado'); } } }
    function clearDraftAndForm() { localStorage.removeItem(DRAFT_KEY); inspectionForm.reset(); console.log('Borrador y form limpiados'); }
    formInputs.forEach(input => input.addEventListener('input', saveDraft));
    inspectionForm.onsubmit = async function (e) {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
        const user = _supabase.auth.getUser();
        if (!user) {
            alert("No estás autenticado. Por favor, inicia sesión de nuevo.");
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar';
            return;
        }
        const inspectionData = { inspector_id: (await user).data.user.id, inspection_date: document.getElementById('inspectionDate').value, area: document.getElementById('formType').value, inspector_name: document.getElementById('inspectorName').value, product_code: document.getElementById('productCode').value, batch_number: document.getElementById('batchNumber').value, measurement_1: parseFloat(document.getElementById('measurementOne').value) || null, measurement_2: parseFloat(document.getElementById('measurementTwo').value) || null, status: document.getElementById('status').value, defect_type: document.getElementById('defectType').value || null, observations: document.getElementById('observations').value || null, };
        try {
            const { error } = await _supabase.from('quality_inspections').insert([inspectionData]);
            if (error) throw error;
            alert('Inspección guardada exitosamente en la base de datos.');
            clearDraftAndForm();
        } catch (error) {
            alert(`Error al guardar la inspección: ${error.message}`);
            console.error('Error de inserción:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar';
        }
    };
    const productCodeInput = document.getElementById('productCode'); if (productCodeInput) { productCodeInput.oninvalid = function () { if (productCodeInput.validity.patternMismatch) { productCodeInput.setCustomValidity('Código: 5-10 alfanuméricos (A-Z, 0-9).'); } else if (productCodeInput.validity.valueMissing) { productCodeInput.setCustomValidity('Campo obligatorio.'); } else { productCodeInput.setCustomValidity(''); } }; productCodeInput.oninput = () => productCodeInput.setCustomValidity(''); } const restoreDraftButton = document.getElementById('restoreDraftButton'); if (restoreDraftButton) restoreDraftButton.onclick = loadDraft; const cancelInspectionFormButton = document.getElementById('cancelInspectionForm'); if (cancelInspectionFormButton) { cancelInspectionFormButton.onclick = () => { if (confirm("¿Cancelar y limpiar formulario?")) { clearDraftAndForm(); } }; } loadDraft();
}

// =================================================================
// (ACTUALIZADO) MÓDULO DE BIBLIOTECA CON FUNCIONALIDAD DE STORAGE Y DEPURACIÓN
// =================================================================
async function setupLibraryModule() {
    const libraryModule = document.getElementById('bibliotecaModule');
    if (!libraryModule || libraryModule.dataset.initialized === 'true') return;
    console.log("Configurando Biblioteca (modo Supabase con Storage)...");
    libraryModule.dataset.initialized = 'true';

    function renderDocumentsTable(docsToRender) {
        const tbody = libraryModule.querySelector('.documents-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!docsToRender || docsToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontraron documentos.</td></tr>';
            return;
        }
        docsToRender.forEach(doc => {
            const tr = document.createElement('tr');
            const formattedDate = new Date(doc.uploaded_at).toLocaleDateString();
            const fileSize = doc.file_size_kb ? `${doc.file_size_kb} KB` : 'N/A';

            tr.innerHTML = `
                <td>${doc.file_name}</td>
                <td>${doc.document_type}</td>
                <td>${formattedDate}</td>
                <td>${fileSize}</td>
                <td class="document-actions">
                    <button class="view-btn" data-path="${doc.file_path}"><i class="fas fa-eye"></i> Ver</button>
                    <button class="download-btn" data-path="${doc.file_path}" data-name="${doc.file_name}"><i class="fas fa-download"></i> Descargar</button>
                    <button class="delete-btn" data-id="${doc.id}" data-path="${doc.file_path}"><i class="fas fa-trash"></i> Borrar</button>
                </td>`;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.view-btn').forEach(btn => btn.onclick = handleViewFile);
        tbody.querySelectorAll('.download-btn').forEach(btn => btn.onclick = handleDownloadFile);
        tbody.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = handleDeleteFile);
    }
    
    async function applyFiltersAndSort() {
        // ... (código sin cambios)
    }

    async function handleUploadFile(event) {
        console.log("Función handleUploadFile iniciada. Archivo seleccionado:", event.target.files[0]);
        
        const file = event.target.files[0];
        if (!file) return;

        const uploadButton = document.getElementById('uploadDocumentBtn');
        uploadButton.disabled = true;
        uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';

        try {
            const { data: { user }, error: userError } = await _supabase.auth.getUser();
            if (userError || !user) throw new Error("Usuario no autenticado. Inicia sesión de nuevo.");

            console.log(`Usuario autenticado: ${user.email}. Procediendo a subir archivo.`);

            const filePath = `public/${user.id}/${Date.now()}-${file.name}`;
            console.log(`Intentando subir archivo a Storage en la ruta: ${filePath}`);
            
            const { error: uploadError } = await _supabase.storage
                .from('documentos_calidad')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Error DETALLADO de Supabase Storage:", uploadError);
                throw uploadError;
            }

            console.log("Archivo subido a Storage exitosamente. Insertando metadata en la base de datos...");
            
            const documentData = {
                uploaded_by: user.id,
                file_name: file.name,
                document_type: 'Formato', 
                file_path: filePath,
                file_size_kb: Math.round(file.size / 1024)
            };
            
            const { error: insertError } = await _supabase.from('documents').insert([documentData]);

            if (insertError) {
                console.error("Error DETALLADO de inserción en DB:", insertError);
                await _supabase.storage.from('documentos_calidad').remove([filePath]);
                console.log("Se ha revertido la subida del archivo de Storage debido a un error en la DB.");
                throw insertError;
            }

            alert('¡Archivo subido exitosamente!');
            applyFiltersAndSort(); 

        } catch (error) {
            alert(`Error al subir el archivo: ${error.message}\n\nRevisa la consola de desarrollador (F12) para más detalles.`);
            console.error("FALLO EN EL PROCESO DE SUBIDA:", error);
        } finally {
            uploadButton.disabled = false;
            uploadButton.innerHTML = '<i class="fas fa-upload"></i> Subir Documento';
            event.target.value = '';
        }
    }

    async function handleViewFile(event) { /* ... (código sin cambios) ... */ }
    async function handleDownloadFile(event) { /* ... (código sin cambios) ... */ }
    async function handleDeleteFile(event) { /* ... (código sin cambios) ... */ }
    
    // --- ASIGNACIÓN DE EVENTOS CON DEPURACIÓN ---
    ['documentSearch', 'documentType', 'sortFilesBy'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'documentSearch') el.oninput = applyFiltersAndSort;
            else el.onchange = applyFiltersAndSort;
        }
    });
    
    const uploadButton = document.getElementById('uploadDocumentBtn');
    const fileInput = document.getElementById('documentUploadInput');
    if (uploadButton && fileInput) {
        console.log("Botón y input de archivo encontrados. Asignando eventos de click y change.");
        uploadButton.onclick = () => {
            console.log("¡Click en 'Subir Documento' detectado! Abriendo selector de archivo...");
            fileInput.click();
        };
        fileInput.onchange = handleUploadFile;
    } else {
        console.error("CRÍTICO: No se encontró el botón con id='uploadDocumentBtn' o el input con id='documentUploadInput'. Verifica que los IDs en tu index.html sean correctos.");
    }

    applyFiltersAndSort();
}


// --- El resto del código no necesita cambios ---
function initCharts() { /* ... (código sin cambios) ... */ }

window.onload = function () {
    console.log("Página cargada y lista.");
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.onsubmit = (e) => { e.preventDefault(); intentLogin(); };

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) logoutButton.onclick = logout;
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebarToggleBtn) sidebarToggleBtn.onclick = toggleSidebar;
    const sidebarExpandBtnDesktop = document.getElementById('sidebarExpandBtn');
    if (sidebarExpandBtnDesktop) { sidebarExpandBtnDesktop.onclick = function () { if (window.innerWidth > 768) toggleSidebar(); }; }
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => { link.onclick = function (e) { e.preventDefault(); const moduleId = this.dataset.module; const parentModuleId = this.dataset.moduleParent; if (window.innerWidth > 768 && !document.getElementById('sidebar').classList.contains('collapsed')) { if (!this.closest('.nav-item-has-children.open')) { document.querySelectorAll('.sidebar-nav .nav-item-has-children.open').forEach(openLi => { if (openLi !== this.closest('.nav-item-has-children')) { openLi.classList.remove('open'); } }); } } if (moduleId) { activateModule(moduleId, this.classList.contains('submenu-link')); const parentLi = this.closest('.nav-item-has-children'); if (parentLi && !parentLi.classList.contains('open')) { if (!(window.innerWidth > 768 && document.getElementById('sidebar').classList.contains('collapsed'))) { parentLi.classList.add('open'); } } } else if (parentModuleId) { const parentLi = this.closest('.nav-item-has-children'); if (window.innerWidth > 768 && document.getElementById('sidebar').classList.contains('collapsed')) { toggleSidebar(); if (parentLi) setTimeout(() => parentLi.classList.add('open'), 50); } else { if (parentLi) parentLi.classList.toggle('open'); } } }; });
    document.querySelectorAll('.breadcrumb-link-main-module').forEach(link => { link.onclick = function (e) { e.preventDefault(); const mainModuleId = this.dataset.mainModule; const parentNavLink = document.querySelector(`.nav-link[data-module-parent="${mainModuleId}"]`); if (parentNavLink) { const parentLi = parentNavLink.closest('.nav-item-has-children'); if (parentLi && !parentLi.classList.contains('open')) parentLi.classList.add('open'); const firstSubmenuItem = parentLi.querySelector('.submenu-link'); if (firstSubmenuItem && firstSubmenuItem.dataset.module) { activateModule(firstSubmenuItem.dataset.module, true); } else { console.warn("No se encontró el primer submódulo para:", mainModuleId); } } } });
    window.addEventListener('resize', applyInitialSidebarState);
};
