// assets/js/modules/filters.js
// Responsabilidad ÚNICA: abrir/cerrar el panel visual de filtros en "Mi Plan".
// - No aplica filtros de negocio (eso sigue en app.js).
// - Solo maneja el comportamiento UI (toggle del panel).

(function () {
  'use strict';

  const PANEL_ID = 'filter-panel';
  const BUTTON_ID = 'btn-filters';
  const TODOS_BUTTON_ID = 'btn-todos';

  // Clases (Tailwind) para simular un toggle "Todos / Filtros" sin tocar lógica de negocio.
  const CLS_ACTIVE = ['bg-slate-900', 'text-white', 'border-transparent'];
  const CLS_INACTIVE = ['bg-white', 'text-slate-600', 'border', 'border-slate-200', 'hover:bg-slate-50'];

  function _get() {
    return {
      panel: document.getElementById(PANEL_ID),
      button: document.getElementById(BUTTON_ID),
      todos: document.getElementById(TODOS_BUTTON_ID),
    };
  }

  function _applyClasses(el, add, remove) {
    if (!el) return;
    remove.forEach((c) => el.classList.remove(c));
    add.forEach((c) => el.classList.add(c));
  }

  // Mantiene coherencia visual entre los 2 botones.
  function setPill(active) {
    const { button, todos } = _get();
    const isTodos = active === 'todos';

    _applyClasses(todos, isTodos ? CLS_ACTIVE : CLS_INACTIVE, isTodos ? CLS_INACTIVE : CLS_ACTIVE);
    _applyClasses(button, isTodos ? CLS_INACTIVE : CLS_ACTIVE, isTodos ? CLS_ACTIVE : CLS_INACTIVE);
  }

  function _setAria(button, isOpen) {
    if (!button) return;
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    button.setAttribute('aria-controls', PANEL_ID);
  }

  function close() {
    const { panel, button } = _get();
    if (!panel) return;
    panel.classList.remove('open');
    panel.classList.add('collapsed');
    _setAria(button, false);
  }

  function open() {
    const { panel, button } = _get();
    if (!panel) return;
    panel.classList.add('open');
    panel.classList.remove('collapsed');
    _setAria(button, true);

    // Si el usuario abrió el panel, visualmente está en modo "Filtros".
    setPill('filters');
  }

  function toggle() {
    const { panel } = _get();
    if (!panel) return;

    const isOpen = panel.classList.contains('open');
    if (isOpen) close();
    else open();
  }

  function init() {
    const { panel, button } = _get();
    if (!panel || !button) return;

    // Estado inicial: CERRADO (evita overlays invisibles encima de botones)
    panel.classList.add('collapsed');
    panel.classList.remove('open');
    _setAria(button, false);

    // Estado inicial: "Todos" activo.
    setPill('todos');
  }

  window.SmartKetFilters = window.SmartKetFilters || {};
  window.SmartKetFilters.init = init;
  window.SmartKetFilters.toggle = toggle;
  window.SmartKetFilters.open = open;
  window.SmartKetFilters.close = close;
  window.SmartKetFilters.setPill = setPill;
})();
