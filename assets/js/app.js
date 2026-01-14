// Mock Data (fallback si el backend no está disponible)
const MOCK_RECIPES = [
    { id: 1, title: "Tacos de Pollo al Pastor", category: "Comida", time: "25 min", cals: "420", price: 45, img: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&q=80&w=400", ingredients: ["Pollo marinado", "Piña", "Cebolla", "Cilantro", "Tortillas maíz"], prep: "Cocina el pollo en sartén caliente. Calienta las tortillas. Sirve con piña y verdura." },
    { id: 2, title: "Bowl de Atún y Aguacate", category: "Cena", time: "10 min", cals: "350", price: 80, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400", ingredients: ["Medallón de atún", "Arroz jazmín", "Aguacate", "Sesaamo", "Soya"], prep: "Corta el atún en cubos. Sirve sobre arroz caliente. Decora con aguacate y aderezos." },
    { id: 3, title: "Pasta Alfredo con Brócoli", category: "Comida", time: "20 min", cals: "550", price: 55, img: "https://images.unsplash.com/photo-1626844131082-256783844137?auto=format&fit=crop&q=80&w=400", ingredients: ["Pasta Fetuccini", "Crema", "Parmesano", "Brócoli", "Ajo"], prep: "Hierve la pasta. En otra olla haz la salsa con crema y queso. Mezcla todo." },
    { id: 4, title: "Omelette de Espinacas", category: "Desayuno", time: "15 min", cals: "280", price: 35, img: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&q=80&w=400", ingredients: ["Huevos", "Espinaca baby", "Queso panela", "Aceite de oliva"], prep: "Bate los huevos. Sofríe espinacas. Haz el omelette y rellena con queso." },
    { id: 5, title: "Salmón al Horno con Espárragos", category: "Comida", time: "30 min", cals: "480", price: 120, img: "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&q=80&w=400", ingredients: ["Filete de salmón", "Espárragos", "Limón", "Mantequilla"], prep: "Coloca todo en una charola. Hornea a 180°C por 20 minutos." },
    { id: 6, title: "Yogurt con Frutos Rojos", category: "Colación", time: "5 min", cals: "180", price: 25, img: "https://images.unsplash.com/photo-1488477181946-6428a029177b?auto=format&fit=crop&q=80&w=400", ingredients: ["Yogurt Griego", "Fresas", "Blueberries", "Granola", "Miel"], prep: "Sirve el yogurt en un bowl y agrega la fruta y granola encima." },
    { id: 7, title: "Wrap de Pavo y Queso", category: "Cena", time: "10 min", cals: "320", price: 40, img: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=400", ingredients: ["Tortilla harina integral", "Jamón de pavo", "Queso manchego", "Lechuga", "Tomate"], prep: "Calienta la tortilla, agrega ingredientes, enrolla y corta por la mitad." },
    { id: 8, title: "Hot Cakes de Avena", category: "Desayuno", time: "20 min", cals: "400", price: 30, img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&q=80&w=400", ingredients: ["Harina de avena", "Plátano", "Leche almendra", "Huevo", "Canela"], prep: "Licúa todo. Haz los hotcakes en sartén con poco aceite." }
];

// recipes ahora es mutable: se reemplaza por API si responde, o se queda en MOCK
let recipes = MOCK_RECIPES;

// ✅ Evita spam de pedidos por clicks repetidos
let __orderSending = false;


// Guard mínimo: si el módulo de cards no cargó, falla de forma explícita (debug rápido)
function _ensureCardsModule() {
    if (!window.SmartKetRecipes || typeof window.SmartKetRecipes.renderRecipes !== 'function') {
        throw new Error('SmartKetRecipes.renderRecipes no está disponible. Revisa que assets/js/modules/recipes.cards.js esté incluido ANTES de app.js');
    }
}

/* ============================
   ✅ Backend Local (API)
   ============================ */
const API_BASE = "http://127.0.0.1:5050";


/* ============================
   ✅ Ingredientes Meta (Categorías para excluir)
   - Se consume desde /api/ingredients/meta (columnas de Ingredientes.xlsx)
   - Se usa SOLO para UI: agrupar chips en el modal de exclusión
   ============================ */
let __ingredientsMeta = null;             // meta cruda del backend: { "Aguacate": {category:"verduras"} ... }
let __ingredientsCatByKey = {};           // lookup normalizado: { "aguacate": "verduras" ... }
let __ingredientsMetaLoaded = false;

function _normKey(s) {
    // Normaliza: minúsculas + sin acentos + trim + colapsa espacios
    return String(s || "")
        .trim()
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "") // quita acentos
        .replace(/\s+/g, " ");
}

async function loadIngredientsMetaFromApi() {
    try {
        const res = await fetch(`${API_BASE}/api/ingredients/meta`);
        const data = await res.json();

        if (!data || data.ok !== true || typeof data.meta !== "object") {
            console.warn("API meta ingredientes respondió pero no con formato esperado. Se continúa sin meta.");
            __ingredientsMeta = {};
            __ingredientsCatByKey = {};
            __ingredientsMetaLoaded = true;
            return;
        }

        __ingredientsMeta = data.meta || {};
        __ingredientsCatByKey = {};
        Object.keys(__ingredientsMeta).forEach(name => {
            const cat = (__ingredientsMeta[name] && __ingredientsMeta[name].category) ? String(__ingredientsMeta[name].category).trim() : "";
            __ingredientsCatByKey[_normKey(name)] = cat;
        });

        __ingredientsMetaLoaded = true;
    } catch (err) {
        // No romper: si backend no está disponible, el modal funciona sin categorías
        __ingredientsMeta = {};
        __ingredientsCatByKey = {};
        __ingredientsMetaLoaded = true;
    }
}


// --- CATEGORÍAS DE FILTRO (derivadas de hojas del Excel vía recipe.category) ---
// Importante: esto SOLO afecta el panel de filtros.
// Las tarjetas (asignación de horario) siguen con 4 categorías fijas (Desayuno/Comida/Cena/Colación).
let recipeFilterCategories = [];

function _deriveFilterCategoriesFromRecipes(list) {
    const seen = new Set();
    const inOrder = [];
    (list || []).forEach(r => {
        const c = String(r?.category ?? "").trim();
        if (!c) return;
        if (!seen.has(c)) { seen.add(c); inOrder.push(c); }
    });

    // Orden preferido para las 4 categorías base (si existen)
    const preferred = ['Desayuno', 'Comida', 'Cena', 'Colación'];
    const ordered = [];
    preferred.forEach(c => { if (seen.has(c)) ordered.push(c); });
    inOrder.forEach(c => { if (!ordered.includes(c)) ordered.push(c); });

    return ordered;
}

function renderDynamicCategoryFilters() {
    const container = document.getElementById('filter-cats');
    if (!container) return;

    const cats = Array.isArray(recipeFilterCategories) ? recipeFilterCategories : [];
    container.innerHTML = cats.map(cat => {
        const safeVal = String(cat).replace(/"/g, '&quot;');
        return `
            <label class="cursor-pointer">
                <input type="checkbox" name="filter-cat" value="${safeVal}" class="peer sr-only" onchange="applyFilters()">
                <span class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 peer-checked:bg-orange-100 peer-checked:text-orange-600 transition-all">${cat}</span>
            </label>
        `;
    }).join('');
}

function initRecipeCategoryFilters() {
    recipeFilterCategories = _deriveFilterCategoriesFromRecipes(recipes);
    renderDynamicCategoryFilters();
}


function _normalizeRecipeFromApi(r) {
    // Normaliza para que tu UI no truene (time/price/cals/id/types)
    const idStr = String(r?.id ?? "").trim();

    return {
        id: idStr, // mantener string para evitar mismatch
        title: r?.title ?? "",
        category: r?.category ?? "Comida",
        time: r?.time ?? "—",
        cals: (r?.cals == null) ? "—" : String(Math.round(Number(r.cals))),
        price: (r?.price == null) ? 0 : Number(r.price),
        img: r?.img ? `${API_BASE}${r.img}` : "https://via.placeholder.com/400x300?text=SmartKet",
        // ✅ Mantener ingredientes estructurados para cotización (sin afectar la UI)
        ingredients_raw: Array.isArray(r?.ingredients)
            ? r.ingredients.filter(i => i && typeof i === "object").map(i => ({
                name: i?.name ?? "",
                unit: i?.unit ?? "",
                qty: (i?.qty == null) ? null : Number(i.qty),
                forma: i?.forma ?? "",
                proceso: i?.proceso ?? ""
            })).filter(i => i.name)
            : [],
        ingredients: Array.isArray(r?.ingredients)
            ? r.ingredients.map(i => {
                // Si viene como string, lo dejamos
                if (typeof i === "string") return i;

                // Si viene como objeto {name, qty, unit, forma, proceso}
                const name = i?.name ?? "";
                const qty = (i?.qty == null) ? "" : String(i.qty);
                const unit = i?.unit ?? "";
                const forma = i?.forma ? `, ${i.forma}` : "";
                const proc = i?.proceso ? `, ${i.proceso}` : "";
                return `${name}${qty ? ` (${qty} ${unit})` : ""}${forma}${proc}`.trim();
            })
            : [],
        prep: r?.prep ?? ""
    };
}

async function loadRecipesFromApi() {
    try {
        const res = await fetch(`${API_BASE}/api/recipes`);
        const data = await res.json();

        if (!data || data.ok !== true || !Array.isArray(data.recipes)) {
            console.warn("API respondió pero no con formato esperado. Se usa MOCK.");
            recipes = MOCK_RECIPES;
            return;
        }

        recipes = data.recipes.map(_normalizeRecipeFromApi);
        console.log(`Recetas cargadas desde API: ${recipes.length}`);
    } catch (err) {
        console.warn("No se pudo cargar API. Se usa MOCK.", err);
        recipes = MOCK_RECIPES;
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    if (window.SmartKetFilters && typeof window.SmartKetFilters.init === 'function') window.SmartKetFilters.init();
    generateCalendarDates(); // Generar dias desde MAÑANA

    // Init Plan
    dynamicDays.forEach((_, i) => plan[i] = []);

    _ensureCardsModule();

    // ✅ Nuevo: cargar desde backend (o fallback al mock)
    await loadRecipesFromApi();

    // ✅ Meta de ingredientes (categorías desde Ingredientes.xlsx)
    await loadIngredientsMetaFromApi();

    initRecipeCategoryFilters();

    SmartKetRecipes.renderRecipes(recipes);
    renderCalendarDays();
    updateDayView();
    updateRangeLabels();

    // ✅ Home: imágenes explicativas (misma estrategia que recetas: /api/images/<id>)
    initHomeExplanationImages();
    // ✅ Sincroniza vista + nav al cargar
    router('inicio');
});

// --- HOME: IMÁGENES EXPLICATIVAS ---
function initHomeExplanationImages() {
    const map = [
        { elId: 'home-exp-img-1', key: 'Imagen01Explicacion' },
        { elId: 'home-exp-img-2', key: 'Imagen02Explicacion' },
        { elId: 'home-exp-img-3', key: 'Imagen03Explicacion' },
    ];

    map.forEach(({ elId, key }) => {
        const el = document.getElementById(elId);
        if (!el) return;
        el.src = `${API_BASE}/api/images/${encodeURIComponent(key)}`;
    });
}

// --- LÓGICA DE FECHAS ---
function generateCalendarDates() {
    dynamicDays = [];
    const today = new Date();

    // Empezar desde MAÑANA (i=1) para respetar la restricción
    for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);

        const dayName = daysOfWeek[nextDate.getDay()];
        const dayNum = nextDate.getDate();
        const monthName = months[nextDate.getMonth()];

        dynamicDays.push({
            dayName: dayName,
            dateStr: `${dayNum} ${monthName}`,
            fullDate: nextDate,
            isTomorrow: i === 1
        });
    }
}

// --- UI HELPERS ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    document.getElementById('toast-text').innerText = message;
    container.classList.add('visible');
    setTimeout(() => container.classList.remove('visible'), 3000);
}

function router(viewId) {
    const views = (window.SmartKetNav && Array.isArray(window.SmartKetNav.VIEWS))
        ? window.SmartKetNav.VIEWS
        : ['inicio', 'plan', 'pedido'];

    // 1) Mostrar / ocultar vistas (a prueba de nulls)
    views.forEach(id => {
        const viewEl = document.getElementById(`view-${id}`);
        if (!viewEl) return;
        viewEl.classList.add('hidden');
    });

    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.remove('hidden');

    // 2) Nav activo (delegado al módulo)
    if (window.SmartKetNav && typeof window.SmartKetNav.setActiveNav === 'function') {
        window.SmartKetNav.setActiveNav(viewId);
    } else {
        // Fallback mínimo por si el módulo no cargó
        views.forEach(id => {
            const btn = document.getElementById(`nav-${id}`);
            if (!btn) return;
            btn.classList.toggle('active', id === viewId);
        });
    }

    // 3) Hooks existentes
    if (viewId === 'pedido') {
        renderOrderSummary();
        renderExcludedSummary();
    }
}

// ================================
// ✅ NUEVO: Delivery por ítem (solo para Desayuno de Mañana cuando ya es tarde)
// ================================
function getItemDeliveryMethod(dayIndex, item, globalDeliveryType, isLate) {
    // Si el usuario eligió globalmente Recolección, TODO es Recolección.
    if (globalDeliveryType === 'Recolección') return 'Recolección';

    // Si es tarde y es mañana (idx 0) y es Desayuno, FORZAR Recolección solo para ese desayuno.
    if (isLate && dayIndex === 0 && item.assignedMeal === 'Desayuno') return 'Recolección';

    // En cualquier otro caso, respeta el global (normalmente Domicilio)
    return globalDeliveryType;
}

function hasMixedDelivery(globalDeliveryType, isLate) {
    // Mixto solo puede ocurrir cuando global = Domicilio y existe desayuno mañana y es tarde
    if (globalDeliveryType !== 'Domicilio') return false;
    const hasBreakfastTomorrow = plan[0] && plan[0].some(r => r.assignedMeal === 'Desayuno');
    return !!(isLate && hasBreakfastTomorrow);
}

// --- RENDERIZADO CALENDARIO ---
function renderCalendarDays() {
    const container = document.getElementById('calendar-days');
    container.innerHTML = '';

    dynamicDays.forEach((dayObj, index) => {
        const btn = document.createElement('button');
        let classes = "day-selector flex-none w-14 h-16 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-0.5 bg-white text-slate-500 font-bold text-xs";

        if (index === selectedDayIndex) {
            classes += " selected shadow-lg shadow-orange-100";
        }
        else if (plan[index] && plan[index].length > 0) {
            classes += " has-items";
        }

        btn.className = classes;
        btn.innerHTML = `
            <span class="text-sm">${dayObj.dayName}</span>
            <span class="text-[9px] opacity-70 font-normal uppercase tracking-wider">${dayObj.dateStr}</span>
            <span class="text-[9px] bg-slate-100 px-1 rounded-full mt-0.5">${plan[index] ? plan[index].length : 0}</span>
        `;
        btn.onclick = () => selectDay(index);
        container.appendChild(btn);
    });
}

function selectDay(index) {
    selectedDayIndex = index;
    renderCalendarDays();
    updateDayView();
}

function updateDayView() {
    const dayObj = dynamicDays[selectedDayIndex];
    document.getElementById('selected-day-title').innerText = `${dayObj.dayName} ${dayObj.dateStr}`;

    const list = document.getElementById('day-meals-list');
    const currentRecipes = plan[selectedDayIndex] || [];

    document.getElementById('meal-count-badge').innerText = `${currentRecipes.length} recetas`;

    if (currentRecipes.length === 0) {
        list.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <i class="fa-regular fa-calendar-plus text-3xl mb-2 opacity-50"></i>
                <p class="text-sm font-medium">Planifica para el ${dayObj.dayName}.</p>
                <p class="text-xs mt-1">Elige una categoría (según tus hojas del Excel).</p>
            </div>`;
        return;
    }

    list.innerHTML = '';
    const order = {};
    (Array.isArray(categories) ? categories : []).forEach((c, i) => order[c] = i + 1);
    currentRecipes.sort((a, b) => (order[a.assignedMeal] || 999) - (order[b.assignedMeal] || 999));

    currentRecipes.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = "flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-lg shadow-sm animate-pop group";

        let badgeColor = "bg-slate-100 text-slate-500";
        if (item.assignedMeal === 'Desayuno') badgeColor = "bg-yellow-50 text-yellow-600";
        if (item.assignedMeal === 'Comida') badgeColor = "bg-orange-50 text-orange-600";
        if (item.assignedMeal === 'Cena') badgeColor = "bg-indigo-50 text-indigo-600";

        row.innerHTML = `
            <img src="${item.img}" class="w-10 h-10 rounded-md object-cover bg-gray-200">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeColor}">${item.assignedMeal}</span>
                    <span class="text-[9px] font-bold text-slate-400"><i class="fa-solid fa-user"></i> ${item.portions}</span>
                </div>
                <p class="text-xs font-bold text-slate-800 truncate">${item.title}</p>
            </div>
            <button onclick="removeRecipe(${idx})" class="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                <i class="fa-solid fa-times text-xs"></i>
            </button>
        `;
        list.appendChild(row);
    });
}

// --- ORDER SUMMARY LOGIC (✅ Ahora: desayuno mañana se fuerza a Recolección sin afectar lo demás) ---
function renderOrderSummary() {
    const container = document.getElementById('order-summary-list');
    const totalRecipes = Object.values(plan).flat().length;
    const btnSend = document.getElementById('btn-send-whatsapp');
    const alertBox = document.getElementById('late-order-alert');

    // 1. Obtener Hora Actual
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const isLate = currentHour >= 20; // Corte a las 8:00 PM (20:00)

    document.getElementById('current-time-display').innerText = `${currentHour}:${currentMinutes < 10 ? '0' + currentMinutes : currentMinutes}`;

    // 2. Checar tipo de entrega global
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const isDelivery = deliveryType === 'Domicilio';

    if (totalRecipes === 0) {
        container.innerHTML = `<div class="text-center py-6 text-slate-400">Tu canasta está vacía</div>`;
        btnSend.disabled = true;
        btnSend.classList.add('opacity-50', 'cursor-not-allowed');
        alertBox.classList.add('hidden');
        return;
    }

    btnSend.disabled = false;
    btnSend.classList.remove('opacity-50', 'cursor-not-allowed');

    // 3. Detectar si hay Desayuno para MAÑANA (Index 0 en nuestro plan dinámico)
    const hasBreakfastTomorrow = plan[0] && plan[0].some(r => r.assignedMeal === 'Desayuno');

    // Mostrar/Ocultar Alerta (solo si es tarde + Domicilio + hay desayuno mañana)
    if (isLate && isDelivery && hasBreakfastTomorrow) {
        alertBox.classList.remove('hidden');
    } else {
        alertBox.classList.add('hidden');
    }

    let html = '';
    const mealOrder = (Array.isArray(categories) && categories.length) ? categories : ['Desayuno', 'Comida', 'Cena', 'Colación'];

    dynamicDays.forEach((dayObj, idx) => {
        if (plan[idx] && plan[idx].length > 0) {
            html += `<div class="border-b border-slate-200 pb-4 last:border-0 last:pb-0">`;
            html += `<h5 class="font-bold text-slate-800 text-sm mb-3 bg-slate-100 py-1 px-3 rounded-lg inline-block">${dayObj.dayName} ${dayObj.dateStr}</h5>`;

            mealOrder.forEach(mealType => {
                const items = plan[idx].filter(r => r.assignedMeal === mealType);
                if (items.length > 0) {

                    // ✅ NUEVO: Solo en "Mañana + Desayuno + Tarde + Domicilio" se fuerza Recolección para esos ítems
                    const isForcedPickupBreakfast = (idx === 0 && mealType === 'Desayuno' && isLate && isDelivery);
                    const forcedTag = isForcedPickupBreakfast
                        ? `<span class="text-[9px] text-green-700 font-bold ml-2 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Solo Recolección</span>`
                        : ``;

                    html += `
                        <div class="mb-3 last:mb-0 pl-2 border-l-2 ${isForcedPickupBreakfast ? 'border-red-200' : 'border-slate-100'}">
                            <h6 class="text-[10px] font-bold ${isForcedPickupBreakfast ? 'text-red-400' : 'text-orange-500'} uppercase tracking-wider mb-1">${mealType} ${forcedTag}</h6>
                            <div class="flex flex-col gap-1">
                                ${items.map(r => {
                        const itemDelivery = getItemDeliveryMethod(idx, r, deliveryType, isLate);
                        const showItemDelivery = (itemDelivery !== deliveryType);
                        const itemDeliveryBadge = showItemDelivery
                            ? `<span class="ml-2 text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">Reco</span>`
                            : ``;

                        return `
                                        <div class="flex justify-between items-start text-xs text-slate-600">
                                            <span class="font-medium flex items-center">
                                                ${r.title}
                                                ${itemDeliveryBadge}
                                            </span>
                                            <span class="text-slate-400 text-[10px] whitespace-nowrap ml-2">${r.portions} prs</span>
                                        </div>
                                    `;
                    }).join('')}
                            </div>
                        </div>
                    `;
                }
            });

            html += `</div>`;
        }
    });

    container.innerHTML = html;

    // ✅ Cotización vendible
    renderOrderQuotePreserveScroll();

}


