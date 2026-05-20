import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────
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
  { id: "oak",       label: "White Oak",   color: "#BF934A", wood: true,  price: 200 },
  { id: "walnut",    label: "Walnut",      color: "#4A2C1A", wood: true,  price: 350 },
  { id: "cherry",    label: "Cherry",      color: "#7B3D2E", wood: true,  price: 280 },
  { id: "maple",     label: "Hard Maple",  color: "#D4A96A", wood: true,  price: 230 },
  { id: "white",     label: "White",       color: "#EEE9E0", wood: false, price: 0   },
  { id: "black",     label: "Midnight",    color: "#191917", wood: false, price: 0   },
  { id: "navy",      label: "Navy",        color: "#1C3856", wood: false, price: 0   },
  { id: "sage",      label: "Sage",        color: "#5E8A67", wood: false, price: 0   },
  { id: "terracotta",label: "Terracotta",  color: "#B5512E", wood: false, price: 0   },
  { id: "charcoal",  label: "Charcoal",    color: "#3B3A37", wood: false, price: 0   },
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
  { id: "mblack", label: "Matte Black",     color: "#2B2B2B" },
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

// ─── Colour Helpers ───────────────────────────────────────────
function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}
function adj(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return `#${[c(r), c(g), c(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

// ─── Door SVG ─────────────────────────────────────────────────
function DoorSVG({ doorStyle, mat, hwStyle, hwFinish, glass, hingeLeft }) {
  const dc    = mat.color;
  const frame = adj(dc, mat.wood ? -30 : -20);
  const deep  = adj(dc, mat.wood ? -22 : -14);
  const hi    = adj(dc, mat.wood ? +22 : +16);
  const hwc   = hwFinish.color;

  // Geometry
  const FX = 68, FY = 25, FW = 164, FH = 472;
  const SX = FX + 7, SY = FY + 7, SW = FW - 14, SH = FH - 7;
  const PM = 12, PG = 8;
  const PX1 = SX + PM, PW2 = (SW - PM * 2 - PG) / 2, PX2 = PX1 + PW2 + PG;
  const PYS = SY + PM, PAVAIL = SH - PM * 2;

  const HX = hingeLeft ? SX + SW - 18 : SX + 18;
  const HY = SY + SH * 0.44;
  const HINGEX = hingeLeft ? SX + 1 : SX + SW - 11;

  // ── Panel factories ──────────────────────────────────────────
  const bevel = (x, y, w, h, key, useGlass) => {
    const glFill = {
      clear:      "#C8DCEA",
      frosted:    "#D8E6EE",
      decorative: "#C0D4E4",
    }[glass] || null;
    return (
      <g key={key}>
        <rect x={x} y={y} width={w} height={h} fill={deep} />
        {useGlass && glFill && (
          <>
            <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill={glFill} opacity={0.65} />
            {glass === "frosted" && (
              <>
                {[0.2, 0.4, 0.6, 0.8].map((t) => (
                  <line key={t} x1={x + 2} y1={y + 2 + (h - 4) * t} x2={x + w - 2} y2={y + 2 + (h - 4) * t} stroke="white" strokeWidth={0.5} opacity={0.35} />
                ))}
              </>
            )}
            {glass === "decorative" && (
              <>
                <line x1={x + 2} y1={y + 2} x2={x + w - 2} y2={y + h - 2} stroke="#9DBBD0" strokeWidth={1} opacity={0.45} />
                <line x1={x + w - 2} y1={y + 2} x2={x + 2} y2={y + h - 2} stroke="#9DBBD0" strokeWidth={1} opacity={0.45} />
                <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.25} ry={h * 0.28} stroke="#A8C8DC" strokeWidth={1} fill="none" opacity={0.5} />
              </>
            )}
            {glass === "clear" && (
              <rect x={x + 4} y={y + 4} width={8} height={8} fill="white" opacity={0.3} rx={1} />
            )}
          </>
        )}
        {/* Bevel shadows */}
        <rect x={x} y={y} width={w} height={2} fill={adj(dc, -40)} opacity={0.55} />
        <rect x={x} y={y} width={2} height={h} fill={adj(dc, -40)} opacity={0.55} />
        <rect x={x} y={y + h - 2} width={w} height={2} fill={hi} opacity={0.55} />
        <rect x={x + w - 2} y={y} width={2} height={h} fill={hi} opacity={0.55} />
      </g>
    );
  };

  // ── Styles ───────────────────────────────────────────────────
  const panels = [];

  if (doorStyle === "two-panel") {
    const h = (PAVAIL - PG) / 2;
    panels.push(bevel(PX1, PYS, SW - PM * 2, h, "a"));
    panels.push(bevel(PX1, PYS + h + PG, SW - PM * 2, h, "b"));
  }

  if (doorStyle === "four-panel") {
    const h = (PAVAIL - PG) / 2;
    panels.push(bevel(PX1, PYS, PW2, h, "a"));
    panels.push(bevel(PX2, PYS, PW2, h, "b"));
    panels.push(bevel(PX1, PYS + h + PG, PW2, h, "c"));
    panels.push(bevel(PX2, PYS + h + PG, PW2, h, "d"));
  }

  if (doorStyle === "six-panel") {
    const th = Math.round(PAVAIL * 0.21);
    const mh = Math.round(PAVAIL * 0.46);
    const bh = PAVAIL - th * 2 - PG * 2;
    const y1 = PYS, y2 = y1 + th + PG, y3 = y2 + mh + PG;
    panels.push(bevel(PX1, y1, PW2, th, "a"));
    panels.push(bevel(PX2, y1, PW2, th, "b"));
    panels.push(bevel(PX1, y2, PW2, mh, "c", true));
    panels.push(bevel(PX2, y2, PW2, mh, "d", true));
    panels.push(bevel(PX1, y3, PW2, bh, "e"));
    panels.push(bevel(PX2, y3, PW2, bh, "f"));
  }

  if (doorStyle === "craftsman") {
    const th = Math.round(PAVAIL * 0.28);
    const bh = PAVAIL - th - PG;
    panels.push(bevel(PX1, PYS, PW2, th, "a", true));
    panels.push(bevel(PX2, PYS, PW2, th, "b", true));
    panels.push(bevel(PX1, PYS + th + PG, SW - PM * 2, bh, "c"));
  }

  if (doorStyle === "arch") {
    // arch-shaped panel
    const aw = SW - PM * 2, ah = PAVAIL;
    const ar = aw * 0.45;
    const ax = PX1, ay = PYS;
    panels.push(
      <g key="arch">
        <clipPath id="arch-clip">
          <path d={`M${ax},${ay + ar} Q${ax + aw / 2},${ay - ar * 0.3} ${ax + aw},${ay + ar} L${ax + aw},${ay + ah} L${ax},${ay + ah} Z`} />
        </clipPath>
        <rect x={ax} y={ay} width={aw} height={ah} fill={deep} clipPath="url(#arch-clip)" />
        {glass !== "none" && (
          <rect x={ax + 2} y={ay + ar * 0.2} width={aw - 4} height={ah - ar * 0.2 - 2} fill="#C8DCEA" opacity={0.55} clipPath="url(#arch-clip)" />
        )}
        <path d={`M${ax},${ay + ar} Q${ax + aw / 2},${ay - ar * 0.3} ${ax + aw},${ay + ar}`} stroke={adj(dc, -40)} strokeWidth={2} fill="none" opacity={0.55} />
        <line x1={ax} y1={ay + ar} x2={ax} y2={ay + ah} stroke={adj(dc, -40)} strokeWidth={2} opacity={0.55} />
        <line x1={ax + aw} y1={ay + ar} x2={ax + aw} y2={ay + ah} stroke={adj(dc, -40)} strokeWidth={2} opacity={0.55} />
        <line x1={ax} y1={ay + ah} x2={ax + aw} y2={ay + ah} stroke={hi} strokeWidth={2} opacity={0.55} />
      </g>
    );
  }

  if (doorStyle === "dutch") {
    const splitH = SH * 0.46;
    const splitY = SY + splitH;
    const th = splitH - PM * 1.5;
    const bh = SH - splitH - PM * 1.5;
    panels.push(bevel(PX1, PYS, PW2, th, "a"));
    panels.push(bevel(PX2, PYS, PW2, th, "b"));
    panels.push(
      <g key="rail">
        <rect x={SX} y={splitY - 5} width={SW} height={10} fill={adj(frame, +8)} />
        <rect x={SX} y={splitY - 5} width={SW} height={2}  fill={adj(dc, -35)} opacity={0.5} />
        <rect x={SX} y={splitY + 3} width={SW} height={2}  fill={hi}           opacity={0.5} />
      </g>
    );
    panels.push(bevel(PX1, splitY + 6, PW2, bh, "c"));
    panels.push(bevel(PX2, splitY + 6, PW2, bh, "d"));
  }

  if (doorStyle === "barn") {
    const rh = 16;
    const ty = SY + 20, by = SY + SH - 20 - rh;
    panels.push(
      <g key="barn">
        <rect x={SX + 8} y={ty} width={SW - 16} height={rh} fill={frame} rx={2} />
        <rect x={SX + 8} y={by} width={SW - 16} height={rh} fill={frame} rx={2} />
        <line x1={SX + 10} y1={ty + rh} x2={SX + SW - 10} y2={by} stroke={frame} strokeWidth={12} strokeLinecap="round" />
        {/* rail highlight */}
        <rect x={SX + 8} y={ty} width={SW - 16} height={3} fill={adj(frame, 15)} opacity={0.4} rx={2} />
        <rect x={SX + 8} y={by} width={SW - 16} height={3} fill={adj(frame, 15)} opacity={0.4} rx={2} />
      </g>
    );
  }

  // ── Hardware ─────────────────────────────────────────────────
  const hardware = (() => {
    if (hwStyle === "lever") {
      const lx = hingeLeft ? HX + 7 : HX - 34;
      return (
        <g>
          <rect x={HX - 7} y={HY - 22} width={14} height={44} fill={hwc} rx={3} />
          <rect x={HX - 5} y={HY - 20} width={10} height={40} fill={adj(hwc, 12)} opacity={0.3} rx={2} />
          <circle cx={HX} cy={HY + 14} r={3.5} fill={adj(hwc, -30)} />
          <rect x={lx} y={HY - 5} width={30} height={8} fill={hwc} rx={4} />
          <circle cx={hingeLeft ? lx + 30 : lx} cy={HY - 1} r={5.5} fill={hwc} />
          <circle cx={hingeLeft ? lx + 30 : lx} cy={HY - 2} r={2} fill={adj(hwc, 25)} opacity={0.5} />
        </g>
      );
    }
    if (hwStyle === "knob") {
      return (
        <g>
          <rect x={HX - 5} y={HY - 20} width={10} height={40} fill={hwc} rx={2} />
          <circle cx={HX} cy={HY} r={13} fill={hwc} />
          <circle cx={HX} cy={HY} r={9}  fill={adj(hwc, 18)} opacity={0.35} />
          <circle cx={HX - 3} cy={HY - 3} r={3} fill={adj(hwc, 40)} opacity={0.35} />
          <circle cx={HX} cy={HY} r={2.5} fill={adj(hwc, -25)} />
        </g>
      );
    }
    if (hwStyle === "bar") {
      return (
        <g>
          <rect x={HX - 5} y={HY - 32} width={10} height={10} fill={hwc} rx={2} />
          <rect x={HX - 5} y={HY + 22} width={10} height={10} fill={hwc} rx={2} />
          <rect x={HX - 6} y={HY - 22} width={12} height={52} fill={hwc} rx={5} />
          <rect x={HX - 4} y={HY - 20} width={5}  height={48} fill={adj(hwc, 20)} opacity={0.25} rx={4} />
        </g>
      );
    }
    if (hwStyle === "ring") {
      return (
        <g>
          <circle cx={HX} cy={HY} r={15}   fill={hwc} />
          <circle cx={HX} cy={HY} r={10}   fill="none" stroke={adj(hwc, 22)} strokeWidth={5} />
          <circle cx={HX} cy={HY} r={10}   fill="none" stroke={adj(hwc, -20)} strokeWidth={1} />
          <circle cx={HX} cy={HY} r={3.5}  fill={adj(hwc, -25)} />
          <circle cx={HX - 2} cy={HY - 2} r={1.5} fill={adj(hwc, 35)} opacity={0.45} />
        </g>
      );
    }
    return null;
  })();

  // Hinges
  const hinges = [SY + 55, SY + SH / 2, SY + SH - 55].map((hy, i) => (
    <g key={i}>
      <rect x={HINGEX} y={hy - 16} width={10} height={32} fill={hwc} rx={1} />
      <rect x={HINGEX + 2} y={hy - 14} width={6} height={28} fill={adj(hwc, 14)} opacity={0.3} rx={1} />
    </g>
  ));

  const wallC   = "#DDD7CC";
  const floorC  = "#BCA882";
  const floorY  = FY + FH;

  return (
    <svg
      viewBox="0 0 300 520"
      style={{ width: "100%", maxWidth: "260px", height: "auto", display: "block" }}
      aria-label={`Door preview — ${doorStyle} style, ${mat.label} finish`}
    >
      <defs>
        <filter id="dshadow" x="-10%" y="-5%" width="130%" height="120%">
          <feDropShadow dx="3" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Wall */}
      <rect width="300" height="520" fill={wallC} />
      {/* Subtle wall texture lines */}
      {[60, 130, 200, 270].map((y) => (
        <line key={y} x1="0" y1={y} x2="300" y2={y} stroke={adj(wallC, -8)} strokeWidth="0.4" opacity="0.4" />
      ))}

      {/* Floor */}
      <rect y={floorY} width="300" height={520 - floorY} fill={floorC} />
      {/* Floor planks */}
      {[0, 38, 76, 114, 152, 190, 228, 266, 300].map((x) => (
        <line key={x} x1={x} y1={floorY} x2={x + 30} y2="520" stroke={adj(floorC, -12)} strokeWidth="0.6" opacity="0.6" />
      ))}
      {[floorY + 22, floorY + 44].map((y) => (
        <line key={y} x1="0" y1={y} x2="300" y2={y} stroke={adj(floorC, -10)} strokeWidth="0.5" opacity="0.5" />
      ))}

      {/* Baseboard */}
      <rect y={floorY - 9} width="300" height="9" fill={adj(wallC, -18)} />
      <rect y={floorY - 9} width="300" height="2"  fill={adj(wallC, -28)} opacity="0.6" />
      <rect y={floorY - 11} width="300" height="2" fill={adj(wallC, +10)} opacity="0.4" />

      {/* Door casing outer */}
      <rect x={FX - 6} y={FY - 6} width={FW + 12} height={FH + 2} fill={adj(wallC, -12)} rx="2" />
      <rect x={FX - 6} y={FY - 6} width={FW + 12} height="4" fill={adj(wallC, +8)} opacity="0.4" />

      {/* Frame */}
      <rect x={FX} y={FY} width={FW} height={FH} fill={frame} />

      {/* Door shadow */}
      <rect x={SX + 4} y={SY + 4} width={SW} height={SH} fill="rgba(0,0,0,0.18)" filter="url(#dshadow)" />

      {/* Door slab */}
      <rect x={SX} y={SY} width={SW} height={SH} fill={dc} />

      {/* Wood grain */}
      {mat.wood && (
        <g clipPath="none" opacity="0.055">
          {Array.from({ length: 14 }).map((_, i) => (
            <path
              key={i}
              d={`M${SX},${SY + i * 36 + 8} Q${SX + SW * 0.4},${SY + i * 36 + 2} ${SX + SW},${SY + i * 36 + 11}`}
              stroke="rgba(0,0,0,1)" strokeWidth="1.2" fill="none"
            />
          ))}
        </g>
      )}

      {/* Panels */}
      {panels}

      {/* Hinges */}
      {hinges}

      {/* Hardware */}
      {hardware}

      {/* Slab edge highlights */}
      <rect x={SX}          y={SY}          width="2"  height={SH} fill={hi}            opacity="0.35" />
      <rect x={SX}          y={SY}          width={SW} height="2"  fill={hi}            opacity="0.25" />
      <rect x={SX + SW - 2} y={SY}          width="2"  height={SH} fill={adj(dc, -35)} opacity="0.3" />

      {/* Frame inner edge */}
      <rect x={FX} y={FY} width={FW} height="3" fill={adj(frame, 18)} opacity="0.35" />
      <rect x={FX} y={FY} width="3"  height={FH} fill={adj(frame, 18)} opacity="0.25" />
    </svg>
  );
}

// ─── UI Primitives ────────────────────────────────────────────
const S = {
  pill: (active) => ({
    padding: "9px 12px",
    background: active ? "#1C1814" : "transparent",
    color: active ? "#F5F0E8" : "#4A4238",
    border: `1px solid ${active ? "#1C1814" : "#CCC4B4"}`,
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "inherit",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    transition: "all 0.13s ease",
    textAlign: "left",
  }),
  pillCompact: (active) => ({
    padding: "7px 14px",
    background: active ? "#1C1814" : "transparent",
    color: active ? "#F5F0E8" : "#4A4238",
    border: `1px solid ${active ? "#1C1814" : "#CCC4B4"}`,
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    transition: "all 0.13s ease",
  }),
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{
        fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase",
        color: "#8A7860", marginBottom: "10px", fontWeight: "500",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Pill({ label, active, onClick, price }) {
  return (
    <button style={S.pill(active)} onClick={onClick}>
      <span>{label}</span>
      {price > 0 && (
        <span style={{ fontSize: "11px", color: active ? "#B0A898" : "#9A8F80" }}>+${price}</span>
      )}
    </button>
  );
}

function PillSmall({ label, active, onClick }) {
  return (
    <button style={S.pillCompact(active)} onClick={onClick}>
      {label}
    </button>
  );
}

function Swatch({ label, color, active, onClick }) {
  const outline = isLight(color) ? "#1C1814" : "#F5F0E8";
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      style={{
        width: "34px", height: "34px",
        background: color,
        borderRadius: "50%",
        border: active ? `2.5px solid ${outline}` : "2.5px solid transparent",
        outline: active ? `2px solid ${color}` : "none",
        outlineOffset: "2px",
        cursor: "pointer",
        transition: "transform 0.12s, outline 0.12s",
        transform: active ? "scale(1.12)" : "scale(1)",
      }}
    />
  );
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  const [doorStyle,  setDoorStyle]  = useState("six-panel");
  const [matId,      setMatId]      = useState("oak");
  const [hwStyle,    setHwStyle]    = useState("lever");
  const [hwFinishId, setHwFinishId] = useState("brass");
  const [glass,      setGlass]      = useState("none");
  const [sizeIdx,    setSizeIdx]    = useState(2);
  const [hingeLeft,  setHingeLeft]  = useState(true);

  const mat      = MATERIALS.find((m) => m.id === matId);
  const hwFinish = HARDWARE_FINISHES.find((h) => h.id === hwFinishId);
  const styleC   = DOOR_STYLES.find((s) => s.id === doorStyle);
  const glassC   = GLASS_OPTIONS.find((g) => g.id === glass);
  const hwStyleC = HARDWARE_STYLES.find((h) => h.id === hwStyle);

  const total =
    BASE +
    (styleC?.price  || 0) +
    (mat?.price     || 0) +
    (hwStyleC?.price || 0) +
    (glassC?.price  || 0) +
    SPRICES[sizeIdx];

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#F7F2EB",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      color: "#1C1814",
    }}>

      {/* ── Left: Sticky Preview ───────────────────────── */}
      <div style={{
        width: "46%",
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#EDE7DC",
        borderRight: "1px solid #D4CABC",
        padding: "2rem 1.5rem",
        gap: "1.25rem",
      }}>
        {/* Top label */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9A8870", marginBottom: "2px" }}>
            Live Preview
          </div>
          <div style={{ fontSize: "12px", color: "#6A5E50" }}>
            {SIZES[sizeIdx]} × 80″ &nbsp;·&nbsp; {hingeLeft ? "Left" : "Right"} hinge
          </div>
        </div>

        {/* Door */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <DoorSVG
            doorStyle={doorStyle}
            mat={mat}
            hwStyle={hwStyle}
            hwFinish={hwFinish}
            glass={glass}
            hingeLeft={hingeLeft}
          />
        </div>

        {/* Price */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A8870", marginBottom: "3px" }}>
            Estimated price
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: "300", letterSpacing: "-0.03em", lineHeight: 1 }}>
            ${total.toLocaleString()}
          </div>
        </div>

        {/* Material chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "6px 14px", background: "rgba(0,0,0,0.06)",
          borderRadius: "20px", fontSize: "12px", color: "#5A5040",
        }}>
          <span style={{
            width: "14px", height: "14px", borderRadius: "50%",
            background: mat?.color, display: "inline-block", flexShrink: 0,
            border: "1px solid rgba(0,0,0,0.12)",
          }} />
          {mat?.label} · {styleC?.label}
        </div>
      </div>

      {/* ── Right: Options ─────────────────────────────── */}
      <div style={{ width: "54%", overflowY: "auto", padding: "3rem 2.5rem", maxHeight: "100vh" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.75rem" }}>
          <h1 style={{ margin: "0 0 5px", fontSize: "1.65rem", fontWeight: "400", letterSpacing: "-0.02em" }}>
            Door Configurator
          </h1>
          <p style={{ margin: 0, color: "#8A7860", fontSize: "13px" }}>
            All changes reflect instantly in the preview.
          </p>
        </div>

        {/* Style */}
        <Section title="Door Style">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
            {DOOR_STYLES.map((s) => (
              <Pill key={s.id} label={s.label} active={doorStyle === s.id}
                onClick={() => setDoorStyle(s.id)} price={s.price} />
            ))}
          </div>
        </Section>

        {/* Material */}
        <Section title="Material">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginBottom: "14px" }}>
            {MATERIALS.filter((m) => m.wood).map((m) => (
              <Pill key={m.id} label={m.label} active={matId === m.id}
                onClick={() => setMatId(m.id)} price={m.price} />
            ))}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A8870", marginBottom: "10px" }}>
            Painted finishes (included)
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {MATERIALS.filter((m) => !m.wood).map((m) => (
              <Swatch key={m.id} label={m.label} color={m.color}
                active={matId === m.id} onClick={() => setMatId(m.id)} />
            ))}
            {!mat?.wood && (
              <span style={{ fontSize: "13px", color: "#5A5040", marginLeft: "4px" }}>
                {mat?.label}
              </span>
            )}
          </div>
        </Section>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #D4CABC", margin: "0.5rem 0 2rem" }} />

        {/* Hardware Style */}
        <Section title="Hardware Style">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
            {HARDWARE_STYLES.map((h) => (
              <Pill key={h.id} label={h.label} active={hwStyle === h.id}
                onClick={() => setHwStyle(h.id)} price={h.price} />
            ))}
          </div>
        </Section>

        {/* Hardware Finish */}
        <Section title="Hardware Finish">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {HARDWARE_FINISHES.map((h) => (
              <Swatch key={h.id} label={h.label} color={h.color}
                active={hwFinishId === h.id} onClick={() => setHwFinishId(h.id)} />
            ))}
            <span style={{ fontSize: "13px", color: "#5A5040", marginLeft: "4px" }}>
              {hwFinish?.label}
            </span>
          </div>
        </Section>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #D4CABC", margin: "0.5rem 0 2rem" }} />

        {/* Glass */}
        <Section title="Glass Insert">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
            {GLASS_OPTIONS.map((g) => (
              <Pill key={g.id} label={g.label} active={glass === g.id}
                onClick={() => setGlass(g.id)} price={g.price} />
            ))}
          </div>
        </Section>

        {/* Size */}
        <Section title="Door Width">
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {SIZES.map((s, i) => (
              <PillSmall key={s} label={s} active={sizeIdx === i} onClick={() => setSizeIdx(i)} />
            ))}
          </div>
          <div style={{ fontSize: "12px", color: "#9A8870", marginTop: "7px" }}>
            Standard height 80″ on all sizes
          </div>
        </Section>

        {/* Hinge Side */}
        <Section title="Swing Direction">
          <div style={{ display: "flex", gap: "6px" }}>
            <PillSmall label="Left hinge" active={hingeLeft}  onClick={() => setHingeLeft(true)}  />
            <PillSmall label="Right hinge" active={!hingeLeft} onClick={() => setHingeLeft(false)} />
          </div>
          <div style={{ fontSize: "12px", color: "#9A8870", marginTop: "7px" }}>
            Viewed from the exterior (pull side)
          </div>
        </Section>

        {/* Summary card */}
        <div style={{
          marginTop: "1rem",
          background: "#1C1814",
          color: "#F5F0E8",
          borderRadius: "4px",
          padding: "1.75rem",
        }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6A6058", marginBottom: "1.25rem" }}>
            Your configuration
          </div>

          {[
            ["Style",    styleC?.label],
            ["Material", mat?.label],
            ["Hardware", `${hwStyleC?.label}, ${hwFinish?.label}`],
            ["Glass",    glassC?.label],
            ["Size",     `${SIZES[sizeIdx]} × 80″`],
            ["Swing",    hingeLeft ? "Left-hand swing" : "Right-hand swing"],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between",
              padding: "7px 0", borderBottom: "1px solid #2E2B28", fontSize: "13px",
            }}>
              <span style={{ color: "#6A6058" }}>{k}</span>
              <span style={{ color: "#F5F0E8" }}>{v}</span>
            </div>
          ))}

          {/* Price breakdown */}
          <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid #3A3530" }}>
            {[
              ["Base door",  BASE],
              ["Style",      styleC?.price],
              ["Material",   mat?.price],
              ["Hardware",   hwStyleC?.price],
              ["Glass",      glassC?.price],
              ["Size",       SPRICES[sizeIdx]],
            ].filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                <span style={{ color: "#6A6058" }}>{k}</span>
                <span style={{ color: "#9A9088" }}>${v.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #3A3530",
          }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6A6058" }}>
              Total
            </span>
            <span style={{ fontSize: "1.9rem", fontWeight: "300", letterSpacing: "-0.025em" }}>
              ${total.toLocaleString()}
            </span>
          </div>

          <button style={{
            width: "100%", marginTop: "1.25rem",
            padding: "13px", background: "#F5F0E8", color: "#1C1814",
            border: "none", borderRadius: "3px",
            fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: "inherit", fontWeight: "500",
            transition: "background 0.13s",
          }}
            onMouseEnter={(e) => (e.target.style.background = "#FFFFFF")}
            onMouseLeave={(e) => (e.target.style.background = "#F5F0E8")}
          >
            Request a quote
          </button>
        </div>

        <div style={{ height: "3rem" }} />
      </div>
    </div>
  );
}
