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
        const inspectionData = { inspection_date: document.getElementById('inspectionDate').value, area: document.getElementById('formType').value, inspector_name: document.getElementById('inspectorName').value, product_code: document.getElementById('productCode').value, batch_number: document.getElementById('batchNumber').value, measurement_1: parseFloat(document.getElementById('measurementOne').value) || null, measurement_2: parseFloat(document.getElementById('measurementTwo').value) || null, status: document.getElementById('status').value, defect_type: document.getElementById('defectType').value || null, observations: document.getElementById('observations').value || null, };
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
// (ACTUALIZADO) MÓDULO DE BIBLIOTECA CON FUNCIONALIDAD DE STORAGE
// =================================================================
async function setupLibraryModule() {
    const libraryModule = document.getElementById('bibliotecaModule');
    if (!libraryModule || libraryModule.dataset.initialized === 'true') return;
    console.log("Configurando Biblioteca (modo Supabase con Storage)...");
    libraryModule.dataset.initialized = 'true';

    // Función para renderizar la tabla (actualizada para manejar acciones)
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

        // Asignar eventos a los nuevos botones
        tbody.querySelectorAll('.view-btn').forEach(btn => btn.onclick = handleViewFile);
        tbody.querySelectorAll('.download-btn').forEach(btn => btn.onclick = handleDownloadFile);
        tbody.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = handleDeleteFile);
    }
    
    // Función para obtener y mostrar los documentos
    async function applyFiltersAndSort() {
        const searchTerm = document.getElementById('documentSearch').value.toLowerCase();
        const selectedType = document.getElementById('documentType').value;
        const sortBy = document.getElementById('sortFilesBy').value.split('_');
        try {
            let query = _supabase.from('documents').select('*');
            if (searchTerm) { query = query.ilike('file_name', `%${searchTerm}%`); }
            if (selectedType) { query = query.eq('document_type', selectedType); }
            if (sortBy.length === 2) {
                const [column, direction] = sortBy;
                const columnMap = { name: 'file_name', date: 'uploaded_at', size: 'file_size_kb' };
                if (columnMap[column]) {
                    query = query.order(columnMap[column], { ascending: direction === 'asc' });
                }
            }
            const { data, error } = await query;
            if (error) throw error;
            renderDocumentsTable(data);
        } catch (error) {
            console.error('Error al cargar documentos:', error);
            const tbody = libraryModule.querySelector('.documents-table tbody');
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error al cargar datos.</td></tr>`;
        }
    }

    // --- NUEVAS FUNCIONES DE MANEJO DE ARCHIVOS ---
    async function handleUploadFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const uploadButton = document.getElementById('uploadDocumentBtn');
        uploadButton.disabled = true;
        uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';

        try {
            const user = (await _supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Usuario no autenticado.");

            // 1. Subir el archivo a Supabase Storage
            const filePath = `public/${user.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await _supabase.storage
                .from('documentos_calidad')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Insertar la metadata en la tabla 'documents'
            const documentData = {
                uploaded_by: user.id,
                file_name: file.name,
                document_type: 'Formato', // O puedes pedirlo en un prompt
                file_path: filePath,
                file_size_kb: Math.round(file.size / 1024)
            };
            const { error: insertError } = await _supabase.from('documents').insert([documentData]);

            if (insertError) {
                await _supabase.storage.from('documentos_calidad').remove([filePath]);
                throw insertError;
            }

            alert('¡Archivo subido exitosamente!');
            applyFiltersAndSort(); 

        } catch (error) {
            alert(`Error al subir el archivo: ${error.message}`);
            console.error(error);
        } finally {
            uploadButton.disabled = false;
            uploadButton.innerHTML = '<i class="fas fa-upload"></i> Subir Documento';
            event.target.value = '';
        }
    }

    async function handleViewFile(event) {
        const filePath = event.currentTarget.dataset.path;
        try {
            const { data, error } = await _supabase.storage
                .from('documentos_calidad')
                .createSignedUrl(filePath, 60); 
            
            if (error) throw error;
            
            window.open(data.signedUrl, '_blank');

        } catch (error) {
            alert(`No se pudo obtener la URL para ver el archivo: ${error.message}`);
        }
    }

    async function handleDownloadFile(event) {
        const filePath = event.currentTarget.dataset.path;
        const fileName = event.currentTarget.dataset.name;
        try {
            const { data, error } = await _supabase.storage
                .from('documentos_calidad')
                .download(filePath);

            if (error) throw error;

            const link = document.createElement('a');
            link.href = URL.createObjectURL(data);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            alert(`Error al descargar el archivo: ${error.message}`);
        }
    }

    async function handleDeleteFile(event) {
        const docId = event.currentTarget.dataset.id;
        const filePath = event.currentTarget.dataset.path;

        if (!confirm(`¿Estás seguro de que quieres borrar el documento "${filePath}"? Esta acción es irreversible.`)) {
            return;
        }

        try {
            const { error: storageError } = await _supabase.storage.from('documentos_calidad').remove([filePath]);
            if (storageError) throw storageError;
            
            const { error: dbError } = await _supabase.from('documents').delete().eq('id', docId);
            if (dbError) throw dbError;

            alert('Documento eliminado correctamente.');
            applyFiltersAndSort();

        } catch (error) {
            alert(`Error al eliminar el documento: ${error.message}`);
        }
    }

    // --- ASIGNACIÓN DE EVENTOS ---
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
        uploadButton.onclick = () => fileInput.click();
        fileInput.onchange = handleUploadFile;
    }

    applyFiltersAndSort();
}

