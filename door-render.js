// Toronto Custom Doors — photographic door renderer
// Returns an SVG markup string suitable as innerHTML of an <svg> element.
// Designed to feel like a studio product photo: soft gradient backdrop,
// procedural wood grain via feTurbulence, multi-stop lighting, drop shadow,
// and a soft floor reflection.

(function () {
  // ── Data (shared with configurator) ───────────────────────────
  const DOOR_STYLES = [
    { id: "flush",      label: "Flush",      price: 0   },
    { id: "two-panel",  label: "2 Panel",    price: 80  },
    { id: "four-panel", label: "4 Panel",    price: 120 },
    { id: "six-panel",  label: "6 Panel",    price: 160 },
    { id: "craftsman",  label: "Craftsman",  price: 180 },
    { id: "arch",       label: "Arch Top",   price: 200 },
    { id: "dutch",      label: "Dutch Door", price: 220 },
    { id: "barn",       label: "Barn Door",  price: 280 },
  ];

  const MATERIALS = [
    { id: "oak",        label: "White Oak",   color: "#B98947", wood: true,  grainScale: 0.9, grainContrast: 1.4, price: 200 },
    { id: "walnut",     label: "Walnut",      color: "#4A2C1A", wood: true,  grainScale: 1.2, grainContrast: 1.8, price: 350 },
    { id: "cherry",     label: "Cherry",      color: "#7B3D2E", wood: true,  grainScale: 1.0, grainContrast: 1.3, price: 280 },
    { id: "maple",      label: "Hard Maple",  color: "#D4A96A", wood: true,  grainScale: 0.6, grainContrast: 0.9, price: 230 },
    { id: "white",      label: "Alabaster",   color: "#ECE5D8", wood: false, price: 0   },
    { id: "black",      label: "Midnight",    color: "#1A1815", wood: false, price: 0   },
    { id: "navy",       label: "Deep Navy",   color: "#1F3349", wood: false, price: 0   },
    { id: "sage",       label: "Studio Sage", color: "#6B8970", wood: false, price: 0   },
    { id: "terracotta", label: "Terracotta",  color: "#B5512E", wood: false, price: 0   },
    { id: "charcoal",   label: "Charcoal",    color: "#3B3A37", wood: false, price: 0   },
  ];

  const HARDWARE_STYLES = [
    { id: "lever", label: "Lever Handle", price: 80  },
    { id: "knob",  label: "Round Knob",   price: 60  },
    { id: "bar",   label: "Bar Pull",     price: 120 },
    { id: "ring",  label: "Ring Pull",    price: 90  },
  ];

  const HARDWARE_FINISHES = [
    { id: "nickel", label: "Brushed Nickel",  color: "#A2A8B0" },
    { id: "brass",  label: "Polished Brass",  color: "#C9A84C" },
    { id: "mblack", label: "Matte Black",     color: "#262524" },
    { id: "bronze", label: "Antique Bronze",  color: "#7A5535" },
    { id: "chrome", label: "Satin Chrome",    color: "#CFD3DB" },
  ];

  const GLASS_OPTIONS = [
    { id: "none",       label: "No Glass",    price: 0   },
    { id: "clear",      label: "Clear",       price: 180 },
    { id: "frosted",    label: "Frosted",     price: 200 },
    { id: "decorative", label: "Decorative",  price: 280 },
  ];

  const SIZES   = ['28"', '30"', '32"', '34"', '36"'];
  const SPRICES = [0, 0, 50, 80, 120];
  const BASE    = 649;

  // ── Color utils ───────────────────────────────────────────────
  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }
  function rgbToHex({r, g, b}) {
    const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    return `#${c(r)}${c(g)}${c(b)}`;
  }
  function adj(hex, amt) {
    const {r, g, b} = hexToRgb(hex);
    return rgbToHex({r: r + amt, g: g + amt, b: b + amt});
  }
  function mix(hex, with_, t) {
    const a = hexToRgb(hex), b = hexToRgb(with_);
    return rgbToHex({
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
    });
  }
  function isLight(hex) {
    const {r, g, b} = hexToRgb(hex);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }

  // ── The renderer ──────────────────────────────────────────────
  // Returns SVG <defs> + drawn content as a string. The host <svg>
  // should have a viewBox of "0 0 <w> <h>" and preserveAspectRatio="xMidYMid meet".
  function renderDoorScene(opts) {
    const {
      doorStyle = "six-panel",
      mat: matId = "walnut",
      hwStyle: hwStyleId = "lever",
      hwFinish: hwFinishId = "brass",
      glass = "none",
      hingeLeft = true,
      scene = "studio",
      entryConfig = "single",          // single | double | single-sidelite-l | single-sidelite-r | single-sidelite-both | double-sidelite
      transom = "none",                // none | rectangular | arched | half-round
      sideliteGlass = "frosted",       // none | clear | frosted | decorative — glass style for sidelites
      w = 600,
      h = 800,
      uniq = Math.random().toString(36).slice(2, 8),
    } = opts;

    const mat      = MATERIALS.find(m => m.id === matId) || MATERIALS[0];
    const hwStyle  = (HARDWARE_STYLES.find(s => s.id === hwStyleId) || HARDWARE_STYLES[0]).id;
    const hwFinish = HARDWARE_FINISHES.find(f => f.id === hwFinishId) || HARDWARE_FINISHES[1];

    // ── Bay layout ────────────────────────────────────────────
    // The casing surrounds the WHOLE opening (door + any sidelites + transom).
    // We compute the bay widths first, then position each bay inside the casing.
    const hasTransom = transom && transom !== "none";
    const transomFrac = hasTransom ? 0.14 : 0;       // fraction of total opening height
    const dh = h * 0.82;                              // total opening height (door + transom)
    const dy = h * 0.08;
    const transomH = dh * transomFrac;
    const doorBayH = dh - transomH;
    const doorBayY = dy + transomH;

    // Bays — proportional widths (door = 1.0 unit, sidelite = 0.34 units, narrow gap between via frame mullion)
    let bays = [];
    if (entryConfig === "single") {
      bays = [{ type: "door", units: 1.0, hingeLeft }];
    } else if (entryConfig === "double") {
      bays = [
        { type: "door", units: 0.85, hingeLeft: true },
        { type: "door", units: 0.85, hingeLeft: false },
      ];
    } else if (entryConfig === "single-sidelite-l") {
      bays = [
        { type: "sidelite", units: 0.36 },
        { type: "door", units: 1.0, hingeLeft },
      ];
    } else if (entryConfig === "single-sidelite-r") {
      bays = [
        { type: "door", units: 1.0, hingeLeft },
        { type: "sidelite", units: 0.36 },
      ];
    } else if (entryConfig === "single-sidelite-both") {
      bays = [
        { type: "sidelite", units: 0.36 },
        { type: "door", units: 1.0, hingeLeft },
        { type: "sidelite", units: 0.36 },
      ];
    } else if (entryConfig === "double-sidelite") {
      bays = [
        { type: "sidelite", units: 0.32 },
        { type: "door", units: 0.85, hingeLeft: true },
        { type: "door", units: 0.85, hingeLeft: false },
        { type: "sidelite", units: 0.32 },
      ];
    } else {
      bays = [{ type: "door", units: 1.0, hingeLeft }];
    }

    // Compute total opening width so the door (1.0 unit) fills ~doorBaseUnit px
    const doorBaseUnit = w * 0.46;
    const totalUnits = bays.reduce((s, b) => s + b.units, 0);
    const mullion = w * 0.012;                        // frame mullion between bays
    const dw = doorBaseUnit * totalUnits + mullion * (bays.length - 1);
    const dx = (w - dw) / 2;

    // Frame (casing-inside reveal) covers the full opening
    const fw = dw;
    const fh = dh;
    const fx = dx;
    const fy = dy;

    // Position each bay
    let cursor = dx;
    bays = bays.map(b => {
      const bw = doorBaseUnit * b.units;
      const item = { ...b, x: cursor, w: bw };
      cursor += bw + mullion;
      return item;
    });

    const dc    = mat.color;
    const frame = adj(dc, mat.wood ? -28 : -22);
    const deep  = adj(dc, mat.wood ? -22 : -16);
    const hi    = adj(dc, mat.wood ? 30 : 22);
    const hwc   = hwFinish.color;
    const lightOnDoor = isLight(dc);

    // ── DEFS: filters + gradients ──────────────────────────────
    // 1. Wood grain — feTurbulence creates banded noise we stretch vertically
    // 2. Surface lighting gradient — top-left highlight to bottom-right shadow
    // 3. Drop shadow filter
    // 4. Studio backdrop gradient
    const grainSeed = matId === "walnut" ? 4 : matId === "oak" ? 7 : matId === "cherry" ? 11 : 2;

    const defs = `
      <defs>
        <!-- Backdrop -->
        <radialGradient id="bg-${uniq}" cx="50%" cy="40%" r="80%">
          <stop offset="0%"   stop-color="${scene === "studio" ? "#EFE6D4" : "#D8C9AC"}"/>
          <stop offset="55%"  stop-color="${scene === "studio" ? "#D9CDB6" : "#B89F7C"}"/>
          <stop offset="100%" stop-color="${scene === "studio" ? "#A89678" : "#705840"}"/>
        </radialGradient>

        <!-- Floor -->
        <linearGradient id="floor-${uniq}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stop-color="#9C8260" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#5C4830" stop-opacity="0.95"/>
        </linearGradient>

        <!-- Door surface lighting: warm highlight top-left → shadow bottom-right -->
        <linearGradient id="light-${uniq}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.18"/>
          <stop offset="40%"  stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
        </linearGradient>

        <!-- Subtle vignette at edges of door -->
        <linearGradient id="ao-${uniq}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stop-color="#000" stop-opacity="0.22"/>
          <stop offset="6%"  stop-color="#000" stop-opacity="0"/>
          <stop offset="94%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.22"/>
        </linearGradient>

        <!-- Wood grain filter: turbulence biased to look like long vertical fibers -->
        ${mat.wood ? `
        <filter id="grain-${uniq}" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 ${0.7 * mat.grainScale}"
                        numOctaves="2" seed="${grainSeed}" stitchTiles="stitch"/>
          <feColorMatrix type="matrix" values="
            0 0 0 0 ${hexToRgb(adj(dc, -45)).r / 255}
            0 0 0 0 ${hexToRgb(adj(dc, -45)).g / 255}
            0 0 0 0 ${hexToRgb(adj(dc, -45)).b / 255}
            ${mat.grainContrast * 0.55} 0 0 0 0"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="${0.65 * mat.grainContrast}" intercept="-0.05"/>
          </feComponentTransfer>
        </filter>` : ""}

        <!-- Drop shadow under the door -->
        <filter id="dshadow-${uniq}" x="-20%" y="-10%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="${w * 0.012}"/>
          <feOffset dx="${w * 0.008}" dy="${h * 0.015}" result="offsetblur"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <!-- Glass tints -->
        <linearGradient id="glass-${uniq}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#E0EAF0" stop-opacity="0.75"/>
          <stop offset="50%"  stop-color="#C4D3DD" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#9DB7C8" stop-opacity="0.45"/>
        </linearGradient>

        <!-- Hardware metal -->
        <linearGradient id="metal-${uniq}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="${adj(hwc, 35)}"/>
          <stop offset="50%" stop-color="${hwc}"/>
          <stop offset="100%" stop-color="${adj(hwc, -25)}"/>
        </linearGradient>
        <radialGradient id="metalSphere-${uniq}" cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stop-color="${adj(hwc, 60)}"/>
          <stop offset="35%"  stop-color="${hwc}"/>
          <stop offset="100%" stop-color="${adj(hwc, -35)}"/>
        </radialGradient>

        <!-- Reflection clip / fade -->
        <linearGradient id="reflect-${uniq}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#000" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
      </defs>
    `;

    // ── Backdrop + floor + cast shadow ─────────────────────────
    const floorY = dy + dh + 8;
    const backdrop = `
      <rect width="${w}" height="${h}" fill="url(#bg-${uniq})"/>
      <rect x="0" y="${floorY}" width="${w}" height="${h - floorY}" fill="url(#floor-${uniq})"/>
      <!-- Floor seam -->
      <rect x="0" y="${floorY - 0.5}" width="${w}" height="1" fill="#3A2D1E" opacity="0.4"/>

      <!-- Cast shadow ellipse on floor -->
      <ellipse cx="${w / 2}" cy="${floorY + h * 0.025}"
               rx="${dw * 0.62}" ry="${h * 0.018}"
               fill="#1F1813" opacity="0.42"
               filter="url(#dshadow-${uniq})"/>
    `;

    // ── Frame (architectural casing around door) ──────────────
    const casingW = dw * 0.045;
    const casing = `
      <rect x="${fx - casingW}" y="${fy - casingW}"
            width="${fw + casingW * 2}" height="${fh + casingW + 2}"
            fill="#D6C7AB"/>
      <rect x="${fx - casingW}" y="${fy - casingW}"
            width="${fw + casingW * 2}" height="${casingW * 0.4}"
            fill="#A89678" opacity="0.6"/>
      <rect x="${fx - casingW}" y="${fy - casingW}"
            width="${casingW * 0.35}" height="${fh + casingW + 2}"
            fill="#A89678" opacity="0.45"/>
      <rect x="${fx + fw + casingW * 0.65}" y="${fy - casingW}"
            width="${casingW * 0.35}" height="${fh + casingW + 2}"
            fill="#7C6B50" opacity="0.55"/>
      <!-- Inner reveal -->
      <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${frame}"/>
    `;

    // ── Door slab body ─────────────────────────────────────────
    // Extract the panel/slab/hardware drawing into helpers so we can call
    // them once per "door" bay.

    function drawDoorBay(bay, idx) {
      const slabInset = bay.w * 0.035;
      const sx = bay.x + slabInset;
      const sy = doorBayY + slabInset * 0.5;
      const sw = bay.w - slabInset * 2;
      const sh = doorBayH - slabInset * 0.5;
      const localHingeLeft = bay.hingeLeft;

      let out = "";

      // Slab base + grain + lighting
      out += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${dc}"/>`;
      if (mat.wood) {
        out += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}"
                  filter="url(#grain-${uniq})" opacity="0.85"/>`;
        out += `<g opacity="0.18">${Array.from({length: 5}).map((_, i) => {
          const xx = sx + sw * (0.15 + i * 0.16) + (Math.sin(i * 4 + grainSeed) * sw * 0.04);
          return `<rect x="${xx}" y="${sy}" width="${sw * 0.005}" height="${sh}" fill="${adj(dc, -50)}"/>`;
        }).join("")}</g>`;
      }
      out += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="url(#light-${uniq})"/>`;
      out += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="url(#ao-${uniq})"/>`;

      // Panels (style-dependent)
      const PM = sw * 0.05, PG = sw * 0.04;
      const PX1 = sx + PM;
      const PW2 = (sw - PM * 2 - PG) / 2;
      const PX2 = PX1 + PW2 + PG;
      const PYS = sy + PM;
      const PAVAIL = sh - PM * 2;
      const styleForBay = (entryConfig === "double" || entryConfig === "double-sidelite") && doorStyle === "arch"
        ? "two-panel" : doorStyle;  // arch top only makes sense on a single door

      if (styleForBay === "two-panel") {
        const ph = (PAVAIL - PG) / 2;
        out += panel(PX1, PYS, sw - PM * 2, ph, sx, sy, sw, sh);
        out += panel(PX1, PYS + ph + PG, sw - PM * 2, ph, sx, sy, sw, sh);
      } else if (styleForBay === "four-panel") {
        const ph = (PAVAIL - PG) / 2;
        out += panel(PX1, PYS, PW2, ph, sx, sy, sw, sh);
        out += panel(PX2, PYS, PW2, ph, sx, sy, sw, sh);
        out += panel(PX1, PYS + ph + PG, PW2, ph, sx, sy, sw, sh);
        out += panel(PX2, PYS + ph + PG, PW2, ph, sx, sy, sw, sh);
      } else if (styleForBay === "six-panel") {
        const th = PAVAIL * 0.21, mh = PAVAIL * 0.46, bh = PAVAIL - th - mh - PG * 2;
        const y1 = PYS, y2 = y1 + th + PG, y3 = y2 + mh + PG;
        out += panel(PX1, y1, PW2, th, sx, sy, sw, sh);
        out += panel(PX2, y1, PW2, th, sx, sy, sw, sh);
        out += panel(PX1, y2, PW2, mh, sx, sy, sw, sh, true);
        out += panel(PX2, y2, PW2, mh, sx, sy, sw, sh, true);
        out += panel(PX1, y3, PW2, bh, sx, sy, sw, sh);
        out += panel(PX2, y3, PW2, bh, sx, sy, sw, sh);
      } else if (styleForBay === "craftsman") {
        const th = PAVAIL * 0.28, bh = PAVAIL - th - PG;
        out += panel(PX1, PYS, PW2, th, sx, sy, sw, sh, true);
        out += panel(PX2, PYS, PW2, th, sx, sy, sw, sh, true);
        out += panel(PX1, PYS + th + PG, sw - PM * 2, bh, sx, sy, sw, sh);
      } else if (styleForBay === "arch") {
        const ax = PX1, ay = PYS;
        const aw = sw - PM * 2, ah = PAVAIL;
        const ar = aw * 0.45;
        const clipId = `arch-clip-${uniq}-${idx}`;
        out += `<defs><clipPath id="${clipId}"><path d="M${ax},${ay + ar} Q${ax + aw/2},${ay - ar * 0.3} ${ax + aw},${ay + ar} L${ax + aw},${ay + ah} L${ax},${ay + ah} Z"/></clipPath></defs>`;
        out += `<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="${adj(dc, -30)}" clip-path="url(#${clipId})"/>`;
        const inset = 8;
        out += `<rect x="${ax + inset}" y="${ay + inset}" width="${aw - inset * 2}" height="${ah - inset * 2}" fill="${dc}" clip-path="url(#${clipId})"/>`;
        if (glass !== "none") {
          out += `<rect x="${ax + inset}" y="${ay + ar * 0.4}" width="${aw - inset * 2}" height="${ah - ar * 0.4 - inset}" fill="url(#glass-${uniq})" clip-path="url(#${clipId})"/>`;
        }
        out += `<path d="M${ax},${ay + ar} Q${ax + aw/2},${ay - ar * 0.3} ${ax + aw},${ay + ar}" stroke="${adj(dc, -55)}" stroke-width="1.4" fill="none" opacity="0.7"/>`;
      } else if (styleForBay === "dutch") {
        const splitH = sh * 0.46, splitY = sy + splitH;
        const th = splitH - PM * 1.5, bh = sh - splitH - PM * 1.5;
        out += panel(PX1, PYS, PW2, th, sx, sy, sw, sh);
        out += panel(PX2, PYS, PW2, th, sx, sy, sw, sh);
        out += `<rect x="${sx}" y="${splitY - 6}" width="${sw}" height="12" fill="${adj(frame, 8)}"/>`;
        out += `<rect x="${sx}" y="${splitY - 6}" width="${sw}" height="2" fill="${adj(dc, -45)}" opacity="0.6"/>`;
        out += `<rect x="${sx}" y="${splitY + 4}" width="${sw}" height="2" fill="${hi}" opacity="0.5"/>`;
        out += panel(PX1, splitY + 8, PW2, bh, sx, sy, sw, sh);
        out += panel(PX2, splitY + 8, PW2, bh, sx, sy, sw, sh);
      } else if (styleForBay === "barn") {
        const rh = sh * 0.04;
        const ty = sy + sh * 0.06, by = sy + sh - sh * 0.06 - rh;
        out += `<rect x="${sx + 12}" y="${ty}" width="${sw - 24}" height="${rh}" fill="${frame}" rx="2"/>`;
        out += `<rect x="${sx + 12}" y="${by}" width="${sw - 24}" height="${rh}" fill="${frame}" rx="2"/>`;
        out += `<line x1="${sx + 14}" y1="${ty + rh}" x2="${sx + sw - 14}" y2="${by}" stroke="${frame}" stroke-width="${sw * 0.035}" stroke-linecap="round"/>`;
        out += `<rect x="${sx + 12}" y="${ty}" width="${sw - 24}" height="3" fill="${adj(frame, 25)}" opacity="0.5" rx="2"/>`;
        out += `<rect x="${sx + 12}" y="${by}" width="${sw - 24}" height="3" fill="${adj(frame, 25)}" opacity="0.5" rx="2"/>`;
        for (let i = 1; i < 5; i++) {
          const xx = sx + (sw * i / 5);
          out += `<line x1="${xx}" y1="${sy}" x2="${xx}" y2="${sy + sh}" stroke="${adj(dc, -50)}" stroke-width="1" opacity="0.55"/>`;
        }
      }

      // Hardware
      const HX = localHingeLeft ? sx + sw - sw * 0.13 : sx + sw * 0.13;
      const HY = sy + sh * 0.45;
      const HINGEX = localHingeLeft ? sx + 2 : sx + sw - 8;
      const handleScale = sw / 280;

      if (hwStyle === "lever") {
        const lx = localHingeLeft ? HX - 30 * handleScale : HX + 8 * handleScale;
        out += `<rect x="${HX - 9 * handleScale}" y="${HY - 26 * handleScale}" width="${18 * handleScale}" height="${52 * handleScale}" fill="url(#metal-${uniq})" rx="3"/>
                <rect x="${HX - 7 * handleScale}" y="${HY - 24 * handleScale}" width="${14 * handleScale}" height="${48 * handleScale}" fill="${adj(hwc, 30)}" opacity="0.25" rx="2"/>
                <circle cx="${HX}" cy="${HY + 16 * handleScale}" r="${4 * handleScale}" fill="${adj(hwc, -40)}"/>
                <rect x="${lx}" y="${HY - 6 * handleScale}" width="${30 * handleScale}" height="${10 * handleScale}" fill="url(#metal-${uniq})" rx="5"/>
                <circle cx="${localHingeLeft ? lx : lx + 30 * handleScale}" cy="${HY - 1 * handleScale}" r="${6 * handleScale}" fill="url(#metalSphere-${uniq})"/>`;
      } else if (hwStyle === "knob") {
        out += `<rect x="${HX - 6 * handleScale}" y="${HY - 22 * handleScale}" width="${12 * handleScale}" height="${44 * handleScale}" fill="url(#metal-${uniq})" rx="2"/>
                <circle cx="${HX}" cy="${HY}" r="${15 * handleScale}" fill="url(#metalSphere-${uniq})"/>
                <circle cx="${HX - 3 * handleScale}" cy="${HY - 3 * handleScale}" r="${4 * handleScale}" fill="${adj(hwc, 60)}" opacity="0.5"/>`;
      } else if (hwStyle === "bar") {
        out += `<rect x="${HX - 6 * handleScale}" y="${HY - 36 * handleScale}" width="${12 * handleScale}" height="${12 * handleScale}" fill="url(#metal-${uniq})" rx="2"/>
                <rect x="${HX - 6 * handleScale}" y="${HY + 24 * handleScale}" width="${12 * handleScale}" height="${12 * handleScale}" fill="url(#metal-${uniq})" rx="2"/>
                <rect x="${HX - 7 * handleScale}" y="${HY - 26 * handleScale}" width="${14 * handleScale}" height="${60 * handleScale}" fill="url(#metal-${uniq})" rx="6"/>
                <rect x="${HX - 4 * handleScale}" y="${HY - 24 * handleScale}" width="${6 * handleScale}" height="${56 * handleScale}" fill="${adj(hwc, 35)}" opacity="0.3" rx="5"/>`;
      } else if (hwStyle === "ring") {
        out += `<circle cx="${HX}" cy="${HY}" r="${17 * handleScale}" fill="url(#metalSphere-${uniq})"/>
                <circle cx="${HX}" cy="${HY}" r="${11 * handleScale}" fill="${dc}" stroke="${adj(hwc, -25)}" stroke-width="${1 * handleScale}"/>
                <circle cx="${HX}" cy="${HY}" r="${4 * handleScale}" fill="${adj(hwc, -35)}"/>`;
      }

      // Hinges
      const hingeYs = [sy + sh * 0.08, sy + sh * 0.5, sy + sh * 0.92];
      if (styleForBay !== "barn") {
        hingeYs.forEach(hy => {
          out += `<rect x="${HINGEX}" y="${hy - 14}" width="6" height="28" fill="url(#metal-${uniq})" rx="0.5"/>
                  <circle cx="${HINGEX + 3}" cy="${hy - 8}" r="0.8" fill="${adj(hwc, -45)}"/>
                  <circle cx="${HINGEX + 3}" cy="${hy + 8}" r="0.8" fill="${adj(hwc, -45)}"/>`;
        });
      } else {
        const trackY = doorBayY - 8;
        out += `<rect x="${bay.x - 10}" y="${trackY - 4}" width="${bay.w + 20}" height="6" fill="${adj(hwc, -30)}"/>
                <rect x="${bay.x - 10}" y="${trackY - 4}" width="${bay.w + 20}" height="2" fill="${adj(hwc, 20)}" opacity="0.5"/>
                <circle cx="${sx + sw * 0.2}" cy="${trackY - 1}" r="6" fill="url(#metalSphere-${uniq})"/>
                <circle cx="${sx + sw * 0.8}" cy="${trackY - 1}" r="6" fill="url(#metalSphere-${uniq})"/>`;
      }

      // Slab edge highlights
      out += `<rect x="${sx}" y="${sy}" width="2" height="${sh}" fill="${hi}" opacity="0.4"/>
              <rect x="${sx + sw - 1.5}" y="${sy}" width="1.5" height="${sh}" fill="${adj(dc, -50)}" opacity="0.5"/>`;

      return out;
    }

    function drawSideliteBay(bay) {
      const slabInset = bay.w * 0.06;
      const sx = bay.x + slabInset;
      const sy = doorBayY + slabInset * 0.4;
      const sw = bay.w - slabInset * 2;
      const sh = doorBayH - slabInset * 0.4;
      let out = "";
      // Frame around sidelite
      out += `<rect x="${bay.x}" y="${doorBayY}" width="${bay.w}" height="${doorBayH}" fill="${frame}"/>`;
      // Glass
      const glassMode = sideliteGlass || "frosted";
      out += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="url(#glass-${uniq})"/>`;
      if (glassMode === "frosted") {
        out += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#EAEEF1" opacity="0.65"/>`;
        for (let i = 1; i < 18; i++) {
          const yy = sy + (sh * i / 18);
          out += `<line x1="${sx}" y1="${yy}" x2="${sx + sw}" y2="${yy}" stroke="#fff" stroke-width="0.5" opacity="0.4"/>`;
        }
      } else if (glassMode === "decorative") {
        // Stained-glass-look grid
        const cols = 2, rows = 8;
        for (let r = 0; r < rows; r++) {
          const yy = sy + (sh * r / rows);
          out += `<line x1="${sx}" y1="${yy}" x2="${sx + sw}" y2="${yy}" stroke="#7494AA" stroke-width="0.6" opacity="0.7"/>`;
        }
        for (let c = 1; c < cols; c++) {
          const xx = sx + (sw * c / cols);
          out += `<line x1="${xx}" y1="${sy}" x2="${xx}" y2="${sy + sh}" stroke="#7494AA" stroke-width="0.6" opacity="0.7"/>`;
        }
      } else {
        // Clear — soft corner highlights
        out += `<polygon points="${sx},${sy} ${sx + sw * 0.5},${sy} ${sx},${sy + sh * 0.35}" fill="#fff" opacity="0.18"/>`;
      }
      // Bevel
      out += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="none" stroke="${adj(dc, -45)}" stroke-width="1" opacity="0.55"/>`;
      out += `<line x1="${sx}" y1="${sy}" x2="${sx + sw}" y2="${sy}" stroke="${adj(dc, -55)}" stroke-width="1.2"/>`;
      return out;
    }

    function drawTransom() {
      if (!hasTransom) return "";
      const tx = fx, ty = fy, tw = fw, th = transomH - 4;
      let out = "";
      out += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="${frame}"/>`;
      const insetX = tw * 0.03, insetY = th * 0.18;
      const ix = tx + insetX, iy = ty + insetY;
      const iw = tw - insetX * 2, ih = th - insetY * 2;
      if (transom === "half-round") {
        const r = ih * 0.95;
        out += `<defs><clipPath id="transom-clip-${uniq}"><path d="M${ix},${iy + ih} L${ix},${iy + ih - r * 0.1} Q${ix + iw/2},${iy - r * 0.4} ${ix + iw},${iy + ih - r * 0.1} L${ix + iw},${iy + ih} Z"/></clipPath></defs>`;
        out += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#glass-${uniq})" clip-path="url(#transom-clip-${uniq})"/>`;
        // Radial mullions
        for (let i = 1; i < 7; i++) {
          const angle = Math.PI * (i / 7);
          const x2 = ix + iw/2 + Math.cos(Math.PI + angle) * iw * 0.5;
          const y2 = iy + ih + Math.sin(Math.PI + angle) * iw * 0.5;
          out += `<line x1="${ix + iw/2}" y1="${iy + ih}" x2="${x2}" y2="${y2}" stroke="${adj(dc, -55)}" stroke-width="1" opacity="0.6" clip-path="url(#transom-clip-${uniq})"/>`;
        }
        out += `<path d="M${ix},${iy + ih - r * 0.1} Q${ix + iw/2},${iy - r * 0.4} ${ix + iw},${iy + ih - r * 0.1}" fill="none" stroke="${adj(dc, -55)}" stroke-width="1.5"/>`;
      } else if (transom === "arched") {
        out += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#glass-${uniq})"/>`;
        out += `<path d="M${ix},${iy + ih * 0.4} Q${ix + iw/2},${iy - ih * 0.1} ${ix + iw},${iy + ih * 0.4}" fill="none" stroke="${adj(dc, -55)}" stroke-width="1.2"/>`;
      } else {
        // Rectangular
        out += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#glass-${uniq})"/>`;
        // Two mullions
        out += `<line x1="${ix + iw/3}" y1="${iy}" x2="${ix + iw/3}" y2="${iy + ih}" stroke="${adj(dc, -55)}" stroke-width="1"/>`;
        out += `<line x1="${ix + iw * 2/3}" y1="${iy}" x2="${ix + iw * 2/3}" y2="${iy + ih}" stroke="${adj(dc, -55)}" stroke-width="1"/>`;
      }
      out += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="none" stroke="${adj(dc, -55)}" stroke-width="1.2"/>`;
      // Header rail under transom
      out += `<rect x="${tx}" y="${ty + th}" width="${tw}" height="4" fill="${adj(frame, -10)}"/>`;
      return out;
    }

    // ── Panel factory (shared between bays) ──
    function panel(x, y, pw, ph, sx, sy, sw, sh, withGlass) {
      const inset = Math.max(3, Math.min(pw, ph) * 0.04);
      let s = "";
      s += `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="${adj(dc, -30)}"/>`;
      const ix = x + inset, iy = y + inset, iw = pw - inset * 2, ih = ph - inset * 2;
      if (withGlass && glass !== "none") {
        s += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#glass-${uniq})"/>`;
        if (glass === "frosted") {
          s += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="#EAEEF1" opacity="0.62"/>`;
          for (let i = 1; i < 9; i++) {
            const yy = iy + (ih * i / 9);
            s += `<line x1="${ix}" y1="${yy}" x2="${ix + iw}" y2="${yy}" stroke="white" stroke-width="0.6" opacity="0.4"/>`;
          }
        } else if (glass === "decorative") {
          s += `<line x1="${ix}" y1="${iy + ih * 0.5}" x2="${ix + iw}" y2="${iy + ih * 0.5}" stroke="#7494AA" stroke-width="0.8" opacity="0.6"/>`;
          s += `<line x1="${ix + iw * 0.5}" y1="${iy}" x2="${ix + iw * 0.5}" y2="${iy + ih}" stroke="#7494AA" stroke-width="0.8" opacity="0.6"/>`;
          s += `<ellipse cx="${ix + iw / 2}" cy="${iy + ih / 2}" rx="${iw * 0.28}" ry="${ih * 0.28}" stroke="#5A7A90" stroke-width="1" fill="none" opacity="0.7"/>`;
          s += `<ellipse cx="${ix + iw / 2}" cy="${iy + ih / 2}" rx="${iw * 0.16}" ry="${ih * 0.16}" stroke="#5A7A90" stroke-width="0.8" fill="none" opacity="0.55"/>`;
        } else {
          s += `<polygon points="${ix},${iy} ${ix + iw * 0.55},${iy} ${ix},${iy + ih * 0.45}" fill="white" opacity="0.25"/>`;
          s += `<polygon points="${ix + iw * 0.7},${iy + ih * 0.6} ${ix + iw},${iy + ih * 0.6} ${ix + iw},${iy + ih}" fill="white" opacity="0.15"/>`;
        }
      } else {
        s += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${dc}"/>`;
        if (mat.wood) {
          s += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" filter="url(#grain-${uniq})" opacity="0.75"/>`;
        }
        s += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#light-${uniq})" opacity="0.5"/>`;
      }
      s += `<polygon points="${x},${y} ${x + pw},${y} ${ix + iw},${iy} ${ix},${iy} ${ix},${iy + ih} ${x},${y + ph}" fill="black" opacity="0.22"/>`;
      s += `<polygon points="${x + pw},${y} ${x + pw},${y + ph} ${x},${y + ph} ${ix},${iy + ih} ${ix + iw},${iy + ih} ${ix + iw},${iy}" fill="white" opacity="0.10"/>`;
      s += `<line x1="${x}" y1="${y}" x2="${x + pw}" y2="${y}" stroke="${adj(dc, -55)}" stroke-width="0.8" opacity="0.6"/>`;
      s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + ph}" stroke="${adj(dc, -55)}" stroke-width="0.8" opacity="0.5"/>`;
      s += `<line x1="${x + pw}" y1="${y}" x2="${x + pw}" y2="${y + ph}" stroke="${hi}" stroke-width="0.6" opacity="0.35"/>`;
      s += `<line x1="${x}" y1="${y + ph}" x2="${x + pw}" y2="${y + ph}" stroke="${hi}" stroke-width="0.6" opacity="0.4"/>`;
      return s;
    }

    // Draw mullions between bays
    let mullions = "";
    for (let i = 0; i < bays.length - 1; i++) {
      const mx = bays[i].x + bays[i].w;
      mullions += `<rect x="${mx}" y="${doorBayY}" width="${mullion}" height="${doorBayH}" fill="${frame}"/>`;
      mullions += `<rect x="${mx}" y="${doorBayY}" width="${mullion * 0.4}" height="${doorBayH}" fill="${adj(frame, -20)}" opacity="0.5"/>`;
    }

    // Render all bays
    let bayContent = "";
    bays.forEach((bay, idx) => {
      if (bay.type === "door")     bayContent += drawDoorBay(bay, idx);
      else if (bay.type === "sidelite") bayContent += drawSideliteBay(bay);
    });

    // ── Floor reflection (subtle, spanning all door bays) ─────
    let reflectionContent = "";
    bays.filter(b => b.type === "door").forEach(bay => {
      const slabInset = bay.w * 0.035;
      const sx = bay.x + slabInset;
      const sy = doorBayY + slabInset * 0.5;
      const sw = bay.w - slabInset * 2;
      const sh = doorBayH - slabInset * 0.5;
      reflectionContent += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${dc}"/>`;
    });
    const reflection = `
      <g transform="translate(0, ${floorY * 2}) scale(1, -1)" opacity="0.18" clip-path="inset(${h - floorY}px 0 0 0)">
        ${reflectionContent}
      </g>
      <rect x="0" y="${floorY}" width="${w}" height="${(h - floorY) * 0.6}" fill="url(#reflect-${uniq})"/>
    `;

    return `
      ${defs}
      ${backdrop}
      ${casing}
      ${reflection}
      ${drawTransom()}
      ${bayContent}
      ${mullions}
    `;
  }

  // ── Shop scene (for craftsmanship/about) ───────────────────
  function renderShopScene(w, h) {
    return `
      <defs>
        <radialGradient id="shop-bg" cx="30%" cy="20%" r="100%">
          <stop offset="0%" stop-color="#5A4632"/>
          <stop offset="100%" stop-color="#1A1108"/>
        </radialGradient>
        <linearGradient id="shop-wood" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stop-color="#8B6438"/>
          <stop offset="50%" stop-color="#6B4828"/>
          <stop offset="100%" stop-color="#4A2C18"/>
        </linearGradient>
        <filter id="shop-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.6" numOctaves="2" seed="3"/>
          <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0.7 0 0 0 0"/>
        </filter>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#shop-bg)"/>
      <!-- Workbench -->
      <rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.38}" fill="url(#shop-wood)"/>
      <rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.38}" filter="url(#shop-grain)" opacity="0.6"/>
      <!-- Plank being worked on -->
      <rect x="${w * 0.1}" y="${h * 0.55}" width="${w * 0.8}" height="${h * 0.1}" fill="#9C7444"/>
      <rect x="${w * 0.1}" y="${h * 0.55}" width="${w * 0.8}" height="${h * 0.1}" filter="url(#shop-grain)" opacity="0.4"/>
      <rect x="${w * 0.1}" y="${h * 0.55}" width="${w * 0.8}" height="3" fill="#C49870" opacity="0.5"/>
      <!-- Plane tool -->
      <g transform="translate(${w * 0.35}, ${h * 0.48})">
        <rect x="0" y="0" width="${w * 0.22}" height="${h * 0.06}" fill="#2A2520" rx="3"/>
        <rect x="${w * 0.02}" y="${-h * 0.025}" width="${w * 0.18}" height="${h * 0.04}" fill="#8B6438"/>
        <rect x="${w * 0.04}" y="${-h * 0.04}" width="${w * 0.14}" height="${h * 0.015}" fill="#3A2D1E"/>
      </g>
      <!-- Light beams -->
      <polygon points="${w * 0.7},0 ${w * 0.95},0 ${w * 0.75},${h * 0.6} ${w * 0.55},${h * 0.6}"
               fill="#F5E5C0" opacity="0.08"/>
      <polygon points="${w * 0.1},0 ${w * 0.3},0 ${w * 0.25},${h * 0.5} ${w * 0.05},${h * 0.5}"
               fill="#F5E5C0" opacity="0.05"/>
      <!-- Shavings -->
      ${Array.from({length: 12}).map((_, i) => {
        const xx = 0.2 + (i * 0.06);
        const yy = 0.62 + (i % 3) * 0.02;
        return `<path d="M${w * xx},${h * yy} q5,-5 10,0 q5,5 10,0" stroke="#D4A96A" stroke-width="1.5" fill="none" opacity="0.7"/>`;
      }).join("")}
    `;
  }

  // ── Public API ─────────────────────────────────────────────
  window.DOOR_DATA = {
    DOOR_STYLES, MATERIALS, HARDWARE_STYLES, HARDWARE_FINISHES,
    GLASS_OPTIONS, SIZES, SPRICES, BASE,
  };
  window.renderDoorScene = renderDoorScene;
  window.renderShopScene = renderShopScene;
})();