// ============================
// ✅ Quote: selector de opción/marca (Iteración #2)
// ============================
function _escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _escapeAttr(str) {
    // Para atributos HTML (data-*)
    return _escapeHtml(str);
}

function _safeOfferIndex(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
}

function _getOfferOverridesPayload() {
    if (typeof getOfferOverrides !== 'function') return {};
    const raw = getOfferOverrides() || {};
    const clean = {};
    Object.keys(raw).forEach(k => {
        const key = String(k || '').trim();
        if (!key) return;
        const idx = _safeOfferIndex(raw[k]);
        if (idx === null) return;
        clean[key] = idx;
    });
    return clean;
}

function _formatOfferLabel(off, idx) {
    // Label corto, claro (sin saturar UI)
    const brand = (off && off.brand) ? String(off.brand).trim() : '';
    const pres = (off && off.presentation) ? String(off.presentation).trim() : '';
    const qty = (off && off.qty != null) ? String(off.qty).trim() : '';
    const unit = (off && off.unit) ? String(off.unit).trim() : '';
    const place = (off && off.place) ? String(off.place).trim() : '';

    let label = brand || `Opción ${idx + 1}`;
    if (pres) label += ` · ${pres}`;
    if (qty && unit) label += ` · ${qty} ${unit}`;
    if (place) label += ` · ${place}`;
    return label;
}

