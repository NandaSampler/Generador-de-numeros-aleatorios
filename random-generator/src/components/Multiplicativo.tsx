import React, { useState } from "react";
import "../styles/linear.css";

type Row = { i: number; xi: number; op: string; result: number; r: number; };
const HARD_CAP_ROWS = 8192;

function isNonNegIntStr(s: string) { return /^\d+$/.test(s); }
function toInt(s: string) { return parseInt(s, 10); }

export default function LCGMultiplicativeModule() {
    const [showHelp, setShowHelp] = useState(false);
    const [seedStr, setSeedStr] = useState(""); 
    const [kStr, setKStr] = useState("");
    const [aOpt, setAOpt] = useState<"3+8k" | "5+8k">("3+8k");
    const [pStr, setPStr] = useState("");
    const [dStr, setDStr] = useState(""); 

    const [a, setA] = useState<number | null>(null);
    const [g, setG] = useState<number | null>(null);
    const [m, setM] = useState<number | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const decimals = dStr && isNonNegIntStr(dStr) ? toInt(dStr) : 0;

    function handleGenerate() {
        const errs: string[] = [];
        if (!seedStr.length || !isNonNegIntStr(seedStr)) errs.push("Semilla (X₀) debe ser entero positivo.");
        if (!kStr.length || !isNonNegIntStr(kStr)) errs.push("k debe ser entero positivo.");
        if (!pStr.length || !isNonNegIntStr(pStr) || toInt(pStr) <= 0) errs.push("p debe ser entero positivo");
        if (!dStr.length || !isNonNegIntStr(dStr)) errs.push("D (decimales) debe ser entero positivo.");
        else if (toInt(dStr) > 12) errs.push("D máximo permitido: 12.");
        if (errs.length) { setErrors(errs); return; }

        const X0 = toInt(seedStr), k = toInt(kStr), p = toInt(pStr);
        if (p > HARD_CAP_ROWS) { setErrors([`Para no colapsar la UI, usa p ≤ ${HARD_CAP_ROWS}.`]); return; }
        if (X0 <= 0 || X0 % 2 === 0) { setErrors(["La semilla X₀ debe ser impar y mayor que 0."]); return; }

        const g_ = Math.ceil(Math.log(p) / Math.LN2) + 2;
        const m_ = 2 ** g_;
        const a_ = (aOpt === "3+8k") ? (3 + 8 * k) : (5 + 8 * k);

        let x = ((X0 % m_) + m_) % m_;
        const out: Row[] = [];
        const toGenerate = Math.min(p, HARD_CAP_ROWS) + 1;
        for (let i = 1; i <= toGenerate; i++) {
            const op = `(${a_} * ${x}) MOD(${m_})`;
            const xNext = (a_ * x) % m_;
            const r = (m_ > 1) ? xNext / (m_ - 1) : 0;
            out.push({ i, xi: x, op, result: xNext, r });
            x = xNext;
        }

        setErrors([]);
        setA(a_); setG(g_); setM(m_);
        setRows(out);
    }

    function handleClear() {
        setSeedStr(""); setKStr(""); setPStr(""); setDStr("");
        setA(null); setG(null); setM(null);
        setRows([]); setErrors([]);
    }

    function exportCSV() {
        if (!rows.length || m == null) return;
        const header = ["#", "Xi", "Operación", "Resultado", "r_i"];
        const lines = rows.map(r => [r.i, r.xi, r.op, r.result, r.r.toFixed(decimals)]);
        const csv = [header, ...lines]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const fname = `multiplicativo_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = fname; document.body.appendChild(a); a.click();
        a.remove(); URL.revokeObjectURL(url);
    }

    return (
        <div className="container">
            <div className="module-topbar">
                <button className="help-btn" onClick={() => setShowHelp(true)}>Ayuda</button>
            </div>

            <div className="inputs">
                <label>Semilla (X₀) impar &gt; 0
                    <input className="input" type="text" inputMode="numeric" value={seedStr} onChange={e => setSeedStr(e.target.value)} />
                </label>
                <label>c (fijo)
                    <input className="input" type="text" value="0" readOnly />
                </label>
                <label>k
                    <input className="input" type="text" inputMode="numeric" value={kStr} onChange={e => setKStr(e.target.value)} />
                </label>
                <label>Opción de a
                    <select
                        className="input select"          
                        value={aOpt}
                        onChange={(e) => setAOpt(e.target.value as any)}
                    >
                        <option value="3+8k">a = 3 + 8k</option>
                        <option value="5+8k">a = 5 + 8k</option>
                    </select>
                </label>
                <label>p (cantidad a generar)
                    <input className="input" type="text" inputMode="numeric" value={pStr} onChange={e => setPStr(e.target.value)} />
                </label>
                <label>D (decimales)
                    <input className="input" type="text" inputMode="numeric" value={dStr} onChange={e => setDStr(e.target.value)} />
                </label>
            </div>

            <div className="btn-row">
                <button className="btn btn-accent" onClick={handleGenerate}>Generar</button>
                <button className="btn btn-ghost" onClick={handleClear}>Limpiar</button>
                <button className="btn btn-ghost" onClick={exportCSV} disabled={!rows.length}>Exportar CSV</button>
            </div>



            {errors.length > 0 && <div className="error">{errors.map((e, i) => <div key={i}>• {e}</div>)}</div>}

            {rows.length > 0 && a !== null && g !== null && m !== null && (
                <>
                    <div className="summary">
                        a: <strong>{a}</strong>
                        &nbsp;&nbsp; g: <strong>{g}</strong>
                        &nbsp;&nbsp; m: <strong>{m}</strong>
                    </div>
                    <div style={{ marginTop: 6 }}>
                        <span className="badge">Período máximo teórico N = 2^(g−2) = {2 ** (g - 2)}</span>
                        <span className="badge">D = {decimals} decimales</span>
                    </div>

                    <div className="table-wrap" style={{ overflowX: "auto" }}>
                        <table className="table">
                            <thead>
                                <tr><th>#</th><th>Xᵢ</th><th>Operación</th><th>Resultado</th><th>rᵢ = Xᵢ/(m−1)</th></tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.i}>
                                        <td>{r.i}</td><td>{r.xi}</td>
                                        <td className="mono">{r.op}</td>
                                        <td>{r.result}</td>
                                        <td>{r.r.toFixed(decimals)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {showHelp && (
                <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowHelp(false)}>×</button>
                        <div className="modal-title">Ayuda — Algoritmo multiplicativo</div>
                        <ul>
                            <li><b>X₀</b>: Semilla <b>impar</b> &gt; 0.</li>
                            <li><b>c</b>: Fijo en <b>0</b>.</li>
                            <li><b>k</b>: Entero ≥ 0; define <b>a</b> con:
                                <br />• opción 1: <b>a = 3 + 8k</b>
                                <br />• opción 2: <b>a = 5 + 8k</b>
                            </li>
                            <li><b>p</b>: Cantidad de números a generar (se añade 1 extra).</li>
                            <li><b>D</b>: Decimales para mostrar.</li>
                        </ul>
                        <p style={{ marginTop: 8 }}>
                            Para periodo máximo: <b>g = ⌈ln(p)/ln(2)⌉ + 2</b>, <b>m = 2^g</b>.
                            Recurrencia: <b>Xᵢ₊₁ = (a Xᵢ) MOD(m)</b> y <b>rᵢ = Xᵢ/(m−1)</b>.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
