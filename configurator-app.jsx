// Toronto Custom Doors — Configurator React app (stepper workflow)
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const {
  DOOR_STYLES, MATERIALS, HARDWARE_STYLES, HARDWARE_FINISHES,
  GLASS_OPTIONS, SIZES, SPRICES, BASE
} = window.DOOR_DATA;

// ── Configuration types ──────────────────────────────────────
const ENTRY_CONFIGS = [
  { id: "single",                label: "Single door",              desc: "One door, the classic",                 price: 0   },
  { id: "double",                label: "Double doors",             desc: "Side-by-side pair",                     price: 1200 },
  { id: "single-sidelite-r",     label: "Door + sidelite",          desc: "One sidelite on the handle side",       price: 680 },
  { id: "single-sidelite-both",  label: "Door + two sidelites",     desc: "Sidelites flanking the door",           price: 1200 },
  { id: "double-sidelite",       label: "Doubles + sidelites",      desc: "Two doors, two sidelites",              price: 2400 },
];

const TRANSOM_OPTIONS = [
  { id: "none",         label: "No transom",        price: 0   },
  { id: "rectangular",  label: "Rectangular",       price: 380 },
  { id: "arched",       label: "Arched",            price: 540 },
  { id: "half-round",   label: "Half-round",        price: 620 },
];

// ── Default & URL serialisation ──────────────────────────────
const DEFAULTS = {
  entryConfig: "single",
  doorStyle: "six-panel",
  mat: "walnut",
  hwStyle: "lever",
  hwFinish: "brass",
  glass: "none",
  sideliteGlass: "frosted",
  transom: "none",
  sizeIdx: 2,
  hingeLeft: true,
};

function configToParams(c) {
  const p = new URLSearchParams();
  p.set("ec", c.entryConfig);
  p.set("style", c.doorStyle);
  p.set("mat", c.mat);
  p.set("hw", c.hwStyle);
  p.set("fin", c.hwFinish);
  p.set("glass", c.glass);
  p.set("sg", c.sideliteGlass);
  p.set("tr", c.transom);
  p.set("size", c.sizeIdx);
  p.set("hinge", c.hingeLeft ? "L" : "R");
  return p.toString();
}
function paramsToConfig(p) {
  const c = { ...DEFAULTS };
  if (p.get("ec"))    c.entryConfig = p.get("ec");
  if (p.get("style")) c.doorStyle = p.get("style");
  if (p.get("mat"))   c.mat = p.get("mat");
  if (p.get("hw"))    c.hwStyle = p.get("hw");
  if (p.get("fin"))   c.hwFinish = p.get("fin");
  if (p.get("glass")) c.glass = p.get("glass");
  if (p.get("sg"))    c.sideliteGlass = p.get("sg");
  if (p.get("tr"))    c.transom = p.get("tr");
  if (p.get("size"))  c.sizeIdx = parseInt(p.get("size"), 10) || 2;
  if (p.get("hinge")) c.hingeLeft = p.get("hinge") === "L";
  return c;
}
function readInitial() {
  return paramsToConfig(new URLSearchParams(window.location.search));
}

// Price calc
function calcPrice(c) {
  const ec = ENTRY_CONFIGS.find(e => e.id === c.entryConfig);
  const tr = TRANSOM_OPTIONS.find(t => t.id === c.transom);
  const s = DOOR_STYLES.find(d => d.id === c.doorStyle);
  const m = MATERIALS.find(d => d.id === c.mat);
  const h = HARDWARE_STYLES.find(d => d.id === c.hwStyle);
  const g = GLASS_OPTIONS.find(d => d.id === c.glass);
  return BASE + (ec?.price||0) + (tr?.price||0) + (s?.price||0) + (m?.price||0) + (h?.price||0) + (g?.price||0) + SPRICES[c.sizeIdx];
}

// Door name (per style+mat)
const DOOR_NAMES = {
  "six-panel-walnut":    "Sterling",
  "craftsman-oak":       "Roncesvalles",
  "arch-cherry":         "Cabbagetown",
  "barn-oak":            "Mill House",
  "dutch-sage":          "Leslieville",
  "flush-walnut":        "Annex",
  "two-panel-oak":       "Wychwood",
  "four-panel-cherry":   "Riverdale",
};
function doorName(c) {
  return DOOR_NAMES[`${c.doorStyle}-${c.mat}`] || "Custom No. 47";
}

