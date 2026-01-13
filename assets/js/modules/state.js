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
let categories = []; // categorías dinámicas (derivadas de las hojas del Excel)

const selectedMealByRecipeId = {};
