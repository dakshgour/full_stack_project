import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

/* ─── Examples ─── */
const EXAMPLES = [
  {
    label: '🔍 Two Sum',
    code: `class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, val in enumerate(nums):
            diff = target - val
            if diff in seen:
                return [seen[diff], i]
            seen[val] = i
        return []`,
    input: `nums = [2, 7, 11, 15]\ntarget = 9`,
  },
  {
    label: '⚡ Binary Search',
    code: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    input: `arr = [2, 5, 8, 12, 16, 23, 38]\ntarget = 23`,
  },
  {
    label: '🪟 Sliding Window',
    code: `def max_subarray_sum(nums, k):
    window_sum = 0
    best = float('-inf')
    for right in range(len(nums)):
        window_sum += nums[right]
        if right >= k:
            window_sum -= nums[right - k]
        if right >= k - 1:
            best = max(best, window_sum)
    return best`,
    input: `nums = [2, 1, 5, 1, 3, 2]\nk = 3`,
  },
  {
    label: '👉👈 Two Pointers',
    code: `def two_sum_sorted(nums, target):
    left = 0
    right = len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        elif total < target:
            left += 1
        else:
            right -= 1
    return []`,
    input: `nums = [1, 2, 4, 7, 11, 15]\ntarget = 15`,
  },
  {
    label: '📊 Kadane',
    code: `def max_subarray(nums):
    best = nums[0]
    curr = nums[0]
    for val in nums[1:]:
        curr = max(val, curr + val)
        best = max(best, curr)
    return best`,
    input: `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`,
  },
];

/* ─── Pointer config ─── */
const PTR_COLORS = {
  left:   { bg: '#58a6ff', text: '#000' },
  right:  { bg: '#ff7b72', text: '#000' },
  mid:    { bg: '#f2cc60', text: '#000' },
  i:      { bg: '#29d765', text: '#000' },
  j:      { bg: '#d2a8ff', text: '#000' },
  start:  { bg: '#58a6ff', text: '#000' },
  end:    { bg: '#ff7b72', text: '#000' },
  slow:   { bg: '#58a6ff', text: '#000' },
  fast:   { bg: '#ff7b72', text: '#000' },
  k:      { bg: '#f2cc60', text: '#000' },
  p:      { bg: '#d2a8ff', text: '#000' },
};

/* ─── Detect viz mode from all steps ─── */
function detectVizMode(steps) {
  if (!steps?.length) return 'generic';
  const allVars = new Set();
  steps.forEach(s => {
    Object.keys(s.vars || {}).forEach(k => allVars.add(k));
    (s.scalarEntries || []).forEach(e => allVars.add(e.name));
    (s.listViews || []).forEach(lv => allVars.add(lv.name));
  });
  const has = k => allVars.has(k);
  if (has('left') && has('right') && has('mid')) return 'binary-search';
  if (has('left') && has('right') && (has('window_sum') || has('curr_sum') || has('k'))) return 'sliding-window';
  if (has('left') && has('right')) return 'two-pointers';
  return 'generic';
}

/* ─── Get merged scalar map from a step ─── */
function getScalars(step) {
  const out = {};
  Object.entries(step?.vars || {}).forEach(([k, v]) => {
    if (typeof v !== 'object' || v === null) out[k] = v;
  });
  (step?.scalarEntries || []).forEach(({ name, value }) => { out[name] = value; });
  return out;
}