// --- El resto del código no necesita cambios ---
function initCharts() { const indicadoresModule = document.getElementById('indicadoresModule'); if (!indicadoresModule || !indicadoresModule.classList.contains('active') || indicadoresModule.dataset.chartsInitialized === 'true') { return; } console.log("Inicializando gráficos..."); const chartsToCreate = [{ id: 'defectsChart', type: 'bar', data: { labels: ['Perfilería', 'Pintura', 'Troquelados', 'Felpa', 'Vidrio', 'Despachos'], datasets: [{ label: '% de Defectos', data: [2.3, 1.7, 3.5, 0.9, 1.2, 0.5], backgroundColor: '#004282', borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'Porcentaje (%)' } } } } }, { id: 'timeChart', type: 'line', data: { labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'], datasets: [{ label: 'Tiempo promedio (min)', data: [12, 15, 10, 9, 11], borderColor: '#0056b3', backgroundColor: 'rgba(0, 86, 179, 0.1)', tension: 0.4, fill: true }] }, options: { scales: { y: { beginAtZero: true } } } }, { id: 'approvalChart', type: 'pie', data: { labels: ['Aprobados', 'Rechazados', 'Pendientes'], datasets: [{ data: [85, 10, 5], backgroundColor: ['#28a745', '#dc3545', '#ffc107'] }] }, options: {} }, { id: 'trendChart', type: 'line', data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'], datasets: [{ label: 'Calidad General', data: [92, 94, 91, 95, 97], borderColor: '#004282', backgroundColor: 'transparent' }, { label: 'Meta', data: [90, 90, 90, 90, 90], borderColor: '#a5a7a8', borderDash: [5, 5], backgroundColor: 'transparent' }] }, options: { scales: { y: { min: 85, max: 100, title: { display: true, text: 'Puntuación (%)' } } } } }]; let chartsCreated = 0; chartsToCreate.forEach(chartConfig => { const ctx = document.getElementById(chartConfig.id)?.getContext('2d'); if (ctx) { new Chart(ctx, { type: chartConfig.type, data: chartConfig.data, options: chartConfig.options }); chartsCreated++; } }); if (chartsCreated > 0) { indicadoresModule.dataset.chartsInitialized = 'true'; console.log(chartsCreated + " gráficos inicializados."); } }

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
