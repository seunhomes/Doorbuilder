// Toronto Custom Doors — Configurator React app
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const {
  DOOR_STYLES, MATERIALS, HARDWARE_STYLES, HARDWARE_FINISHES,
  GLASS_OPTIONS, SIZES, SPRICES, BASE
} = window.DOOR_DATA;

// ── Default config & URL serialisation ───────────────────────
const DEFAULTS = {
  doorStyle: "six-panel",
  mat: "walnut",
  hwStyle: "lever",
  hwFinish: "brass",
  glass: "none",
  sizeIdx: 2,
  hingeLeft: true,
};

function configToParams(c) {
  const p = new URLSearchParams();
  p.set("style", c.doorStyle);
  p.set("mat", c.mat);
  p.set("hw", c.hwStyle);
  p.set("fin", c.hwFinish);
  p.set("glass", c.glass);
  p.set("size", c.sizeIdx);
  p.set("hinge", c.hingeLeft ? "L" : "R");
  return p.toString();
}
function paramsToConfig(p) {
  const c = { ...DEFAULTS };
  if (p.get("style")) c.doorStyle = p.get("style");
  if (p.get("mat"))   c.mat = p.get("mat");
  if (p.get("hw"))    c.hwStyle = p.get("hw");
  if (p.get("fin"))   c.hwFinish = p.get("fin");
  if (p.get("glass")) c.glass = p.get("glass");
  if (p.get("size")) c.sizeIdx = parseInt(p.get("size"), 10) || 2;
  if (p.get("hinge")) c.hingeLeft = p.get("hinge") === "L";
  return c;
}

// Initial config — try URL, fall back to defaults
function readInitial() {
  const p = new URLSearchParams(window.location.search);
  return paramsToConfig(p);
}

// Price calc
function calcPrice(c) {
  const s = DOOR_STYLES.find(d => d.id === c.doorStyle);
  const m = MATERIALS.find(d => d.id === c.mat);
  const h = HARDWARE_STYLES.find(d => d.id === c.hwStyle);
  const g = GLASS_OPTIONS.find(d => d.id === c.glass);
  return BASE + (s?.price||0) + (m?.price||0) + (h?.price||0) + (g?.price||0) + SPRICES[c.sizeIdx];
}

// Door name generator
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

// ── Subcomponents ────────────────────────────────────────────
function DoorPreview({ config, w = 600, h = 800 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = window.renderDoorScene({
      ...config, w, h, scene: "studio"
    });
  }, [config.doorStyle, config.mat, config.hwStyle, config.hwFinish, config.glass, config.hingeLeft, w, h]);
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet"
         style={{ width: "100%", height: "100%", display: "block" }} />
  );
}

function MiniDoor({ config, w = 80, h = 110 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = window.renderDoorScene({ ...config, w, h, scene: "studio" });
  }, [config.doorStyle, config.mat, config.hwStyle, config.hwFinish, config.glass, w, h]);
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet"
         style={{ width: "100%", height: "100%", display: "block" }} />
  );
}

