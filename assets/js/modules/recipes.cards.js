// assets/js/modules/recipes.cards.js
// Responsabilidad  NICA: construir y renderizar las tarjetas de recetas en #recipes-grid.
// - No maneja estado del plan, ni calendario, ni filtros.
// - Recibe una lista de recetas (ya filtrada) y renderiza.
// - Depende de funciones globales existentes (openModal, changePortion, addRecipeSelected, setActiveMealForCard)
//   y del estado global selectedMealByRecipeId (definido en state.js).

(function () {
    'use strict';

    function renderRecipes(list) {
        const grid = document.getElementById('recipes-grid');
        const countLabel = document.getElementById('results-count');

        grid.innerHTML = '';
        countLabel.innerText = `${list.length} recetas`;

        if (list.length === 0) {
            grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                 <i class="fa-solid fa-carrot text-4xl mb-3 text-slate-300"></i>
                 <p class="text-slate-500">No encontramos recetas con esos filtros.</p>
                 <button onclick="resetFilters()" class="mt-2 text-orange-500 font-bold text-sm hover:underline">Ver todas</button>
            </div>`;
            return;
        }

        list.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col';

            // default: usa la categor a como horario inicial
            const FIXED_MEALS = ["Desayuno", "Comida", "Cena", "Colación"];
            const cat = (recipe.category || "").trim();
            selectedMealByRecipeId[recipe.id] = FIXED_MEALS.includes(cat) ? cat : "Comida";

            // Generar ID  nico para input de porciones
            const portionsId = `portion-${recipe.id}`;

            card.innerHTML = `
            <div class="h-32 bg-gray-200 relative overflow-hidden group cursor-pointer" onclick="openModal(${recipe.id})">
                <img src="${recipe.img}" class="w-full h-full object-cover transition-transform group-hover:scale-110">
                <div class="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                <div class="absolute bottom-2 left-2 flex gap-1">
                    <div class="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1">
                        <i class="fa-solid fa-clock text-orange-400"></i> ${recipe.time}
                    </div>
                    <div class="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1">
                        <i class="fa-solid fa-fire text-red-400"></i> ${recipe.cals}
                    </div>
                </div>
                <div class="absolute top-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
                    $${recipe.price}
                </div>
            </div>
            <div class="p-3 flex flex-col flex-1">
                <h4 class="font-bold text-slate-800 text-sm mb-1 leading-tight line-clamp-2" title="${recipe.title}">${recipe.title}</h4>
                <div class="mb-3 flex items-center justify-between">
                     <button onclick="openModal(${recipe.id})" class="text-[10px] text-orange-500 font-bold hover:underline">Ver detalles</button>
                     <div class="flex items-center gap-1">
                        <button class="portion-btn text-xs" onclick="changePortion(${recipe.id}, -1)">-</button>
                        <span id="${portionsId}" class="text-xs font-bold w-4 text-center">1</span>
                        <button class="portion-btn text-xs" onclick="changePortion(${recipe.id}, 1)">+</button>
                        <i class="fa-solid fa-user text-[10px] text-slate-400 ml-1"></i>
                     </div>
                </div>

                <div class="mt-auto pt-2 border-t border-slate-50">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Horario:</span>

                        <div class="flex gap-1 meal-selector">
                            <button class="meal-btn w-7 h-7 rounded-full border border-slate-100 text-slate-400 flex items-center justify-center"
                                    data-meal="Desayuno" type="button" title="Desayuno">
                                <i class="ph-fill ph-coffee"></i>
                            </button>

                            <button class="meal-btn w-7 h-7 rounded-full border border-slate-100 text-slate-400 flex items-center justify-center"
                                    data-meal="Comida" type="button" title="Comida">
                                <i class="ph-fill ph-bowl-food"></i>
                            </button>

                            <button class="meal-btn w-7 h-7 rounded-full border border-slate-100 text-slate-400 flex items-center justify-center"
                                    data-meal="Cena" type="button" title="Cena">
                                <i class="ph-fill ph-moon-stars"></i>
                            </button>

                            <button class="meal-btn w-7 h-7 rounded-full border border-slate-100 text-slate-400 flex items-center justify-center"
                                    data-meal="Colación" type="button" title="Colación">
                                <i class="ph-fill ph-apple"></i>
                            </button>
                        </div>
                    </div>

                    <button onclick="addRecipeSelected(${recipe.id})"
                            class="w-full bg-slate-900 text-white text-xs font-bold rounded-lg py-2 hover:bg-slate-800 transition-colors">
                        + Agregar
                    </button>
                </div>
            </div>
        `;

            // Quitar badge de precio (ej: "$0") si llega a colarse por caché/markup viejo.
            // Nota: lo removemos solo dentro del contenedor de imagen para no afectar otras secciones.
            const media = card.querySelector('.h-32');
            if (media) {
                media.querySelectorAll('*').forEach(el => {
                    if (el.children && el.children.length === 0) {
                        const t = (el.textContent || '').trim();
                        if (/^\$\s*\d+/.test(t)) el.remove();
                    }
                });
            }

            // Bind meal buttons (por card)
            const buttons = card.querySelectorAll(".meal-btn");
            buttons.forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const meal = btn.getAttribute("data-meal") || "Comida";
                    setActiveMealForCard(card, recipe.id, meal);
                };
            });

            // Aplica estado inicial
            setActiveMealForCard(card, recipe.id, recipe.category);

            grid.appendChild(card);
        });
    }

    // API m nima
    window.SmartKetRecipes = window.SmartKetRecipes || {};
    window.SmartKetRecipes.renderRecipes = renderRecipes;
})();