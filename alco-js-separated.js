// =================================================================
// PASO 1: CONFIGURACIÓN DE SUPABASE
// =================================================================
// Deberás obtener estas credenciales desde el panel de tu proyecto en Supabase
// Ve a Project Settings > API
const SUPABASE_URL = 'URL_DE_TU_PROYECTO_SUPABASE'; // <-- REEMPLAZA ESTO
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY'; // <-- REEMPLAZA ESTO

// Inicializamos el cliente de Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Initialized');

// =================================================================
// (ELIMINADO) DATOS DE PRUEBA
// =================================================================
// const validUsers = [ ... ]; // Eliminado. Ahora la autenticación la maneja Supabase.
// let documentsData = [ ... ]; // Eliminado. Los datos se cargarán desde la DB.
// =================================================================

let isDesktopSidebarCollapsed = false;
let isMobileSidebarOpen = false;
const SIDEBAR_COLLAPSED_KEY = 'sidebarAlcoDesktopCollapsedState_v3';

// --- (Las funciones de la barra lateral como toggleSidebar, updateSidebarToggleButtonIcon, etc., no necesitan cambios) ---
function updateSidebarToggleButtonIcon() { const toggleBtnIcon = document.getElementById('sidebarToggleBtn').querySelector('i'); if (window.innerWidth <= 768) { toggleBtnIcon.classList.remove('fa-angle-double-left', 'fa-angle-double-right'); if (isMobileSidebarOpen) { toggleBtnIcon.classList.add('fa-times'); document.getElementById('sidebarToggleBtn').title = "Cerrar Menú"; } else { toggleBtnIcon.classList.add('fa-bars'); document.getElementById('sidebarToggleBtn').title = "Abrir Menú"; } } else { toggleBtnIcon.classList.remove('fa-bars', 'fa-times'); if (isDesktopSidebarCollapsed) { toggleBtnIcon.classList.add('fa-angle-double-right'); document.getElementById('sidebarToggleBtn').title = "Expandir Menú"; } else { toggleBtnIcon.classList.add('fa-angle-double-left'); document.getElementById('sidebarToggleBtn').title = "Minimizar Menú"; } } }
function toggleSidebar() { const sidebar = document.getElementById('sidebar'); const appContainer = document.getElementById('mainAppContainer'); if (window.innerWidth <= 768) { isMobileSidebarOpen = !isMobileSidebarOpen; sidebar.classList.toggle('open-mobile', isMobileSidebarOpen); } else { isDesktopSidebarCollapsed = !isDesktopSidebarCollapsed; sidebar.classList.toggle('collapsed', isDesktopSidebarCollapsed); appContainer.classList.toggle('sidebar-collapsed', isDesktopSidebarCollapsed); localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isDesktopSidebarCollapsed.toString()); } updateSidebarToggleButtonIcon(); }
function applyInitialSidebarState() { if (window.innerWidth > 768) { const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY); if (savedState === 'true') { isDesktopSidebarCollapsed = false; toggleSidebar(); } else { isDesktopSidebarCollapsed = true; toggleSidebar(); } } else { document.getElementById('sidebar').classList.remove('open-mobile', 'collapsed'); document.getElementById('mainAppContainer').classList.remove('sidebar-collapsed'); isMobileSidebarOpen = false; updateSidebarToggleButtonIcon(); } }
// --- (Fin de las funciones de la barra lateral) ---

/**
 * =================================================================
 * (ACTUALIZADO) FUNCIÓN DE LOGIN
 * Ahora es una función asíncrona que se comunica con Supabase Auth.
 * =================================================================
 */
async function intentLogin() {
    console.log("Intentando login con Supabase...");
    const usernameInput = document.getElementById('username'); // Asumimos que el usuario ingresa su email aquí
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
        
        // Una vez logueado, obtenemos el perfil del usuario desde nuestra tabla `profiles`
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

/**
 * =================================================================
 * (NUEVA) Carga el perfil del usuario desde la tabla 'profiles'.
 * =================================================================
 */
async function loadUserProfile(userId) {
    try {
        const { data: profile, error } = await _supabase
            .from('profiles')
            .select('username, role')
            .eq('id', userId)
            .single(); // .single() espera un solo resultado

        if (error) throw error;

        if (profile) {
            document.getElementById('sidebarUserDisplay').textContent = profile.username;
            document.querySelector('.sidebar-user-profile .user-role').textContent = profile.role;
            document.getElementById('userAvatarInitial').textContent = profile.username.charAt(0).toUpperCase();
        } else {
             // Fallback si no hay perfil
            document.getElementById('sidebarUserDisplay').textContent = 'Usuario';
            document.querySelector('.sidebar-user-profile .user-role').textContent = 'Rol Desconocido';
        }
    } catch (error) {
        console.error('Error cargando el perfil del usuario:', error);
    }
}


/**
 * =================================================================
 * (ACTUALIZADO) FUNCIÓN DE LOGOUT
 * Ahora usa el método de Supabase para cerrar la sesión.
 * =================================================================
 */
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
    
    // Limpiar campos por seguridad
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    console.log("Sesión cerrada exitosamente.");
}