function Stepper({ steps, current, onJump }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div key={s.id}
             className={"step " + (i < current ? "done " : "") + (i === current ? "current" : "")}
             onClick={() => onJump(i)}>
          <span className="bar"></span>
          <span className="num">{String(i + 1).padStart(2, "0")}</span>
          <span className="lbl">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function StyleTiles({ active, onChange, config }) {
  return (
    <div className="tiles">
      {DOOR_STYLES.map(s => (
        <button key={s.id}
                className={"tile " + (active === s.id ? "active" : "")}
                onClick={() => onChange(s.id)}>
          <div className="tile__preview">
            <MiniDoor config={{ ...config, doorStyle: s.id }} w={120} h={160} />
          </div>
          <div className="tile__label">{s.label}</div>
          <div className="tile__price">{s.price > 0 ? `+$${s.price}` : "Included"}</div>
        </button>
      ))}
    </div>
  );
}

function WoodChoice({ active, onChange }) {
  const woods = MATERIALS.filter(m => m.wood);
  return (
    <div className="mat-wood">
      {woods.map(m => (
        <button key={m.id}
                className={"tile " + (active === m.id ? "active" : "")}
                onClick={() => onChange(m.id)}>
          <div className="swatch-square"
               style={{
                 background: m.color,
                 backgroundImage:
                   "repeating-linear-gradient(92deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 7px), repeating-linear-gradient(92deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 12px)",
               }}/>
          <div style={{ flex: 1 }}>
            <div className="tile__label" style={{ fontSize: 17 }}>{m.label}</div>
            <div className="tile__price">{m.price > 0 ? `+$${m.price}` : "Included"}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function PaintChoice({ active, onChange, allMats }) {
  const paints = MATERIALS.filter(m => !m.wood);
  const cur = allMats.find(m => m.id === active);
  return (
    <>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "var(--mocha)", marginBottom: 12
      }}>
        Painted finishes (included)
      </div>
      <div className="swatches">
        {paints.map(m => (
          <button key={m.id}
                  className={"swatch " + (active === m.id ? "active" : "")}
                  style={{ background: m.color }}
                  title={m.label}
                  aria-label={m.label}
                  onClick={() => onChange(m.id)}/>
        ))}
        {cur && !cur.wood && (
          <span style={{ fontSize: 13, color: "var(--espresso)", marginLeft: 8 }}>{cur.label}</span>
        )}
      </div>
    </>
  );
}

function HardwareStyleTiles({ active, onChange }) {
  return (
    <div className="tiles" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      {HARDWARE_STYLES.map(s => (
        <button key={s.id} className={"tile " + (active === s.id ? "active" : "")}
                onClick={() => onChange(s.id)}>
          <div className="tile__preview" style={{ aspectRatio: "1 / 1", padding: 12 }}>
            <HardwareIcon id={s.id}/>
          </div>
          <div className="tile__label">{s.label}</div>
          <div className="tile__price">{s.price > 0 ? `+$${s.price}` : "Included"}</div>
        </button>
      ))}
    </div>
  );
}

function HardwareIcon({ id }) {
  const s = { width: "100%", height: "100%" };
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

function FinishSwatches({ active, onChange }) {
  const cur = HARDWARE_FINISHES.find(f => f.id === active);
  return (
    <div className="swatches">
      {HARDWARE_FINISHES.map(f => (
        <button key={f.id}
                className={"swatch " + (active === f.id ? "active" : "")}
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${adj(f.color, 30)}, ${f.color} 60%, ${adj(f.color, -30)})`
                }}
                title={f.label}
                aria-label={f.label}
                onClick={() => onChange(f.id)}/>
      ))}
      {cur && (
        <span style={{ fontSize: 13, color: "var(--espresso)", marginLeft: 8 }}>{cur.label}</span>
      )}
    </div>
  );
}

function adj(hex, amt) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const c = v => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2,"0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

// ── Compare modal ────────────────────────────────────────────
function CompareModal({ left, right, onClose }) {
  if (!right) return null;
  const leftMat = MATERIALS.find(m => m.id === left.mat);
  const rightMat = MATERIALS.find(m => m.id === right.mat);
  const leftStyle = DOOR_STYLES.find(s => s.id === left.doorStyle);
  const rightStyle = DOOR_STYLES.find(s => s.id === right.doorStyle);
  const leftHw = HARDWARE_STYLES.find(s => s.id === left.hwStyle);
  const rightHw = HARDWARE_STYLES.find(s => s.id === right.hwStyle);
  const leftFin = HARDWARE_FINISHES.find(s => s.id === left.hwFinish);
  const rightFin = HARDWARE_FINISHES.find(s => s.id === right.hwFinish);
  const leftGl = GLASS_OPTIONS.find(s => s.id === left.glass);
  const rightGl = GLASS_OPTIONS.find(s => s.id === right.glass);

  const rows = [
    ["Style",    leftStyle.label, rightStyle.label],
    ["Material", leftMat.label, rightMat.label],
    ["Hardware", leftHw.label, rightHw.label],
    ["Finish",   leftFin.label, rightFin.label],
    ["Glass",    leftGl.label, rightGl.label],
    ["Width",    SIZES[left.sizeIdx], SIZES[right.sizeIdx]],
    ["Swing",    left.hingeLeft ? "Left" : "Right", right.hingeLeft ? "Left" : "Right"],
    ["Price",    "$" + calcPrice(left).toLocaleString(), "$" + calcPrice(right).toLocaleString()],
  ];

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
                <div className="name">{doorName(cfg)} <span style={{color:"var(--mocha)",fontFamily:"var(--mono)",fontSize:11,letterSpacing:".1em",textTransform:"uppercase",marginLeft:8}}>{i === 0 ? "Option A" : "Option B"}</span></div>
                <div className="price">${calcPrice(cfg).toLocaleString()}</div>
              </div>
              <div className="compare-col__list">
                {rows.map(([k, va, vb]) => {
                  const v = i === 0 ? va : vb;
                  const diff = va !== vb;
                  return (
                    <div key={k} className={"row " + (diff ? "diff" : "")}>
                      <span className="k">{k}</span>
                      <span className="v">{v}</span>
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

// ── Main app ────────────────────────────────────────────────
function App() {
  const [config, setConfig] = useState(readInitial());
  const [compareWith, setCompareWith] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const total = useMemo(() => calcPrice(config), [config]);
  const mat = MATERIALS.find(m => m.id === config.mat);
  const styleC = DOOR_STYLES.find(s => s.id === config.doorStyle);
  const hwStyleC = HARDWARE_STYLES.find(h => h.id === config.hwStyle);
  const hwFinishC = HARDWARE_FINISHES.find(h => h.id === config.hwFinish);
  const glassC = GLASS_OPTIONS.find(g => g.id === config.glass);
  const name = doorName(config);

  const set = (patch) => setConfig(c => ({ ...c, ...patch }));

  // Track URL state — keep it in sync but don't push history
  useEffect(() => {
    const params = configToParams(config);
    const url = window.location.pathname + "?" + params;
    window.history.replaceState(null, "", url);
  }, [config]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const onShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied — share to keep this design.");
    } catch {
      showToast("Copy this URL: " + url);
    }
  };

  const onCompare = () => {
    // Save a snapshot of the current config & load defaults for comparison
    // Better: open compare modal with current vs a saved
    const saved = localStorage.getItem("tcd:saved");
    if (saved) {
      setCompareWith(JSON.parse(saved));
    } else {
      // Save current as A, prompt user
      localStorage.setItem("tcd:saved", JSON.stringify(config));
      showToast("Saved Option A. Tweak the design, then tap Compare again.");
    }
  };

  const onResetCompare = () => {
    localStorage.removeItem("tcd:saved");
    setCompareWith(null);
    showToast("Compare cleared.");
  };

  const STEPS = [
    { id: "style",    label: "Silhouette" },
    { id: "material", label: "Material" },
    { id: "hardware", label: "Hardware" },
    { id: "glass",    label: "Glass" },
    { id: "size",     label: "Size & swing" },
  ];

  // Scroll spy: which section is in view
  const sectionRefs = useRef({});
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      let bestEntry = null;
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (!bestEntry || e.intersectionRatio > bestEntry.intersectionRatio) bestEntry = e;
        }
      });
      if (bestEntry) {
        const idx = STEPS.findIndex(s => s.id === bestEntry.target.dataset.section);
        if (idx >= 0) setCurrentStep(idx);
      }
    }, { rootMargin: "-30% 0px -40% 0px", threshold: [0, 0.25, 0.5] });
    Object.values(sectionRefs.current).forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const jumpTo = (i) => {
    const el = sectionRefs.current[STEPS[i].id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="cfg">
        {/* ── Preview ── */}
        <div className="preview">
          <div className="preview__door">
            <DoorPreview config={config} w={600} h={800}/>
          </div>
          <div className="preview__overlay">
            <div className="preview__top">
              <span className="preview__chip"><span className="dot"></span>Live preview · Studio</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="icon-btn" title="Share configuration" onClick={onShare}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M11.5 5.5L5.5 10M11.5 10.5L5.5 6"/>
                    <circle cx="13" cy="4" r="2"/>
                    <circle cx="13" cy="12" r="2"/>
                    <circle cx="4" cy="8" r="2"/>
                  </svg>
                </button>
                <button className="icon-btn" title="Compare with saved" onClick={onCompare}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="2" y="3" width="5" height="10"/>
                    <rect x="9" y="3" width="5" height="10"/>
                  </svg>
                </button>
                <button className="icon-btn" title="Reset to defaults" onClick={() => { setConfig(DEFAULTS); showToast("Reset to The Sterling."); }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M3 8a5 5 0 1 1 1.5 3.5"/>
                    <path d="M3 4v3h3"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="preview__bottom">
              <div className="preview__name">
                <div className="eyebrow">The {name}</div>
                <h2>{styleC.label} <em>·</em> {mat.label}</h2>
                <div className="sub">{SIZES[config.sizeIdx]} × 80″ &nbsp;·&nbsp; {config.hingeLeft ? "Left" : "Right"} hinge</div>
              </div>
              <div className="preview__zoom">
                <button className={"toggle-pill " + (!config.hingeLeft ? "active" : "")}
                        onClick={() => set({ hingeLeft: !config.hingeLeft })}>
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 3v6M9 3v6M3 6h6M5 4l-2 2 2 2"/></svg>
                  Flip swing
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Options ── */}
        <div className="options">
          <div className="options__head">
            <div className="eyebrow">Step 01 — Configurator</div>
            <h1>Build your <em>door</em>.</h1>
            <div className="sub">Six decisions, four minutes. Every change updates the preview live. You can save your design as a shareable link at any point.</div>
          </div>

          <Stepper steps={STEPS} current={currentStep} onJump={jumpTo}/>

          {/* Silhouette */}
          <section className="opt-section" ref={el => sectionRefs.current.style = el} data-section="style">
            <div className="opt-section__head">
              <h2 className="opt-section__title">Silhouette</h2>
              <span className="opt-section__count">8 styles</span>
            </div>
            <p className="opt-section__sub">The frame story. Choose a panel layout that matches your home's architecture.</p>
            <StyleTiles active={config.doorStyle} onChange={(id) => set({ doorStyle: id })} config={config}/>
          </section>

          {/* Material */}
          <section className="opt-section" ref={el => sectionRefs.current.material = el} data-section="material">
            <div className="opt-section__head">
              <h2 className="opt-section__title">Material</h2>
              <span className="opt-section__count">4 hardwoods · 6 paints</span>
            </div>
            <p className="opt-section__sub">All hardwoods are FSC-certified, kiln-stabilised, and milled in Ontario. Painted finishes are catalysed conversion varnish over poplar.</p>
            <WoodChoice active={config.mat} onChange={(id) => set({ mat: id })}/>
            <PaintChoice active={config.mat} onChange={(id) => set({ mat: id })} allMats={MATERIALS}/>
          </section>

          {/* Hardware */}
          <section className="opt-section" ref={el => sectionRefs.current.hardware = el} data-section="hardware">
            <div className="opt-section__head">
              <h2 className="opt-section__title">Hardware</h2>
              <span className="opt-section__count">4 silhouettes · 5 finishes</span>
            </div>
            <p className="opt-section__sub">Solid forged hardware from Emtek and Rocky Mountain. Hinges and the strike plate match your handle finish.</p>
            <HardwareStyleTiles active={config.hwStyle} onChange={(id) => set({ hwStyle: id })}/>
            <div style={{ marginTop: 24 }}>
              <FinishSwatches active={config.hwFinish} onChange={(id) => set({ hwFinish: id })}/>
            </div>
          </section>

          {/* Glass */}
          <section className="opt-section" ref={el => sectionRefs.current.glass = el} data-section="glass">
            <div className="opt-section__head">
              <h2 className="opt-section__title">Glass insert</h2>
              <span className="opt-section__count">Optional</span>
            </div>
            <p className="opt-section__sub">Triple-pane low-E glass. Decorative panels are leaded by hand in our studio.</p>
            <div className="pills">
              {GLASS_OPTIONS.map(g => (
                <button key={g.id} className={"pill " + (config.glass === g.id ? "active" : "")}
                        onClick={() => set({ glass: g.id })}>
                  {g.label}{g.price > 0 && <span style={{ marginLeft: 6, opacity: 0.6 }}>+${g.price}</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Size & swing */}
          <section className="opt-section" ref={el => sectionRefs.current.size = el} data-section="size">
            <div className="opt-section__head">
              <h2 className="opt-section__title">Size & swing</h2>
              <span className="opt-section__count">Standard 80″ height</span>
            </div>
            <p className="opt-section__sub">Width determines pricing. We site-measure exact heights and rough openings on every commission.</p>
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "var(--mocha)", marginBottom: 10
              }}>Width</div>
              <div className="pills">
                {SIZES.map((s, i) => (
                  <button key={s} className={"pill " + (config.sizeIdx === i ? "active" : "")}
                          onClick={() => set({ sizeIdx: i })}>
                    {s}{SPRICES[i] > 0 && <span style={{ marginLeft: 6, opacity: 0.6 }}>+${SPRICES[i]}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "var(--mocha)", marginBottom: 10
              }}>Hinge side (viewed from pull side)</div>
              <div className="pills">
                <button className={"pill " + (config.hingeLeft ? "active" : "")}
                        onClick={() => set({ hingeLeft: true })}>Left hinge</button>
                <button className={"pill " + (!config.hingeLeft ? "active" : "")}
                        onClick={() => set({ hingeLeft: false })}>Right hinge</button>
              </div>
            </div>

            {/* AR teaser */}
            <div className="ar-card">
              <div className="ar-card__icon">
                <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2 7l9-5 9 5v8l-9 5-9-5V7z"/><path d="M11 11l9-5M11 11v9M11 11L2 7"/>
                </svg>
              </div>
              <div>
                <h4 className="title">See it in your home</h4>
                <p className="body">Scan a QR code with your phone to view this exact door at scale in your doorway.</p>
              </div>
              <button className="cta" onClick={() => showToast("AR preview opens on mobile. Scan the QR from the quote page.")}>
                AR preview
              </button>
            </div>
          </section>

          {/* Summary */}
          <div className="summary">
            <h3>Your configuration · The {name}</h3>
            <div className="summary__rows">
              <div className="summary__row"><span className="k">Silhouette</span><span className="v">{styleC.label}</span></div>
              <div className="summary__row"><span className="k">Material</span><span className="v">{mat.label}</span></div>
              <div className="summary__row"><span className="k">Hardware</span><span className="v">{hwStyleC.label} · {hwFinishC.label}</span></div>
              <div className="summary__row"><span className="k">Glass</span><span className="v">{glassC.label}</span></div>
              <div className="summary__row"><span className="k">Size</span><span className="v">{SIZES[config.sizeIdx]} × 80″</span></div>
              <div className="summary__row"><span className="k">Swing</span><span className="v">{config.hingeLeft ? "Left-hand" : "Right-hand"}</span></div>
            </div>
            <div className="summary__totals">
              <div className="summary__price">
                <span className="label">Estimated total</span>
                <span className="amount">${total.toLocaleString()}</span>
              </div>
              <div className="summary__note">Excludes site measurement & install. White-glove install in the GTA is $480.</div>
            </div>
            <div className="summary__actions">
              <a href={"quote.html?" + configToParams(config)} className="btn btn--light">
                Request a quote
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 12, height: 12 }}><path d="M2 6h8M7 2l4 4-4 4"/></svg>
              </a>
              <button className="btn--ghost-light" onClick={onShare}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11.5 5.5L5.5 10M11.5 10.5L5.5 6"/><circle cx="13" cy="4" r="2"/><circle cx="13" cy="12" r="2"/><circle cx="4" cy="8" r="2"/></svg>
                Share link
              </button>
              <button className="btn--ghost-light" onClick={onCompare}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="3" width="5" height="10"/><rect x="9" y="3" width="5" height="10"/></svg>
                Compare
              </button>
            </div>
            {localStorage.getItem("tcd:saved") && (
              <div style={{ marginTop: 16, fontSize: 11, color: "rgba(244,237,225,0.5)", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                Option A saved
                <button onClick={onResetCompare} style={{ background: "none", border: "none", color: "var(--brass)", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, padding: 0 }}>Clear</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare modal */}
      {compareWith && <CompareModal left={compareWith} right={config} onClose={() => setCompareWith(null)}/>}

      {/* Toast */}
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
