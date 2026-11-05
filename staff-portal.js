// Staff login must work independently of Firebase and public events.
(function () {
  "use strict";
  const portal = document.getElementById("staff-portal");
  const trigger = document.getElementById("staff-nav-link");
  const close = document.getElementById("staff-portal-close");
  const frame = document.getElementById("staff-portal-frame");
  if (!portal || !trigger || !close || !frame) return;
  function openPortal(event) {
    if (event) event.preventDefault();
    if (!frame.getAttribute("src")) frame.setAttribute("src", "staff.html");
    portal.hidden = false;
    document.body.style.overflow = "hidden";
    close.focus();
  }
  function closePortal() {
    portal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }
  trigger.addEventListener("click", openPortal);
  close.addEventListener("click", closePortal);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !portal.hidden) closePortal();
  });
})();