// ── Door preview SVG ────────────────────────────────────────
function DoorPreview({ config, w = 700, h = 800 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = window.renderDoorScene({ ...config, w, h, scene: "studio" });
  }, [config.entryConfig, config.transom, config.sideliteGlass, config.doorStyle, config.mat, config.hwStyle, config.hwFinish, config.glass, config.hingeLeft, w, h]);
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet"
         style={{ width: "100%", height: "100%", display: "block" }} />
  );
}

function MiniDoor({ config, w = 200, h = 260 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = window.renderDoorScene({ ...config, w, h, scene: "studio" });
  }, [config.entryConfig, config.transom, config.sideliteGlass, config.doorStyle, config.mat, config.hwStyle, config.hwFinish, config.glass, w, h]);
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet"
         style={{ width: "100%", height: "100%", display: "block" }} />
  );
}

// ── Steps definition ────────────────────────────────────────
const STEPS = [
  { id: "configuration", label: "Configuration" },
  { id: "door",          label: "Door style"    },
  { id: "glass",         label: "Glass"         },
  { id: "color",         label: "Material"      },
  { id: "hardware",      label: "Hardware"      },
];

function adj(hex, amt) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const c = v => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2,"0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

// ── Step contents ───────────────────────────────────────────
function ConfigurationStep({ config, set }) {
  return (
    <>
      <SubSection title="Door arrangement" count={`${ENTRY_CONFIGS.length} layouts`}>
        <div className="tile-row">
          {ENTRY_CONFIGS.map(ec => (
            <button key={ec.id}
                    className={"tile " + (config.entryConfig === ec.id ? "active" : "")}
                    onClick={() => set({ entryConfig: ec.id })}>
              <div className="tile__preview tile__preview--wide">
                <MiniDoor config={{ ...config, entryConfig: ec.id, transom: "none" }} w={300} h={300}/>
              </div>
              <div className="tile__body">
                <div className="tile__label">{ec.label}</div>
                <div className="tile__sub">{ec.desc}</div>
                <div className="tile__price">{ec.price > 0 ? `+$${ec.price.toLocaleString()}` : "Included"}</div>
              </div>
            </button>
          ))}
        </div>
      </SubSection>

      <SubSection title="Transom (over the door)" count="Optional">
        <div className="pill-row">
          {TRANSOM_OPTIONS.map(t => (
            <button key={t.id}
                    className={"pill " + (config.transom === t.id ? "active" : "")}
                    onClick={() => set({ transom: t.id })}>
              {t.label}{t.price > 0 && <span className="pill__price">+${t.price}</span>}
            </button>
          ))}
        </div>
      </SubSection>

      {config.entryConfig.includes("sidelite") && (
        <SubSection title="Sidelite glass" count="Light & privacy">
          <div className="pill-row">
            {[
              { id: "frosted",    label: "Frosted" },
              { id: "clear",      label: "Clear" },
              { id: "decorative", label: "Decorative grid" },
            ].map(g => (
              <button key={g.id}
                      className={"pill " + (config.sideliteGlass === g.id ? "active" : "")}
                      onClick={() => set({ sideliteGlass: g.id })}>
                {g.label}
              </button>
            ))}
          </div>
        </SubSection>
      )}

      <SubSection title="Width" count={`${SIZES.length} sizes · 80″ height standard`}>
        <div className="pill-row">
          {SIZES.map((s, i) => (
            <button key={s}
                    className={"pill " + (config.sizeIdx === i ? "active" : "")}
                    onClick={() => set({ sizeIdx: i })}>
              {s}{SPRICES[i] > 0 && <span className="pill__price">+${SPRICES[i]}</span>}
            </button>
          ))}
        </div>
      </SubSection>

      <SubSection title="Swing direction" count="Viewed from pull side">
        <div className="pill-row">
          <button className={"pill " + (config.hingeLeft ? "active" : "")} onClick={() => set({ hingeLeft: true })}>Left hinge</button>
          <button className={"pill " + (!config.hingeLeft ? "active" : "")} onClick={() => set({ hingeLeft: false })}>Right hinge</button>
        </div>
      </SubSection>
    </>
  );
}

