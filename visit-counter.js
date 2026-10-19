(function () {
  "use strict";

  var root = document.getElementById("visit-count");
  if (!root) {
    return;
  }

  var apiBase = (root.getAttribute("data-api") || "").replace(/\/+$/, "");
  if (!apiBase) {
    return;
  }

  var valueNode = document.getElementById("visit-count-value");
  var numberFormat = new Intl.NumberFormat("zh-CN");
  var refreshing = false;
  var refreshIntervalMs = 20000;

  function render(payload) {
    if (!payload || typeof payload.total !== "number" || !isFinite(payload.total)) {
      return;
    }

    valueNode.textContent = numberFormat.format(payload.total);
    root.hidden = false;
  }

  async function readResponse(response) {
    if (!response.ok) {
      throw new Error("Visit counter returned HTTP " + response.status);
    }

    return response.json();
  }

  async function increment() {
    try {
      var response = await fetch(apiBase + "/visit", {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        credentials: "omit"
      });
      render(await readResponse(response));
    } catch (_) {
      // The game must keep loading even when statistics are unavailable.
    }
  }

  async function refresh() {
    if (refreshing || document.visibilityState !== "visible") {
      return;
    }

    refreshing = true;
    try {
      var response = await fetch(apiBase + "/visits", {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        credentials: "omit"
      });
      render(await readResponse(response));
    } catch (_) {
      // Keep the last visible value; a temporary outage should not blank the page.
    } finally {
      refreshing = false;
    }
  }

  increment();
  window.setInterval(refresh, refreshIntervalMs);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      refresh();
    }
  });
  window.addEventListener("online", refresh);
})();