// La función activateModule no necesita cambios estructurales, funciona como está.
function activateModule(moduleId, isSubmenuLink = false) { console.log("Activando módulo:", moduleId); document.querySelectorAll('.module-content').forEach(moduleEl => { moduleEl.classList.remove('active'); }); const targetModuleElement = document.getElementById(moduleId); if (targetModuleElement) { targetModuleElement.classList.add('active'); const moduleTitleElement = targetModuleElement.querySelector('.content-title, .content-subtitle'); document.title = `Alco Suite - ${moduleTitleElement ? moduleTitleElement.textContent.trim() : moduleId.replace('Module', '')}`; document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => { link.classList.remove('active'); }); const activeLink = document.querySelector(`.sidebar-nav .nav-link[data-module="${moduleId}"]`); if (activeLink) { activeLink.classList.add('active'); const parentLi = activeLink.closest('.nav-item-has-children'); if (parentLi) { parentLi.querySelector('a[data-module-parent]').classList.add('active'); if (!parentLi.classList.contains('open')) parentLi.classList.add('open'); } } if (window.innerWidth <= 768 && isMobileSidebarOpen) { toggleSidebar(); } if (moduleId === 'formulariosModule') setupInspectionForm(); else if (moduleId === 'bibliotecaModule') setupLibraryModule(); else if (moduleId === 'indicadoresModule') initCharts(); } else { console.error("Módulo no encontrado:", moduleId, ". Mostrando Dashboard Principal por defecto."); activateModule('dashboardPrincipalModule'); } }

/**
 * =================================================================
 * (ACTUALIZADO) MÓDULO DE FORMULARIOS
 * El guardado ahora es asíncrono e inserta en la tabla `quality_inspections`.
 * =================================================================
 */
function setupInspectionForm() {
    const inspectionForm = document.getElementById('inspectionForm');
    if (!inspectionForm || inspectionForm.dataset.initialized === 'true') return;
    console.log("Configurando Formularios de Inspección...");
    inspectionForm.dataset.initialized = 'true';

    // El guardado de borrador local puede mantenerse, es una buena funcionalidad.
    const formInputs = inspectionForm.querySelectorAll('input, select, textarea');
    const DRAFT_KEY = 'inspectionFormDraft_v3';
    function saveDraft() { const draftData = {}; formInputs.forEach(input => { if (input.name) draftData[input.name] = input.value; }); localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData)); }
    function loadDraft() { const draft = localStorage.getItem(DRAFT_KEY); if (draft) { if (confirm("Borrador encontrado. ¿Cargar?")) { const draftData = JSON.parse(draft); formInputs.forEach(input => { if (input.name && draftData[input.name] !== undefined) { input.value = draftData[input.name]; } }); console.log('Borrador cargado'); } } }
    function clearDraftAndForm() { localStorage.removeItem(DRAFT_KEY); inspectionForm.reset(); console.log('Borrador y form limpiados'); }
    formInputs.forEach(input => input.addEventListener('input', saveDraft));

    // Lógica de envío del formulario AHORA es asíncrona
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

        // Crear el objeto para insertar en Supabase
        const inspectionData = {
            // inspector_id: (await user).data.user.id, // Esto asocia la inspección al usuario logueado
            inspection_date: document.getElementById('inspectionDate').value,
            area: document.getElementById('formType').value,
            inspector_name: document.getElementById('inspectorName').value, // Podríamos obtenerlo del perfil
            product_code: document.getElementById('productCode').value,
            batch_number: document.getElementById('batchNumber').value,
            measurement_1: parseFloat(document.getElementById('measurementOne').value) || null,
            measurement_2: parseFloat(document.getElementById('measurementTwo').value) || null,
            status: document.getElementById('status').value,
            defect_type: document.getElementById('defectType').value || null,
            observations: document.getElementById('observations').value || null,
        };

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
    
    // (Resto de la lógica del formulario sin cambios...)
    const productCodeInput = document.getElementById('productCode'); if (productCodeInput) { productCodeInput.oninvalid = function () { if (productCodeInput.validity.patternMismatch) { productCodeInput.setCustomValidity('Código: 5-10 alfanuméricos (A-Z, 0-9).'); } else if (productCodeInput.validity.valueMissing) { productCodeInput.setCustomValidity('Campo obligatorio.'); } else { productCodeInput.setCustomValidity(''); } }; productCodeInput.oninput = () => productCodeInput.setCustomValidity(''); } const restoreDraftButton = document.getElementById('restoreDraftButton'); if (restoreDraftButton) restoreDraftButton.onclick = loadDraft; const cancelInspectionFormButton = document.getElementById('cancelInspectionForm'); if (cancelInspectionFormButton) { cancelInspectionFormButton.onclick = () => { if (confirm("¿Cancelar y limpiar formulario?")) { clearDraftAndForm(); } }; } loadDraft();
}