function DoorStyleStep({ config, set }) {
  return (
    <SubSection title="Silhouette" count={`${DOOR_STYLES.length} styles`}>
      <p className="hint">The frame story of the door. Each silhouette pairs with any material.</p>
      <div className="tile-grid tile-grid--4">
        {DOOR_STYLES.map(s => (
          <button key={s.id}
                  className={"tile " + (config.doorStyle === s.id ? "active" : "")}
                  onClick={() => set({ doorStyle: s.id })}>
            <div className="tile__preview">
              <MiniDoor config={{ ...config, doorStyle: s.id, entryConfig: "single", transom: "none" }} w={200} h={260}/>
            </div>
            <div className="tile__body">
              <div className="tile__label">{s.label}</div>
              <div className="tile__price">{s.price > 0 ? `+$${s.price}` : "Included"}</div>
            </div>
          </button>
        ))}
      </div>
    </SubSection>
  );
}

function GlassStep({ config, set }) {
  return (
    <SubSection title="Glass in the door" count="Lite options">
      <p className="hint">Whether and how much glass sits in the door slab itself. Sidelite glass is set separately.</p>
      <div className="tile-grid tile-grid--4">
        {GLASS_OPTIONS.map(g => (
          <button key={g.id}
                  className={"tile " + (config.glass === g.id ? "active" : "")}
                  onClick={() => set({ glass: g.id })}>
            <div className="tile__preview">
              <MiniDoor config={{ ...config, glass: g.id, entryConfig: "single", transom: "none" }} w={200} h={260}/>
            </div>
            <div className="tile__body">
              <div className="tile__label">{g.label}</div>
              <div className="tile__price">{g.price > 0 ? `+$${g.price}` : "Included"}</div>
            </div>
          </button>
        ))}
      </div>
    </SubSection>
  );
}

function ColorStep({ config, set }) {
  const woods = MATERIALS.filter(m => m.wood);
  const paints = MATERIALS.filter(m => !m.wood);
  const curMat = MATERIALS.find(m => m.id === config.mat);
  return (
    <>
      <SubSection title="Hardwood" count={`${woods.length} species · FSC-certified`}>
        <div className="tile-grid tile-grid--4">
          {woods.map(m => (
            <button key={m.id}
                    className={"tile " + (config.mat === m.id ? "active" : "")}
                    onClick={() => set({ mat: m.id })}>
              <div className="tile__preview">
                <MiniDoor config={{ ...config, mat: m.id, entryConfig: "single", transom: "none" }} w={200} h={260}/>
              </div>
              <div className="tile__body">
                <div className="tile__label">{m.label}</div>
                <div className="tile__price">{m.price > 0 ? `+$${m.price}` : "Included"}</div>
              </div>
            </button>
          ))}
        </div>
      </SubSection>

      <SubSection title="Painted finishes" count={`${paints.length} colours · catalysed varnish`}>
        <div className="swatch-grid">
          {paints.map(m => (
            <button key={m.id}
                    className={"swatch-card " + (config.mat === m.id ? "active" : "")}
                    onClick={() => set({ mat: m.id })}>
              <span className="swatch-card__dot" style={{ background: m.color }}/>
              <span className="swatch-card__label">{m.label}</span>
            </button>
          ))}
        </div>
        {curMat && !curMat.wood && (
          <div className="swatch-note">Currently selected: <strong>{curMat.label}</strong></div>
        )}
      </SubSection>
    </>
  );
}