/* ─── Array strip with pointers ─── */
function ArrayCanvas({ step, vizMode }) {
  const listViews = step?.listViews || [];
  if (!listViews.length) return null;

  const scalars = getScalars(step);

  return (
    <div className="pgv-arrays">
      {listViews.map((lv, li) => {
        const { name, values = [] } = lv;
        if (!values.length) return null;

        const pointers = {};
        Object.entries(PTR_COLORS).forEach(([pname]) => {
          const val = scalars[pname];
          if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < values.length) {
            pointers[pname] = val;
          }
        });

        const wLeft  = scalars.left  ?? null;
        const wRight = scalars.right ?? null;
        const isWin  = vizMode === 'sliding-window' && wLeft !== null && wRight !== null;

        return (
          <div key={li} className="pgv-array-block">
            <div className="pgv-array-label">
              <span className="pgv-array-name">{name}</span>
              <span className="pgv-array-len">len={values.length}</span>
            </div>

            {/* Pointer flags row */}
            <div className="pgv-ptr-flags" style={{ gridTemplateColumns: `repeat(${Math.min(values.length, 30)}, minmax(52px, 1fr))` }}>
              {values.slice(0, 30).map((_, idx) => {
                const ptrsHere = Object.entries(pointers).filter(([, pos]) => pos === idx);
                return (
                  <div key={idx} className="pgv-ptr-flag-slot">
                    {ptrsHere.map(([pname]) => (
                      <span key={pname} className="pgv-ptr-chip" style={{ background: PTR_COLORS[pname]?.bg, color: PTR_COLORS[pname]?.text }}>
                        {pname}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Array cells */}
            <div className="pgv-array-strip" style={{ gridTemplateColumns: `repeat(${Math.min(values.length, 30)}, minmax(52px, 1fr))` }}>
              {values.slice(0, 30).map((v, idx) => {
                const isFocus = idx === step?.focus;
                const ptrsHere = Object.entries(pointers).filter(([, pos]) => pos === idx);
                const isWinCell = isWin && idx >= wLeft && idx <= wRight;
                let cls = 'pgv-cell';
                if (isFocus) cls += ' pgv-cell--active';
                else if (ptrsHere.length) cls += ' pgv-cell--pointed';
                else if (isWinCell) cls += ' pgv-cell--window';
                const bdrColor = ptrsHere[0] ? PTR_COLORS[ptrsHere[0][0]]?.bg : undefined;
                return (
                  <div key={idx} className={cls} style={bdrColor && !isFocus ? { borderColor: bdrColor, borderWidth: 2 } : {}}>
                    <span className="pgv-cell-val">{v === null || v === undefined ? 'null' : String(v)}</span>
                    <span className="pgv-cell-idx">{idx}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Scalar badges ─── */
const SCALAR_PRIORITY = ['result','best','ans','target','total','window_sum','curr_sum','curr','diff','val','i','j','left','right','mid','k'];

function ScalarBadges({ step }) {
  const scalars = getScalars(step);
  if (!Object.keys(scalars).length) return null;

  const entries = Object.entries(scalars);
  entries.sort(([a], [b]) => {
    const ai = SCALAR_PRIORITY.indexOf(a);
    const bi = SCALAR_PRIORITY.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });

  const shown = entries.slice(0, 10);

  return (
    <div className="pgv-scalars">
      {shown.map(([name, value]) => {
        const ptrColor = PTR_COLORS[name]?.bg;
        return (
          <div key={name} className="pgv-scalar" style={ptrColor ? { borderColor: ptrColor } : {}}>
            <span className="pgv-scalar-label">{name}</span>
            <span className="pgv-scalar-val" style={ptrColor ? { color: ptrColor } : {}}>
              {JSON.stringify(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── HashMap canvas ─── */
function DictCanvas({ step }) {
  const dicts = step?.dictViews || [];
  if (!dicts.length) return null;
  return (
    <div className="pgv-dicts">
      {dicts.map((dv, i) => {
        const entries = Object.entries(dv.entries || {});
        return (
          <div key={i} className="pgv-dict-block">
            <div className="pgv-dict-header">
              <span className="pgv-dict-name">{dv.name}</span>
              <span className="pgv-dict-badge">dict · {entries.length} keys</span>
            </div>
            <div className="pgv-dict-grid">
              {entries.length === 0 ? (
                <div className="pgv-dict-empty">{ }</div>
              ) : (
                entries.map(([k, v]) => (
                  <div key={k} className="pgv-dict-entry">
                    <span className="pgv-dict-key">{k}</span>
                    <span className="pgv-dict-arrow">→</span>
                    <span className="pgv-dict-val">{JSON.stringify(v)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Binary search range indicator ─── */
function BinarySearchRange({ step }) {
  const lv = step?.listViews?.[0];
  if (!lv) return null;
  const scalars = getScalars(step);
  const { left, right, mid, target } = scalars;
  const vals = lv.values || [];
  if (left === undefined && right === undefined) return null;
  const range = (right ?? vals.length - 1) - (left ?? 0) + 1;
  return (
    <div className="pgv-bs-info">
      <div className="pgv-bs-chip" style={{ background: 'rgba(88,166,255,0.15)', borderColor: '#58a6ff' }}>
        <span style={{ color: '#58a6ff' }}>left</span> = {left ?? '—'}
      </div>
      {mid !== undefined && (
        <div className="pgv-bs-chip" style={{ background: 'rgba(242,204,96,0.15)', borderColor: '#f2cc60' }}>
          <span style={{ color: '#f2cc60' }}>mid</span> = {mid}
          {vals[mid] !== undefined && <span style={{ color: '#888', marginLeft: 4 }}>→ {vals[mid]}</span>}
        </div>
      )}
      <div className="pgv-bs-chip" style={{ background: 'rgba(255,123,114,0.15)', borderColor: '#ff7b72' }}>
        <span style={{ color: '#ff7b72' }}>right</span> = {right ?? '—'}
      </div>
      {target !== undefined && (
        <div className="pgv-bs-chip" style={{ background: 'rgba(41,215,101,0.15)', borderColor: '#29d765' }}>
          <span style={{ color: '#29d765' }}>target</span> = {target}
        </div>
      )}
      <div className="pgv-bs-chip" style={{ background: '#1a1a1a', borderColor: '#333' }}>
        search range: {range} element{range !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

/* ─── Syntax highlighter ─── */
const PY_KW = new Set(['def','class','return','if','elif','else','for','while','in','not','and','or','is','None','True','False','import','from','as','pass','break','continue','lambda','with','yield','raise','try','except','finally','global','nonlocal','assert','del']);
const PY_BUILTIN = new Set(['len','range','enumerate','zip','map','filter','sorted','reversed','list','dict','set','tuple','int','str','float','bool','print','max','min','sum','abs','isinstance','type','hasattr','getattr','chr','ord','pow','round','bin','hex','any','all','next','iter']);

function highlightPy(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '#') { tokens.push(<span key={i} className="hl-comment">{text.slice(i)}</span>); break; }
    if (text[i] === '"' || text[i] === "'") {
      const q = text[i]; let j = i + 1;
      while (j < text.length && text[j] !== q) j++;
      tokens.push(<span key={i} className="hl-str">{text.slice(i, j + 1)}</span>); i = j + 1; continue;
    }
    if (/\d/.test(text[i])) {
      let j = i; while (j < text.length && /[\d.]/.test(text[j])) j++;
      tokens.push(<span key={i} className="hl-num">{text.slice(i, j)}</span>); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(text[i])) {
      let j = i; while (j < text.length && /\w/.test(text[j])) j++;
      const w = text.slice(i, j);
      if (PY_KW.has(w)) tokens.push(<span key={i} className="hl-kw">{w}</span>);
      else if (PY_BUILTIN.has(w)) tokens.push(<span key={i} className="hl-builtin">{w}</span>);
      else tokens.push(<span key={i}>{w}</span>);
      i = j; continue;
    }
    tokens.push(<span key={i}>{text[i]}</span>); i++;
  }
  return tokens;
}

/* ─── Code viewer ─── */
function CodeViewer({ code, activeLine }) {
  const activeRef = useRef(null);
  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [activeLine]);
  return (
    <div className="pgv-code-scroll">
      {code.split('\n').map((line, idx) => {
        const ln = idx + 1;
        const active = ln === activeLine;
        return (
          <div key={idx} ref={active ? activeRef : null} className={`pgv-code-line${active ? ' active' : ''}`}>
            <span className="pgv-ln">{ln}</span>
            <span className="pgv-lc">{highlightPy(line)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Transport controls ─── */
function Transport({ idx, total, onPrev, onNext, onReset, playing, onTogglePlay, speed, onSpeed }) {
  return (
    <div className="pgv-transport">
      <div className="pgv-transport-btns">
        <button className="pgv-tbtn" onClick={onReset} title="Reset">⏮</button>
        <button className="pgv-tbtn" onClick={onPrev} disabled={idx === 0}>◀</button>
        <button className={`pgv-tbtn pgv-tbtn--play${playing ? ' active' : ''}`} onClick={onTogglePlay}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button className="pgv-tbtn" onClick={onNext} disabled={idx >= total - 1}>▶</button>
        <span className="pgv-step-counter">
          <b>{idx + 1}</b> / {total}
        </span>
      </div>
      <div className="pgv-progress">
        <div className="pgv-progress-fill" style={{ width: total > 1 ? `${(idx / (total - 1)) * 100}%` : '0%' }} />
      </div>
      <div className="pgv-speed-row">
        <span className="pgv-speed-label">Speed</span>
        {[0.5, 1, 2, 3].map(s => (
          <button key={s} className={`pgv-speed-btn${speed === s ? ' active' : ''}`} onClick={() => onSpeed(s)}>{s}×</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Result badge ─── */
function ReturnBadge({ result }) {
  if (result === undefined || result === null) return null;
  return (
    <div className="pgv-return-badge">
      <span className="pgv-return-icon">↩</span>
      <span className="pgv-return-label">return</span>
      <code className="pgv-return-val">{JSON.stringify(result)}</code>
    </div>
  );
}

/* ─── Main Playground ─── */
export default function PlaygroundPage() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [input, setInput] = useState(EXAMPLES[0].input);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [steps, setSteps] = useState([]);
  const [runtime, setRuntime] = useState(null);
  const [usedDefaults, setUsedDefaults] = useState({});
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [vizMode, setVizMode] = useState('generic');
  const timerRef = useRef(null);

  function loadExample(ex) {
    setCode(ex.code); setInput(ex.input);
    setStatus('idle'); setError(''); setSteps([]); setRuntime(null);
    setUsedDefaults({});
    setIdx(0); setPlaying(false);
  }

  async function handleTrace() {
    clearInterval(timerRef.current);
    setStatus('loading'); setError(''); setSteps([]); setRuntime(null); setUsedDefaults({}); setIdx(0); setPlaying(false);
    try {
      const res = await api.playgroundTrace({ code, inputOverride: input });
      const s = res.steps || [];
      setSteps(s);
      setRuntime(res.runtime || null);
      setUsedDefaults(res.runtime?.usedDefaults || {});
      setVizMode(detectVizMode(s));
      setStatus(s.length ? 'done' : 'empty');
    } catch (e) {
      setError(e.message || 'Trace failed'); setStatus('error');
    }
  }

  /* Auto-play */
  useEffect(() => {
    clearInterval(timerRef.current);
    if (playing && steps.length) {
      timerRef.current = setInterval(() => {
        setIdx(i => {
          if (i >= steps.length - 1) { setPlaying(false); return i; }
          return i + 1;
        });
      }, Math.round(900 / speed));
    }
    return () => clearInterval(timerRef.current);
  }, [playing, steps.length, speed]);

  const step = steps[idx] ?? null;
  const finalResult = runtime?.result;

  return (
    <div className="pgv-page">
      {/* ── Top bar ── */}
      <div className="pgv-topbar">
        <div className="pgv-brand">
          <span className="pgv-brand-icon">🐍</span>
          <div>
            <div className="pgv-brand-title">Python Playground</div>
            <div className="pgv-brand-sub">Paste any code · See it visualized step-by-step</div>
          </div>
        </div>
        <div className="pgv-examples">
          {EXAMPLES.map(ex => (
            <button key={ex.label} className="pgv-ex-btn" onClick={() => loadExample(ex)}>{ex.label}</button>
          ))}
        </div>
      </div>

      {/* ── Main split ── */}
      <div className="pgv-body">

        {/* LEFT — editor */}
        <div className="pgv-left">
          <div className="pgv-panel">
            <div className="pgv-panel-head">
              <span>Code</span>
              <span className="pgv-badge pgv-badge--orange">Python 3</span>
            </div>
            <textarea
              id="pg-code-input"
              className="pgv-editor"
              spellCheck={false}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste your Python / LeetCode code here…"
            />
          </div>
          <div className="pgv-panel">
            <div className="pgv-panel-head">
              <span>Input</span>
              <span className="pgv-hint">one arg per line: <code>nums = [1,2,3]</code></span>
            </div>
            <textarea
              id="pg-input-field"
              className="pgv-editor pgv-editor--sm"
              spellCheck={false}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`nums = [2, 7, 11, 15]\ntarget = 9`}
            />
          </div>
          <button
            id="pg-trace-btn"
            className={`pgv-run-btn${status === 'loading' ? ' loading' : ''}`}
            onClick={handleTrace}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? <><span className="pgv-spin" /> Tracing…</> : '▶  Visualize Code'}
          </button>
          {status === 'error' && <div className="pgv-err"><b>⚠ Error</b><pre>{error}</pre></div>}
          {status === 'empty' && <div className="pgv-warn"><b>No steps captured.</b> Make sure your function is callable with the provided input.</div>}
          {Object.keys(usedDefaults).length > 0 && status === 'done' && (
            <div className="pgv-info">
              ℹ️ No input matched — ran with smart defaults:<br />
              {Object.entries(usedDefaults).map(([k, v]) => (
                <code key={k}>{k} = {v}</code>
              ))}
            </div>
          )}

          {/* Minimap — code viewer while tracing */}
          {status === 'done' && steps.length > 0 && (
            <div className="pgv-panel pgv-panel--code">
              <div className="pgv-panel-head">
                <span>📍 Execution Trace</span>
                {runtime?.entryLabel && <span className="pgv-badge pgv-badge--dim">{runtime.entryLabel}</span>}
              </div>
              <CodeViewer code={code} activeLine={step?.line} />
            </div>
          )}
        </div>

        {/* RIGHT — visualization */}
        <div className="pgv-right">
          {status === 'idle' && (
            <div className="pgv-idle">
              <div className="pgv-idle-icon">⚡</div>
              <h2>Ready to visualize</h2>
              <p>Pick an example or paste your own code, add input, then click <strong>Visualize Code</strong>.</p>
              <div className="pgv-feature-grid">
                {['LeetCode class Solution','Standalone functions','Arrays with pointer arrows','HashMaps as card grids','Binary search range','Sliding window highlight','Auto-play with speed'].map(f => (
                  <div key={f} className="pgv-feature">✓ {f}</div>
                ))}
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="pgv-idle">
              <div className="pgv-loading-ring" />
              <p>Running your code…</p>
            </div>
          )}

          {status === 'done' && steps.length > 0 && (
            <div className="pgv-canvas">
              {/* Step title + note */}
              <div className="pgv-step-head">
                <div className="pgv-step-badge">Step {idx + 1} / {steps.length}</div>
                <div className="pgv-step-title">{step?.title}</div>
              </div>
              {step?.note && <div className="pgv-step-note">{step.note}</div>}

              {/* Main visual area */}
              <div className="pgv-viz-area">
                <ArrayCanvas step={step} vizMode={vizMode} />
                {vizMode === 'binary-search' && <BinarySearchRange step={step} />}
                <ScalarBadges step={step} />
                <DictCanvas step={step} />
                {step?.result !== undefined && <ReturnBadge result={step.result} />}
              </div>

              {/* Final result */}
              {idx === steps.length - 1 && finalResult !== undefined && (
                <div className="pgv-final">
                  <span className="pgv-final-icon">🏁</span>
                  <span className="pgv-final-label">Final Return Value</span>
                  <code className="pgv-final-val">{JSON.stringify(finalResult)}</code>
                </div>
              )}

              {/* Transport */}
              <Transport
                idx={idx} total={steps.length}
                onPrev={() => { setPlaying(false); setIdx(i => Math.max(0, i - 1)); }}
                onNext={() => { setPlaying(false); setIdx(i => Math.min(steps.length - 1, i + 1)); }}
                onReset={() => { setPlaying(false); setIdx(0); }}
                playing={playing} onTogglePlay={() => setPlaying(p => !p)}
                speed={speed} onSpeed={setSpeed}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