/**
 * =================================================================
 * (ACTUALIZADO) MÓDULO DE BIBLIOTECA
 * Ahora carga los datos desde la tabla `documents` de Supabase.
 * =================================================================
 */
function setupLibraryModule() {
    const libraryModule = document.getElementById('bibliotecaModule');
    if (!libraryModule || libraryModule.dataset.initialized === 'true') return;
    console.log("Configurando Biblioteca (modo Supabase)...");
    libraryModule.dataset.initialized = 'true';

    // Función para renderizar la tabla, ahora es más genérica
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
            // Usamos los nombres de columna de la DB: file_name, document_type, uploaded_at, file_size_kb
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
                </td>`;
            tbody.appendChild(tr);
        });

        // NOTA: La lógica para ver/descargar desde Supabase Storage es diferente.
        // Esto requerirá obtener una URL firmada o pública del archivo.
        tbody.querySelectorAll('.view-btn, .download-btn').forEach(btn => btn.onclick = (e) => {
            alert(`Acción para el archivo: ${e.currentTarget.dataset.path}. \n(Implementación pendiente con Supabase Storage)`);
        });
    }

    // Función principal para obtener datos y aplicar filtros
    async function applyFiltersAndSort() {
        const searchTerm = document.getElementById('documentSearch').value.toLowerCase();
        const selectedType = document.getElementById('documentType').value;
        // ... aquí iría la lógica de filtros de fecha si se implementa en la query ...
        const sortBy = document.getElementById('sortFilesBy').value.split('_'); // ej: ['name', 'asc']

        try {
            let query = _supabase.from('documents').select('*');

            // Aplicar filtros
            if (searchTerm) {
                query = query.ilike('file_name', `%${searchTerm}%`); // ilike es case-insensitive
            }
            if (selectedType) {
                query = query.eq('document_type', selectedType);
            }

            // Aplicar ordenamiento
            if (sortBy.length === 2) {
                const [column, direction] = sortBy;
                // Mapear el nombre del sort a la columna de la DB
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

    // Asignar eventos a los filtros
    ['documentSearch', 'documentType', 'sortFilesBy'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'documentSearch') el.oninput = applyFiltersAndSort;
            else el.onchange = applyFiltersAndSort;
        }
    });

    // Carga inicial de documentos al activar el módulo
    applyFiltersAndSort();
}

// Las funciones initCharts y el listener window.onload permanecen mayormente iguales
function initCharts() { const indicadoresModule = document.getElementById('indicadoresModule'); if (!indicadoresModule || !indicadoresModule.classList.contains('active') || indicadoresModule.dataset.chartsInitialized === 'true') { return; } console.log("Inicializando gráficos..."); const chartsToCreate = [{ id: 'defectsChart', type: 'bar', data: { labels: ['Perfilería', 'Pintura', 'Troquelados', 'Felpa', 'Vidrio', 'Despachos'], datasets: [{ label: '% de Defectos', data: [2.3, 1.7, 3.5, 0.9, 1.2, 0.5], backgroundColor: '#004282', borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'Porcentaje (%)' } } } } }, { id: 'timeChart', type: 'line', data: { labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'], datasets: [{ label: 'Tiempo promedio (min)', data: [12, 15, 10, 9, 11], borderColor: '#0056b3', backgroundColor: 'rgba(0, 86, 179, 0.1)', tension: 0.4, fill: true }] }, options: { scales: { y: { beginAtZero: true } } } }, { id: 'approvalChart', type: 'pie', data: { labels: ['Aprobados', 'Rechazados', 'Pendientes'], datasets: [{ data: [85, 10, 5], backgroundColor: ['#28a745', '#dc3545', '#ffc107'] }] }, options: {} }, { id: 'trendChart', type: 'line', data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'], datasets: [{ label: 'Calidad General', data: [92, 94, 91, 95, 97], borderColor: '#004282', backgroundColor: 'transparent' }, { label: 'Meta', data: [90, 90, 90, 90, 90], borderColor: '#a5a7a8', borderDash: [5, 5], backgroundColor: 'transparent' }] }, options: { scales: { y: { min: 85, max: 100, title: { display: true, text: 'Puntuación (%)' } } } } }]; let chartsCreated = 0; chartsToCreate.forEach(chartConfig => { const ctx = document.getElementById(chartConfig.id)?.getContext('2d'); if (ctx) { new Chart(ctx, { type: chartConfig.type, data: chartConfig.data, options: chartConfig.options }); chartsCreated++; } }); if (chartsCreated > 0) { indicadoresModule.dataset.chartsInitialized = 'true'; console.log(chartsCreated + " gráficos inicializados."); } }

window.onload = function () {
    console.log("Página cargada y lista.");

    // (ACTUALIZADO) onsubmit ahora llama a una función async, no necesita prevenir default aquí
    // ya que se hace dentro de la función `setup...`
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.onsubmit = (e) => { e.preventDefault(); intentLogin(); };

    // El resto de los listeners iniciales están bien
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