function HardwareStep({ config, set }) {
  return (
    <>
      <SubSection title="Handle style" count={`${HARDWARE_STYLES.length} silhouettes · forged solid`}>
        <div className="tile-grid tile-grid--4">
          {HARDWARE_STYLES.map(s => (
            <button key={s.id}
                    className={"tile " + (config.hwStyle === s.id ? "active" : "")}
                    onClick={() => set({ hwStyle: s.id })}>
              <div className="tile__preview tile__preview--icon">
                <HardwareIcon id={s.id}/>
              </div>
              <div className="tile__body">
                <div className="tile__label">{s.label}</div>
                <div className="tile__price">{s.price > 0 ? `+$${s.price}` : "Included"}</div>
              </div>
            </button>
          ))}
        </div>
      </SubSection>

      <SubSection title="Finish" count={`${HARDWARE_FINISHES.length} options · hand-polished`}>
        <div className="swatch-grid">
          {HARDWARE_FINISHES.map(f => (
            <button key={f.id}
                    className={"swatch-card " + (config.hwFinish === f.id ? "active" : "")}
                    onClick={() => set({ hwFinish: f.id })}>
              <span className="swatch-card__dot"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${adj(f.color, 30)}, ${f.color} 60%, ${adj(f.color, -30)})` }}/>
              <span className="swatch-card__label">{f.label}</span>
            </button>
          ))}
        </div>
      </SubSection>
    </>
  );
}

function HardwareIcon({ id }) {
  const s = { width: "60%", height: "70%" };
  if (id === "lever") return (
    <svg style={s} viewBox="0 0 60 80">
      <rect x="25" y="14" width="10" height="52" fill="#3A2D22" rx="2"/>
      <rect x="32" y="36" width="22" height="6" fill="#3A2D22" rx="3"/>
      <circle cx="52" cy="39" r="4" fill="#3A2D22"/>
    </svg>
  );
  if (id === "knob") return (
    <svg style={s} viewBox="0 0 60 80">
      <rect x="26" y="18" width="8" height="44" fill="#3A2D22" rx="2"/>
      <circle cx="30" cy="40" r="11" fill="#3A2D22"/>
    </svg>
  );
  if (id === "bar") return (
    <svg style={s} viewBox="0 0 60 80">
      <rect x="26" y="10" width="8" height="8" fill="#3A2D22" rx="1"/>
      <rect x="26" y="62" width="8" height="8" fill="#3A2D22" rx="1"/>
      <rect x="25" y="14" width="10" height="52" fill="#3A2D22" rx="5"/>
    </svg>
  );
  if (id === "ring") return (
    <svg style={s} viewBox="0 0 60 80">
      <rect x="26" y="20" width="8" height="40" fill="#3A2D22" rx="2"/>
      <circle cx="30" cy="40" r="13" fill="none" stroke="#3A2D22" strokeWidth="4"/>
    </svg>
  );
  return null;
}

function SubSection({ title, count, children }) {
  return (
    <div className="sub">
      <div className="sub__head">
        <h3 className="sub__title">{title}</h3>
        <span className="sub__count">{count}</span>
      </div>
      {children}
    </div>
  );
}

// ── Compare modal ───────────────────────────────────────────
function CompareModal({ left, right, onClose }) {
  if (!right) return null;
  const summarize = (c) => ({
    Configuration: ENTRY_CONFIGS.find(e => e.id === c.entryConfig).label,
    Transom:       TRANSOM_OPTIONS.find(t => t.id === c.transom).label,
    Silhouette:    DOOR_STYLES.find(s => s.id === c.doorStyle).label,
    Material:      MATERIALS.find(m => m.id === c.mat).label,
    Hardware:      HARDWARE_STYLES.find(s => s.id === c.hwStyle).label + " · " + HARDWARE_FINISHES.find(f => f.id === c.hwFinish).label,
    Glass:         GLASS_OPTIONS.find(g => g.id === c.glass).label,
    Width:         SIZES[c.sizeIdx],
    Swing:         c.hingeLeft ? "Left" : "Right",
    Price:         "$" + calcPrice(c).toLocaleString(),
  });
  const l = summarize(left), r = summarize(right);
  const keys = Object.keys(l);
  return (
    <div className="compare-modal" onClick={onClose}>
      <div className="compare-modal__inner" onClick={(e) => e.stopPropagation()}>
        <div className="compare-modal__head">
          <h2>Compare configurations</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
        <div className="compare-modal__body">
          {[left, right].map((cfg, i) => (
            <div className="compare-col" key={i}>
              <div className="compare-col__preview">
                <MiniDoor config={cfg} w={300} h={400}/>
              </div>
              <div className="compare-col__head">
                <div className="compare-col__name">
                  {doorName(cfg)}
                  <span className="compare-col__tag">{i === 0 ? "Option A" : "Option B"}</span>
                </div>
                <div className="compare-col__price">${calcPrice(cfg).toLocaleString()}</div>
              </div>
              <div className="compare-col__list">
                {keys.map(k => {
                  const va = l[k], vb = r[k];
                  const diff = va !== vb;
                  return (
                    <div key={k} className={"row " + (diff ? "diff" : "")}>
                      <span className="k">{k}</span>
                      <span className="v">{i === 0 ? va : vb}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────
function App() {
  const [config, setConfig] = useState(readInitial());
  const [stepIdx, setStepIdx] = useState(0);
  const [compareWith, setCompareWith] = useState(null);
  const [toast, setToast] = useState(null);
  const [showQuoteCard, setShowQuoteCard] = useState(false);

  // History stack for undo/redo
  const historyRef = useRef([config]);
  const historyIdxRef = useRef(0);
  const isReplayingRef = useRef(false);

  // Push a history entry when config changes (but not when replaying history)
  useEffect(() => {
    if (isReplayingRef.current) {
      isReplayingRef.current = false;
      return;
    }
    // Drop forward history (canonical undo behaviour)
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(config);
    historyIdxRef.current = historyRef.current.length - 1;
    // URL sync
    const params = configToParams(config);
    window.history.replaceState(null, "", window.location.pathname + "?" + params);
  }, [config]);

  const set = (patch) => setConfig(c => ({ ...c, ...patch }));

  const undo = () => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    isReplayingRef.current = true;
    setConfig(historyRef.current[historyIdxRef.current]);
  };
  const redo = () => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    isReplayingRef.current = true;
    setConfig(historyRef.current[historyIdxRef.current]);
  };
  const reset = () => {
    isReplayingRef.current = true;
    setConfig(DEFAULTS);
    historyRef.current = [DEFAULTS];
    historyIdxRef.current = 0;
    showToast("Reset to The Sterling.");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied — share to keep this design.");
    } catch {
      showToast("Copy URL from address bar to share.");
    }
  };

  const onCompare = () => {
    const saved = localStorage.getItem("tcd:saved");
    if (saved) {
      setCompareWith(JSON.parse(saved));
    } else {
      localStorage.setItem("tcd:saved", JSON.stringify(config));
      showToast("Saved Option A. Tweak the design, then tap Compare again.");
    }
  };

  const onResetCompare = () => {
    localStorage.removeItem("tcd:saved");
    setCompareWith(null);
    showToast("Compare cleared.");
  };

  const navigate = (delta) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, stepIdx + delta));
    setStepIdx(next);
  };

  const goToStep = (idx) => setStepIdx(Math.max(0, Math.min(STEPS.length - 1, idx)));

  const canUndo = historyIdxRef.current > 0;
  const canRedo = historyIdxRef.current < historyRef.current.length - 1;
  const total = calcPrice(config);
  const name = doorName(config);

  const StepComponents = {
    configuration: ConfigurationStep,
    door:          DoorStyleStep,
    glass:         GlassStep,
    color:         ColorStep,
    hardware:      HardwareStep,
  };
  const ActiveStep = StepComponents[STEPS[stepIdx].id];

  return (
    <>
      <div className="cfg">

        {/* ── Preview pane ── */}
        <div className="preview">
          <div className="preview__door">
            <DoorPreview config={config} w={700} h={800}/>
          </div>
          <div className="preview__overlay">
            <div className="preview__top">
              <span className="preview__chip"><span className="dot"></span>Live · The {name}</span>
              <div className="preview__actions">
                <button className="icon-btn" title="Undo" onClick={undo} disabled={!canUndo}
                        style={{ opacity: canUndo ? 1 : 0.4 }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M5 8h7a3 3 0 0 1 0 6H9"/><path d="M5 5l-3 3 3 3"/>
                  </svg>
                </button>
                <button className="icon-btn" title="Redo" onClick={redo} disabled={!canRedo}
                        style={{ opacity: canRedo ? 1 : 0.4 }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M11 8H4a3 3 0 0 0 0 6h3"/><path d="M11 5l3 3-3 3"/>
                  </svg>
                </button>
                <button className="icon-btn" title="Reset" onClick={reset}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M3 8a5 5 0 1 1 1.5 3.5"/><path d="M3 4v3h3"/>
                  </svg>
                </button>
                <button className="icon-btn" title="Share" onClick={onShare}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M11.5 5.5L5.5 10M11.5 10.5L5.5 6"/>
                    <circle cx="13" cy="4" r="2"/><circle cx="13" cy="12" r="2"/><circle cx="4" cy="8" r="2"/>
                  </svg>
                </button>
                <button className="icon-btn" title="Compare" onClick={onCompare}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="2" y="3" width="5" height="10"/><rect x="9" y="3" width="5" height="10"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="preview__bottom">
              <div className="preview__price-card">
                <div className="preview__price-label">Estimated · {SIZES[config.sizeIdx]} × 80″</div>
                <div className="preview__price">${total.toLocaleString()}</div>
                <a href={"quote.html?" + configToParams(config)} className="btn btn--primary preview__cta">
                  Request quote
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 12, height: 12 }}><path d="M2 6h8M7 2l4 4-4 4"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stepper pane ── */}
        <div className="options">
          {/* Step tabs */}
          <div className="step-tabs">
            {STEPS.map((s, i) => (
              <button key={s.id}
                      className={"step-tab " + (i === stepIdx ? "active " : (i < stepIdx ? "done " : ""))}
                      onClick={() => goToStep(i)}>
                <span className="step-tab__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="step-tab__lbl">{s.label}</span>
                {i < STEPS.length - 1 && <svg className="step-tab__chev" viewBox="0 0 8 14" fill="currentColor"><path d="M0 0 L8 7 L0 14 Z"/></svg>}
              </button>
            ))}
          </div>

          {/* Sub-step navigation */}
          <div className="substep-bar">
            <button className="nav-arrow" onClick={() => navigate(-1)} disabled={stepIdx === 0}
                    style={{ opacity: stepIdx === 0 ? 0.3 : 1 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 4l-4 4 4 4"/></svg>
            </button>
            <div className="substep-bar__lbl">
              <span className="substep-bar__step">Step {stepIdx + 1} of {STEPS.length}</span>
              <span className="substep-bar__title">{STEPS[stepIdx].label}</span>
            </div>
            <button className="nav-arrow nav-arrow--primary" onClick={() => navigate(1)} disabled={stepIdx === STEPS.length - 1}
                    style={{ opacity: stepIdx === STEPS.length - 1 ? 0.3 : 1 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 4l4 4-4 4"/></svg>
            </button>
          </div>

          {/* Step content */}
          <div className="step-body">
            <ActiveStep config={config} set={set}/>
          </div>

          {/* Footer nav */}
          <div className="step-footer">
            <button className="btn btn--ghost" onClick={() => navigate(-1)} disabled={stepIdx === 0}
                    style={{ visibility: stepIdx === 0 ? "hidden" : "visible" }}>
              ← {STEPS[stepIdx - 1]?.label}
            </button>
            {stepIdx < STEPS.length - 1 ? (
              <button className="btn btn--primary" onClick={() => navigate(1)}>
                {STEPS[stepIdx + 1].label} →
              </button>
            ) : (
              <a href={"quote.html?" + configToParams(config)} className="btn btn--primary">
                Request a quote →
              </a>
            )}
          </div>

          {localStorage.getItem("tcd:saved") && (
            <div className="saved-pill">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="3" width="4" height="8"/><rect x="8" y="3" width="4" height="8"/></svg>
              Option A is saved for comparison
              <button onClick={onResetCompare}>Clear</button>
            </div>
          )}
        </div>
      </div>

      {compareWith && <CompareModal left={compareWith} right={config} onClose={() => setCompareWith(null)}/>}

      {toast && (
        <div className="toast">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14, color: "var(--brass)" }}>
            <path d="M2 8l3 3 9-9"/>
          </svg>
          {toast}
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App/>);