function _renderOfferSelector(it) {
    const offers = Array.isArray(it?.offers) ? it.offers : [];
    if (offers.length <= 1) return '';

    const ing = String(it?.ingredient ?? '').trim();
    if (!ing) return '';

    // Preferimos: selected_offer_index (backend) > override guardado (frontend) > 0
    let selected = _safeOfferIndex(it?.selected_offer_index);
    if (selected === null && typeof getOfferOverride === 'function') {
        selected = _safeOfferIndex(getOfferOverride(ing));
    }
    if (selected === null) selected = 0;

    const opts = offers.map((off, i) => {
        const label = _formatOfferLabel(off, i);
        const sel = (i === selected) ? 'selected' : '';
        return `<option value="${i}" ${sel}>${_escapeHtml(label)}</option>`;
    }).join('');

    return `
        <div class="mt-2">
            <label class="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Opción</label>
            <select data-offer-select="1" data-ingredient="${_escapeAttr(ing)}"
                class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200">
                ${opts}
            </select>
        </div>
    `;
}

/* ==========================================================
   ✅ FIX "salto feo" al cambiar marca/opción
   - Cuando se cambia el select, se recotiza (renderOrderQuote)
   - Pero renderOrderQuote re-renderiza el HTML y eso puede:
       - resetear scroll del contenedor
       - mover el scroll de la página (jump visual)
   - Solución: envolver la recotización guardando/restaurando scroll.
   ========================================================== */
