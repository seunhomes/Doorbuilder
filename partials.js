// Shared header + footer rendered into placeholders.
// Usage: <div data-partial="nav" data-active="configurator"></div>

(function () {
  const NAV_ITEMS = [
    { id: "home",          label: "Home",           href: "index.html" },
    { id: "configurator",  label: "Build a door",   href: "configurator.html" },
    { id: "gallery",       label: "Gallery",        href: "gallery.html" },
    { id: "craftsmanship", label: "Craftsmanship",  href: "craftsmanship.html" },
    { id: "quote",         label: "Quote",          href: "quote.html" },
  ];

  function logoSVG() {
    return `
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <rect x="4" y="2" width="20" height="24" fill="#1F1813"/>
        <rect x="6" y="4" width="16" height="9" fill="none" stroke="#F4EDE1" stroke-width="0.8"/>
        <rect x="6" y="15" width="16" height="9" fill="none" stroke="#F4EDE1" stroke-width="0.8"/>
        <circle cx="20" cy="14" r="1" fill="#F4EDE1"/>
      </svg>`;
  }

  function navHTML(active) {
    return `
      <nav class="site-nav">
        <div class="wrap site-nav__inner">
          <a class="brand" href="index.html">
            <span class="brand__mark">${logoSVG()}</span>
            <span>
              Toronto Custom Doors
              <small>Est. 1978 · Made in Toronto</small>
            </span>
          </a>
          <div class="nav-links">
            ${NAV_ITEMS.filter(n => n.id !== "home").map(n =>
              `<a href="${n.href}" class="${n.id === active ? 'active' : ''}">${n.label}</a>`
            ).join("")}
          </div>
          <a class="nav-cta" href="configurator.html">Start designing
            <svg class="arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 6h8M7 2l4 4-4 4"/></svg>
          </a>
        </div>
      </nav>`;
  }

  function footerHTML() {
    return `
      <footer class="site-footer">
        <div class="wrap">
          <div class="footer-grid">
            <div>
              <h4>Toronto Custom Doors</h4>
              <p class="footer-tagline">
                Handmade hardwood doors,<br/>
                designed by you, built<br/>
                in the Junction since 1978.
              </p>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li><a href="configurator.html">Configurator</a></li>
                <li><a href="gallery.html">Gallery</a></li>
                <li><a href="quote.html">Request quote</a></li>
                <li><a href="#">Trade program</a></li>
              </ul>
            </div>
            <div>
              <h4>Studio</h4>
              <ul>
                <li><a href="craftsmanship.html">Craftsmanship</a></li>
                <li><a href="#">Sourcing</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Journal</a></li>
              </ul>
            </div>
            <div>
              <h4>Visit</h4>
              <ul>
                <li>184 Sterling Rd.</li>
                <li>Toronto, ON M6R 2B7</li>
                <li>Tue–Sat, 10–6</li>
                <li><a href="mailto:studio@tcd.co">studio@tcd.co</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-base">
            <span>© 2026 Toronto Custom Doors Co.</span>
            <span>Crafted on Treaty 13 land</span>
          </div>
        </div>
      </footer>`;
  }

  document.querySelectorAll("[data-partial='nav']").forEach(el => {
    el.outerHTML = navHTML(el.dataset.active || "");
  });
  document.querySelectorAll("[data-partial='footer']").forEach(el => {
    el.outerHTML = footerHTML();
  });
})();
