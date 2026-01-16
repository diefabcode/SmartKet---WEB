// --- CONFIGURACI N DE FECHAS ---
const daysOfWeek = ["Dom", "Lun", "Mar", "Mi ", "Jue", "Vie", "Sáb"];
const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

let dynamicDays = []; // Array de objetos { dayName: 'Lun', dateStr: '30 Oct', fullDate: Date }

// --- ESTADO ---
let currentTab = 'inicio';
let selectedDayIndex = 0;
let plan = {};
let currentModalRecipe = null;
let currentModalPortions = 1;
let excludedIngredients = new Set();
let categories = ["Desayuno", "Comida", "Cena", "Colación"]; // categorías FIJAS para asignación (cards/plan)

const selectedMealByRecipeId = {};

/* =========================================================
   ✅ Overrides de cotización (Iteración #2)
   - key: nombre EXACTO del ingrediente (como lo devuelve el quote)
   - value: índice de oferta seleccionado (0..N-1)
   ========================================================= */
let offerOverrides = {}; // { "Chorizo": 1, "Leche": 0, ... }

function setOfferOverride(ingredientName, offerIndex) {
    const key = String(ingredientName || '').trim();
    if (!key) return;

    const n = Number(offerIndex);
    if (!Number.isFinite(n) || n < 0) {
        delete offerOverrides[key];
        return;
    }
    offerOverrides[key] = Math.floor(n);
}

function getOfferOverride(ingredientName) {
    const key = String(ingredientName || '').trim();
    if (!key) return undefined;
    return Object.prototype.hasOwnProperty.call(offerOverrides, key) ? offerOverrides[key] : undefined;
}

function clearOfferOverride(ingredientName) {
    const key = String(ingredientName || '').trim();
    if (!key) return;
    delete offerOverrides[key];
}

function clearOfferOverrides() {
    offerOverrides = {};
}

function getOfferOverrides() {
    // Devuelve copia para no mutar por accidente desde otros módulos
    return { ...offerOverrides };
}

// === Expose overrides API to window

/* =========================================================
   ✅ Expose overrides API to window (para asegurar que app.js pueda leer/escribir overrides)
   - Importante cuando los scripts se cargan con type="module" o bundlers
   ========================================================= */
try {
    window.setOfferOverride = window.setOfferOverride || setOfferOverride;
    window.getOfferOverride = window.getOfferOverride || getOfferOverride;
    window.clearOfferOverride = window.clearOfferOverride || clearOfferOverride;
    window.clearOfferOverrides = window.clearOfferOverrides || clearOfferOverrides;
    window.getOfferOverrides = window.getOfferOverrides || getOfferOverrides;
} catch (_) { /* noop */ }

