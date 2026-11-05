// Keep the embedded staff portal open across refreshes and direct links.
(function () {
  "use strict";
  const portal = document.getElementById("staff-portal");
  const trigger = document.getElementById("staff-nav-link");
  const close = document.getElementById("staff-portal-close");
  const frame = document.getElementById("staff-portal-frame");
  if (!portal || !trigger || !close || !frame) return;

  function showPortal() {
    if (!frame.getAttribute("src")) frame.setAttribute("src", frame.dataset.src || "staff.html");
    portal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function hidePortal() {
    portal.hidden = true;
    document.body.style.overflow = "";
  }
  function syncToUrl() {
    if (window.location.hash === "#staff-portal") showPortal();
    else hidePortal();
  }
  function openPortal(event) {
    if (event) event.preventDefault();
    if (window.location.hash !== "#staff-portal") {
      window.location.hash = "staff-portal";
    }
    showPortal();
    close.focus();
  }
  function closePortal() {
    if (window.location.hash === "#staff-portal") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    hidePortal();
    trigger.focus();
  }
  trigger.addEventListener("click", openPortal);
  close.addEventListener("click", closePortal);
  window.addEventListener("hashchange", syncToUrl);
  window.addEventListener("popstate", syncToUrl);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !portal.hidden) closePortal();
  });
  syncToUrl();
})();