function renderOrderQuotePreserveScroll(anchorIngredient) {
    // Guardar scroll de página (o del scroller principal)
    const scroller = document.scrollingElement || document.documentElement;
    const pageTop = scroller ? scroller.scrollTop : (window.scrollY || 0);

    // Guardar scroll del contenedor de items (si es scrollable)
    const itemsEl = document.getElementById('quote-items');
    const itemsTop = itemsEl ? itemsEl.scrollTop : 0;

    // Ejecutar cotización normal y restaurar scroll en el siguiente frame
    return Promise.resolve()
        .then(() => renderOrderQuote())
        .then(() => {
            requestAnimationFrame(() => {
                try {
                    if (itemsEl) itemsEl.scrollTop = itemsTop;
                    if (scroller) scroller.scrollTop = pageTop;
                    else window.scrollTo(0, pageTop);
                } catch (_) { }

                // Extra (suave): si el navegador movió el foco raro, lo dejamos,
                // pero NO hacemos scrollIntoView para no forzar otro salto.
                // anchorIngredient se deja por si luego quieres extender esta lógica.
                void anchorIngredient;
            });
        });
}

function _bindOfferSelectors(containerEl) {
    if (!containerEl) return;
    const sels = containerEl.querySelectorAll('select[data-offer-select="1"]');
    sels.forEach(sel => {
        sel.addEventListener('change', () => {
            const ing = sel.getAttribute('data-ingredient') || '';
            const idx = _safeOfferIndex(sel.value);
            if (idx === null) return;

            if (typeof setOfferOverride === 'function') {
                setOfferOverride(ing, idx);
            } else {
                // fallback (no debería pasar)
                window.offerOverrides = window.offerOverrides || {};
                window.offerOverrides[ing] = idx;
            }
            // ✅ Recotiza SIN salto feo
            renderOrderQuotePreserveScroll(ing);
        });
    });
}

