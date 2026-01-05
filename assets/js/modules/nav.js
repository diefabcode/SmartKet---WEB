// assets/js/modules/nav.js
// Responsabilidad  NICA: estado visual del nav (Inicio / Mi Plan / Pedido).
// - No maneja datos, no maneja vistas, no maneja estado del plan.
// - Solo aplica la clase .active al bot n correspondiente.

(function () {
  'use strict';

  const VIEWS = ['inicio', 'plan', 'pedido'];

  function setActiveNav(viewId) {
    VIEWS.forEach((id) => {
      const btn = document.getElementById(`nav-${id}`);
      if (!btn) return;
      btn.classList.toggle('active', id === viewId);
    });
  }

  // Exponer API m nima (global) para que app.js la use sin importar el orden.
  window.SmartKetNav = window.SmartKetNav || {};
  window.SmartKetNav.setActiveNav = setActiveNav;
  window.SmartKetNav.VIEWS = VIEWS;
})();
