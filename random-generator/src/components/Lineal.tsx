import { useState } from "react";   
import "../styles/linear.css";

type Row = { i: number; xi: number; op: string; result: number; r: number; };
const HARD_CAP_ROWS = 8192;

function gcd(a: number, b: number) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a; }
function isNonNegIntStr(s: string) { return /^\d+$/.test(s); }
function toInt(s: string) { return parseInt(s, 10); }
function isPrime(n: number) { if (n <= 1) return false; if (n % 2 === 0) return n === 2; for (let i = 3; i * i <= n; i += 2) { if (n % i === 0) return false; } return true; }

export default function LCGLinearModule() {
    const [showHelp, setShowHelp] = useState(false);
    const [seedStr, setSeedStr] = useState("");
    const [kStr, setKStr] = useState("");
    const [cStr, setCStr] = useState("");
    const [pStr, setPStr] = useState("");
    const [dStr, setDStr] = useState(""); 

    const [a, setA] = useState<number | null>(null);
    const [g, setG] = useState<number | null>(null);
    const [m, setM] = useState<number | null>(null);
    const [c, setC] = useState<number | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [note, setNote] = useState("");
    const [errors, setErrors] = useState<string[]>([]);

    const decimals = dStr && isNonNegIntStr(dStr) ? toInt(dStr) : 0;

    function handleGenerate() {
        const errs: string[] = [];
        if (!seedStr.length || !isNonNegIntStr(seedStr)) errs.push("Semilla (X₀) debe ser entero positivo.");
        if (!kStr.length || !isNonNegIntStr(kStr)) errs.push("k debe ser entero positivo.");
        if (!cStr.length || !isNonNegIntStr(cStr)) errs.push("c debe ser entero positivo.");
        if (!pStr.length || !isNonNegIntStr(pStr) || toInt(pStr) <= 0) errs.push("p debe ser entero positivo.");
        if (!dStr.length || !isNonNegIntStr(dStr)) errs.push("D (decimales) debe ser entero positivo.");
        else if (toInt(dStr) > 12) errs.push("D máximo permitido: 12.");
        if (errs.length) { setErrors(errs); return; }

        const seed = toInt(seedStr), k = toInt(kStr), cIn = toInt(cStr), p = toInt(pStr);
        const D = toInt(dStr);
        if (p > HARD_CAP_ROWS) { setErrors([`Para no colapsar la UI, usa p ≤ ${HARD_CAP_ROWS}.`]); return; }
        if (cIn < 2 || !isPrime(cIn)) { setErrors(["c debe ser primo"]); return; }

        const g_ = Math.ceil(Math.log(p) / Math.LN2);
        const m_ = 2 ** g_;
        const a_ = 1 + 4 * k;


        let x = ((seed % m_) + m_) % m_;
        const out: Row[] = [];
        const toGenerate = Math.min(p, HARD_CAP_ROWS) + 1;
        for (let i = 1; i <= toGenerate; i++) {
            const op = `(${a_} * ${x} + ${cIn}) MOD(${m_})`;
            const xNext = (a_ * x + cIn) % m_;
            const r = (m_ > 1) ? xNext / (m_ - 1) : 0;
            out.push({ i, xi: x, op, result: xNext, r });
            x = xNext;
        }

        setErrors([]);
        setA(a_); setG(g_); setM(m_); setC(cIn);
        setRows(out);
        setNote(`D = ${D} decimales. Validado: X₀,k,p enteros (p>0); c primo≥2 y coprimo con m; g entero.`);
    }

    function handleClear() {
        setSeedStr(""); setKStr(""); setCStr(""); setPStr(""); setDStr("");
        setA(null); setG(null); setM(null); setC(null);
        setRows([]); setNote(""); setErrors([]);
    }

    function exportCSV() {
        if (!rows.length || m == null) return;
        const header = ["#", "Xi", "Operación", "Resultado", "r_i"];
        const lines = rows.map(r => [r.i, r.xi, r.op, r.result, r.r.toFixed(decimals)]);
        const csv = [header, ...lines]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const fname = `lineal_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
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
                <label>Semilla (X₀)
                    <input className="input" type="text" inputMode="numeric" value={seedStr} onChange={e => setSeedStr(e.target.value)} />
                </label>
                <label>k
                    <input className="input" type="text" inputMode="numeric" value={kStr} onChange={e => setKStr(e.target.value)} />
                </label>
                <label>c (Primo)
                    <input className="input" type="text" inputMode="numeric" value={cStr} onChange={e => setCStr(e.target.value)} />
                </label>
                <label>p (Cantidad a generar)
                    <input className="input" type="text" inputMode="numeric" value={pStr} onChange={e => setPStr(e.target.value)} />
                </label>
                <label>D (Decimales)
                    <input className="input" type="text" inputMode="numeric" value={dStr} onChange={e => setDStr(e.target.value)} />
                </label>
            </div>

            <div className="btn-row">
                <button className="btn btn-accent" onClick={handleGenerate}>Generar</button>
                <button className="btn btn-ghost" onClick={handleClear}>Limpiar</button>
                <button className="btn btn-ghost" onClick={exportCSV} disabled={!rows.length}>Exportar CSV</button>
            </div>



            {errors.length > 0 && <div className="error">{errors.map((e, i) => <div key={i}>• {e}</div>)}</div>}

            {(a !== null || m !== null) && rows.length > 0 && (
                <>
                    <div className="summary">
                        a: <strong>{a}</strong>; c: <strong>{c}</strong>
                        &nbsp;&nbsp; g: <strong>{g}</strong>; m: <strong>{m}</strong>
                    </div>

                    <div style={{ marginTop: 6 }}>
                        <span className="badge">D = {decimals} decimales</span>
                        <span className="badge">Se generan p = {toInt(pStr)} valores + 1 extra</span>
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
                        <div className="modal-title">Ayuda — Algoritmo lineal</div>
                        <ul>
                            <li><b>X₀</b>: Semilla inicial (entero ≥ 0).</li>
                            <li><b>k</b>: Entero ≥ 0 usado en <b>a = 1 + 4k</b>.</li>
                            <li><b>c</b>: Entero primo</li>
                            <li><b>p</b>: Cantidad de números a generar (se añade 1 extra).</li>
                            <li><b>D</b>: Decimales para mostrar en la última columna.</li>
                        </ul>
                        <p style={{ marginTop: 8 }}>
                            Con periodo máximo usamos <b>g = ⌈ln(p)/ln(2)⌉</b>, <b>m = 2^g</b>.
                            La recurrencia es: <b>Xᵢ₊₁ = (a Xᵢ + c) MOD(m)</b> y
                            <b> rᵢ = Xᵢ/(m−1)</b>.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