async function renderOrderQuote() {
    const statusEl = document.getElementById('quote-status');
    const totalEl = document.getElementById('quote-total');
    const itemsEl = document.getElementById('quote-items');
    const issuesEl = document.getElementById('quote-issues');

    // Si la vista actual no tiene contenedor (por ejemplo, aún no estás en Finalizar Pedido), no hacemos nada.
    if (!statusEl || !totalEl || !itemsEl || !issuesEl) return;

    const fmtMoney = (n) => {
        const num = Number(n || 0);
        return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    try {
        // ✅ Anti-jump: NO vaciar el contenedor antes del fetch (evita flash/reflow).
        // Congela la altura actual para que el layout no "brinque" mientras llega la nueva cotización.
        statusEl.textContent = 'Calculando...';

        const __prevMinHeight = itemsEl.style.minHeight;
        const __freezeH = itemsEl.offsetHeight;
        if (__freezeH) itemsEl.style.minHeight = `${__freezeH}px`;
        itemsEl.classList.add('sk-quote-loading');

        // Mantén el total y el desglose visible hasta que llegue la respuesta (actualización "en vivo" sin salto).
        issuesEl.classList.add('hidden');
        issuesEl.textContent = '';

        // Construir payload en formato que espera el backend: { plan: [ [ {id,title,portions,ingredients:[{name,unit,qty}]} ] ] }
        const planPayload = dynamicDays.map((_, dayIdx) => {
            const dayItems = Array.isArray(plan?.[dayIdx]) ? plan[dayIdx] : [];
            return dayItems.map(item => {
                const raw = Array.isArray(item?.ingredients_raw) ? item.ingredients_raw : [];

                // Aplicar exclusiones (si existen)
                const filtered = raw.filter(ing => {
                    const name = String(ing?.name ?? '').trim();
                    if (!name) return false;
                    return !(excludedIngredients && excludedIngredients.has(name));
                });

                return {
                    id: String(item?.id ?? ''),
                    title: item?.title ?? '',
                    portions: Number(item?.portions ?? 1),
                    ingredients: filtered
                };
            });
        });


        // Overrides opcionales (Iteración #2): { "Chorizo": 1, ... }
        const offerOverridesPayload = _getOfferOverridesPayload();
        const quotePayload = { plan: planPayload };
        if (offerOverridesPayload && Object.keys(offerOverridesPayload).length) {
            quotePayload.offerOverrides = offerOverridesPayload;
        }

        const res = await fetch(`${API_BASE}/api/orders/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quotePayload)
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.ok === false) {
            const msg = (data && (data.error || data.message)) ? String(data.error || data.message) : `HTTP ${res.status}`;
            statusEl.textContent = `No se pudo cotizar (${msg}).`;

            // ✅ Anti-jump: liberar loading aunque falle
            itemsEl.classList.remove('sk-quote-loading');
            itemsEl.style.minHeight = __prevMinHeight;
            return;
        }

        const items = Array.isArray(data.items) ? data.items : [];
        const issues = Array.isArray(data.issues) ? data.issues : [];
        const total = Number(data.order_total ?? 0);

        totalEl.textContent = fmtMoney(total);
        statusEl.textContent = items.length ? 'Cotización estimada' : 'No hay items para cotizar (revisa tu plan).';

        if (issues.length) {
            issuesEl.classList.remove('hidden');
            issuesEl.textContent = 'Avisos: ' + issues.join(' | ');
        }

        if (!items.length) {
            // ✅ Anti-jump: liberar congelamiento aunque no haya items
            itemsEl.classList.remove('sk-quote-loading');
            itemsEl.style.minHeight = __prevMinHeight;
            return;
        }

        itemsEl.innerHTML = items.map(it => {
            const mode = it.sell_mode === 'bulk' ? 'Granel' : 'Empaque';
            const brand = it.offer_brand ? ` • ${it.offer_brand}` : '';
            const pres = it.offer_presentation ? ` • ${it.offer_presentation}` : '';

            if (it.sell_mode === 'bulk') {
                return `
                    <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <div class="text-sm font-bold text-slate-800">${it.ingredient}</div>
                                <div class="text-xs text-slate-500 mt-0.5">${mode}${brand}${pres}</div>
                                <div class="text-xs text-slate-600 mt-2">
                                    Requerido: <span class="font-semibold">${it.required_qty} ${it.unit}</span> · Precio unitario: <span class="font-semibold">${fmtMoney(it.unit_price)} / ${it.unit}</span>
                                </div>
                                ${_renderOfferSelector(it)}
                            </div>
                            <div class="text-sm font-black text-slate-900">${fmtMoney(it.line_total)}</div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <div class="text-sm font-bold text-slate-800">${it.ingredient}</div>
                            <div class="text-xs text-slate-500 mt-0.5">${mode}${brand}${pres}</div>
                            <div class="text-xs text-slate-600 mt-2">
                                Paquetes: <span class="font-semibold">${it.packages_needed}</span> · Tamaño: <span class="font-semibold">${it.package_qty} ${it.package_unit}</span>
                                <span class="text-slate-400">·</span>
                                Requerido: <span class="font-semibold">${it.required_qty} ${it.package_unit}</span>
                            </div>
                            <div class="text-xs text-slate-600 mt-1">
                                Precio por empaque: <span class="font-semibold">${fmtMoney(it.unit_price)}</span>
                                ${Number(it.waste_qty || 0) > 0 ? ` · Desperdicio aprox: <span class="font-semibold">${it.waste_qty} ${it.package_unit}</span>` : ''}
                            </div>
                            ${_renderOfferSelector(it)}
                        </div>
                        <div class="text-sm font-black text-slate-900">${fmtMoney(it.line_total)}</div>
                    </div>
                </div>
            `;
        }).join('');

        _bindOfferSelectors(itemsEl);

        // ✅ Anti-jump: liberar congelamiento de altura y estado loading
        itemsEl.classList.remove('sk-quote-loading');
        itemsEl.style.minHeight = __prevMinHeight;
    } catch (err) {
        statusEl.textContent = 'No se pudo cotizar (error de red o CORS).';

        // ✅ Anti-jump: si falla, quitar estado loading y devolver altura normal (sin borrar lo previo)
        try {
            itemsEl.classList.remove('sk-quote-loading');
            itemsEl.style.minHeight = __prevMinHeight;
        } catch (_) { }

        // console.error(err);
    }
}


// --- FILTER & HELPER LOGIC ---
function toggleAddress(show) {
    const el = document.getElementById('address-field');
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
    renderOrderSummary();
}

function setActiveMealForCard(cardEl, recipeId, mealType) {
    selectedMealByRecipeId[recipeId] = mealType;
    const all = cardEl.querySelectorAll(".meal-btn");
    all.forEach(b => {
        b.classList.remove("bg-orange-500", "border-orange-500", "text-white");
        b.classList.add("text-slate-400", "border", "border-slate-100");
    });
    const btn = cardEl.querySelector(`.meal-btn[data-meal="${mealType}"]`);
    if (btn) {
        btn.classList.remove("text-slate-400", "border-slate-100");
        btn.classList.add("bg-orange-500", "border-orange-500", "text-white");
    }
}

function addRecipeSelected(recipeId) {
    const mealType = selectedMealByRecipeId[recipeId] || _defaultMeal();
    addRecipe(recipeId, mealType);
}

function addRecipe(id, mealType) {
    const recipe = recipes.find(r => String(r.id) === String(id));
    if (!recipe) {
        showToast("No se encontró la receta (ID inválido).");
        return;
    }

    let portions = 1;
    if (!document.getElementById('recipe-modal').classList.contains('hidden')) {
        portions = currentModalPortions;
    } else {
        const portionEl = document.getElementById(`portion-${id}`);
        if (portionEl) portions = parseInt(portionEl.innerText);
    }

    // Agrupación (comparando ID como string para no romper por tipos)
    const existingItemIndex = plan[selectedDayIndex].findIndex(item =>
        String(item.id) === String(id) && item.assignedMeal === mealType
    );

    if (existingItemIndex > -1) {
        plan[selectedDayIndex][existingItemIndex].portions += portions;
        showToast(`Se sumaron ${portions} porciones a: ${recipe.title}`);
    } else {
        plan[selectedDayIndex].push({ ...recipe, assignedMeal: mealType, portions });
        showToast(`Agregado: ${recipe.title}`);
    }

    renderCalendarDays(); updateDayView(); checkOrderBadge();
}

function removeRecipe(arrayIndex) { plan[selectedDayIndex].splice(arrayIndex, 1); renderCalendarDays(); updateDayView(); checkOrderBadge(); }
function clearDay() { plan[selectedDayIndex] = []; renderCalendarDays(); updateDayView(); checkOrderBadge(); }

function clearAll() {
    if (confirm('¿Borrar todo?')) {
        dynamicDays.forEach((_, i) => plan[i] = []);
        renderCalendarDays();
        updateDayView();
        checkOrderBadge();
        excludedIngredients.clear();
        if (typeof clearOfferOverrides === 'function') clearOfferOverrides();
    }
}

function checkOrderBadge() {
    const total = Object.values(plan).flat().length;
    const badge = document.getElementById('nav-badge');
    total > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
}

// Filtros
function toggleFilterPanel() {
    // Delegado al módulo de filtros (UI)
    if (window.SmartKetFilters && typeof window.SmartKetFilters.toggle === 'function') {
        window.SmartKetFilters.toggle();
        return;
    }
    // Fallback: toggle simple
    const panel = document.getElementById('filter-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    panel.classList.toggle('collapsed');
}

function toggleLimit(type) {
    const check = document.getElementById(`check-no-limit-${type}`);
    const container = document.getElementById(`container-slider-${type}`);
    if (check.checked) container.classList.add('hidden');
    else container.classList.remove('hidden');
}

function updateRangeLabels() {
    const time = document.getElementById('filter-time').value;
    const cal = document.getElementById('filter-cal').value;
    document.getElementById('lbl-time').innerText = time + " min";
    document.getElementById('lbl-cal').innerText = cal + " kcal";
}

function applyFilters() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const checkedCats = Array.from(document.querySelectorAll('input[name="filter-cat"]:checked')).map(cb => cb.value);
    const noLimitTime = document.getElementById('check-no-limit-time').checked;
    const maxTime = parseInt(document.getElementById('filter-time').value);
    const noLimitCal = document.getElementById('check-no-limit-cal').checked;
    const maxCal = parseInt(document.getElementById('filter-cal').value);

    const filtered = recipes.filter(r => {
        if (searchText && !String(r.title || "").toLowerCase().includes(searchText)) return false;
        if (checkedCats.length > 0 && !checkedCats.includes(r.category)) return false;

        if (!noLimitTime) {
            const rTime = parseInt(r.time);
            if (!isNaN(rTime) && rTime > maxTime) return false;
        }
        if (!noLimitCal) {
            const rCal = parseInt(r.cals);
            if (!isNaN(rCal) && rCal > maxCal) return false;
        }
        return true;
    });

    SmartKetRecipes.renderRecipes(filtered);
}

function resetFilters() {
    // ✅ UI: marcar "Todos" como activo (sin mezclar lógica de filtrado aquí)
    if (window.SmartKetFilters && typeof window.SmartKetFilters.setPill === 'function') {
        window.SmartKetFilters.setPill('todos');
    }

    // ✅ Restablecer UI
    document.getElementById('search-input').value = "";

    // Checkboxes de horario
    document.querySelectorAll('input[name="filter-cat"]').forEach(el => el.checked = false);

    // Sliders + toggles "Sin límite"
    const checkTime = document.getElementById('check-no-limit-time');
    const checkCal = document.getElementById('check-no-limit-cal');
    const sliderTime = document.getElementById('filter-time');
    const sliderCal = document.getElementById('filter-cal');

    if (checkTime) checkTime.checked = false;
    if (checkCal) checkCal.checked = false;
    if (sliderTime) sliderTime.value = 60;
    if (sliderCal) sliderCal.value = 1000;

    // Mostrar sliders (por si estaban ocultos)
    if (typeof toggleLimit === 'function') {
        toggleLimit('time');
        toggleLimit('cal');
    }
    if (typeof updateRangeLabels === 'function') updateRangeLabels();

    // ✅ Cerrar panel visual de filtros (UI)
    if (window.SmartKetFilters && typeof window.SmartKetFilters.close === 'function') {
        window.SmartKetFilters.close();
    } else {
        const panel = document.getElementById('filter-panel');
        if (panel) {
            panel.classList.remove('open');
            panel.classList.add('collapsed');
        }
    }

    // ✅ Volver a render completo
    _ensureCardsModule();
    SmartKetRecipes.renderRecipes(recipes);
}

function filterRecipes() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const filtered = recipes.filter(r => String(r.title || "").toLowerCase().includes(term));
    SmartKetRecipes.renderRecipes(filtered);
}

// Portions (Card)
function changePortion(id, delta) {
    const el = document.getElementById(`portion-${id}`);
    let val = parseInt(el.innerText);
    val += delta;
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    el.innerText = val;
}

// Modal Logic
function openModal(id) {
    const recipe = recipes.find(r => String(r.id) === String(id));
    if (!recipe) {
        showToast("No se encontró la receta (ID inválido).");
        return;
    }

    currentModalRecipe = recipe;
    currentModalPortions = 1;

    document.getElementById('modal-portion-val').innerText = 1;
    document.getElementById('modal-img').src = recipe.img;
    document.getElementById('modal-category').innerText = recipe.category;
    document.getElementById('modal-title').innerText = recipe.title;
    document.getElementById('modal-time').innerText = recipe.time;
    document.getElementById('modal-cals').innerText = recipe.cals;
    document.getElementById('modal-ingredients').innerHTML = recipe.ingredients.map(ing => `<li>${ing}</li>`).join('');
    document.getElementById('recipe-modal').classList.remove('hidden');
}

function changeModalPortion(d) {
    currentModalPortions += d;
    if (currentModalPortions < 1) currentModalPortions = 1;
    document.getElementById('modal-portion-val').innerText = currentModalPortions;
}
function closeModal() { document.getElementById('recipe-modal').classList.add('hidden'); currentModalRecipe = null; }
function addCurrentRecipeFromModal(m) { if (currentModalRecipe) { addRecipe(currentModalRecipe.id, m); closeModal(); } }

// Exclude Logic
function _ingredientTitle(raw) {
    // Objetivo: mostrar SOLO el nombre del ingrediente (sin cantidades / unidad / forma / proceso)
    // Ejemplos de entrada:
    // "Aceite de oliva (1 Cucharada), Líquida, Calentado" -> "Aceite de oliva"
    // "Brócoli (100 Gramos), Natural, Cocido" -> "Brócoli"
    // "Sal, al gusto" -> "Sal"
    const s = String(raw ?? '').trim();
    if (!s) return '';
    // Quitar todo lo que vaya después de "(" (cantidad/unidad)
    const noQty = s.split('(')[0].trim();
    // Quitar todo lo que vaya después de "," (forma/proceso u otros)
    const noMeta = noQty.split(',')[0].trim();
    return noMeta;
}


function openExcludeModal() {
    const allIngredients = new Set();

    // Tomar ingredientes desde el plan, pero normalizados a "título"
    Object.values(plan).flat().forEach(item => {
        (item.ingredients || []).forEach(ing => {
            const title = _ingredientTitle(ing);
            if (title) allIngredients.add(title);
        });
    });

    const container = document.getElementById('modal-ingredients-list');
    const emptyMsg = document.getElementById('empty-ingredients-msg');
    container.innerHTML = '';

    if (allIngredients.size === 0) {
        emptyMsg.classList.remove('hidden');
        container.classList.add('hidden');
        document.getElementById('exclude-modal').classList.remove('hidden');
        return;
    }

    emptyMsg.classList.add('hidden');
    container.classList.remove('hidden');

    // ✅ Agrupar por categoría (columna H: CATEGORÍA en Ingredientes.xlsx)
    // Nota: si la meta no está disponible (backend caído), se renderiza como "Otros".
    const groups = {}; // { categoria: [titles...] }
    Array.from(allIngredients).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
        .forEach(title => {
            const key = _normKey(title);
            let cat = (__ingredientsCatByKey && __ingredientsCatByKey[key]) ? __ingredientsCatByKey[key] : '';
            cat = String(cat || '').trim();
            if (!cat) cat = 'Otros';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(title);
        });

    // ✅ Orden: "Básicos" primero, luego el resto alfabético
    const catKeys = Object.keys(groups);
    catKeys.sort((a, b) => {
        const na = _normKey(a);
        const nb = _normKey(b);
        if (na === 'basicos' && nb !== 'basicos') return -1;
        if (nb === 'basicos' && na !== 'basicos') return 1;
        return a.localeCompare(b, 'es', { sensitivity: 'base' });
    });

    catKeys.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'w-full mb-3';

        const header = document.createElement('div');
        header.className = 'text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2';
        header.innerText = cat;

        const chipsWrap = document.createElement('div');
        chipsWrap.className = 'flex flex-wrap gap-2';

        groups[cat].forEach(title => {
            const chip = document.createElement('span');
            const isExcluded = excludedIngredients.has(title);
            chip.className = `exclude-chip ${isExcluded ? 'selected' : ''}`;
            chip.innerText = title;
            chip.onclick = () => toggleIngredientExclusion(title, chip);
            chipsWrap.appendChild(chip);
        });

        section.appendChild(header);
        section.appendChild(chipsWrap);
        container.appendChild(section);
    });

    document.getElementById('exclude-modal').classList.remove('hidden');
}

function toggleIngredientExclusion(ingredient, element) {
    if (excludedIngredients.has(ingredient)) { excludedIngredients.delete(ingredient); element.classList.remove('selected'); }
    else { excludedIngredients.add(ingredient); element.classList.add('selected'); }
}
function closeExcludeModal() { document.getElementById('exclude-modal').classList.add('hidden'); }
function confirmExclusions() {
    closeExcludeModal();
    renderExcludedSummary();

    // ✅ Al confirmar exclusiones, actualiza inmediatamente la cotización (Total y desglose)
    // Nota: renderOrderQuote() ya valida si los contenedores existen (solo corre en la vista Pedido).
    renderOrderQuote();
}
function renderExcludedSummary() {
    const container = document.getElementById('excluded-ingredients-list');
    container.innerHTML = '';
    if (excludedIngredients.size === 0) { container.innerHTML = '<span class="text-xs text-slate-400 italic">No has excluido ningún ingrediente.</span>'; return; }
    excludedIngredients.forEach(ing => {
        const chip = document.createElement('span');
        chip.className = 'exclude-chip-readonly';
        chip.innerHTML = `<i class="fa-solid fa-ban mr-1 text-[10px]"></i> ${ing}`;
        container.appendChild(chip);
    });
}

// WhatsApp Send (✅ Ahora: no elimina desayuno; lo marca como Recolección únicamente para ese ítem)
function sendOrder() {
    // ✅ Nuevo flujo (modo prueba local):
    // 1) Genera pedido en backend (correo + archivo) y obtiene clave única
    // 2) Abre WhatsApp hacia SmartKet con un mensaje corto (sin detalles del pedido)

    if (__orderSending) return; // 🔒 evita multi-click
    __orderSending = true;

    const btnSend = document.getElementById('btn-send-whatsapp');
    const originalHtml = btnSend ? btnSend.innerHTML : null;

    const lockUi = () => {
        if (!btnSend) return;
        btnSend.disabled = true;
        btnSend.classList.add('opacity-70', 'cursor-not-allowed');
        btnSend.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xl"></i> Generando...`;
    };

    const unlockUi = () => {
        if (!btnSend) return;
        btnSend.disabled = false;
        btnSend.classList.remove('opacity-70', 'cursor-not-allowed');
        if (originalHtml != null) btnSend.innerHTML = originalHtml;
    };

    lockUi();

    const terms = document.getElementById('terms')?.checked;
    if (!terms) {
        showToast("Acepta los términos");
        __orderSending = false;
        unlockUi();
        return;
    }

    // Tomamos el método de entrega (sin dirección, por diseño)
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked')?.value || "Domicilio";

    // Payload mínimo pero suficiente para que la app interna procese después (vía archivo)
    const payload = {
        deliveryType,
        // Estado global actual (plan + días dinámicos)
        plan: (typeof plan !== 'undefined' ? plan : null),
        dynamicDays: (typeof dynamicDays !== 'undefined' ? dynamicDays : null),
        excludedIngredients: (typeof excludedIngredients !== 'undefined' ? Array.from(excludedIngredients) : []),
        clientMeta: {
            // En esta fase NO pedimos datos personales al usuario
            uiVersion: "publicweb-v1",
            userAgent: navigator.userAgent || ""
        }
    };

    fetch("http://127.0.0.1:5050/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                const msg = (data && data.error) ? data.error : "No se pudo generar el pedido";
                throw new Error(msg);
            }
            return data;
        })
        .then((data) => {
            const orderKey = data.order_key || "SK-UNKNOWN";
            const wa = data.whatsapp_number || "5562527059";

            const msg = `Hola, realicé un pedido en SmartKet.\nClave: ${orderKey}`;
            window.open(`https://wa.me/52${wa}?text=${encodeURIComponent(msg)}`, "_blank");

            showToast(`Pedido generado: ${orderKey}`);

            // 🔒 Mantener bloqueado un momento para evitar doble envío por doble click + lag del navegador
            setTimeout(() => {
                __orderSending = false;
                unlockUi();
            }, 2500);
        })
        .catch((err) => {
            console.error(err);
            showToast(err?.message || "Error al generar el pedido");
            __orderSending = false;
            unlockUi();
        });
}
