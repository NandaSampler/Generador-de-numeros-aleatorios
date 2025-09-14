import { useState } from "react";   
import Navbar from "./components/Navbar";
import Lineal from "./components/Lineal";
import Multiplicativo from "./components/Multiplicativo";
import Footer from "./components/Footer";
import "./styles/linear.css";

export default function App() {
  const [tab, setTab] = useState<"lineal" | "multiplicativo">("lineal");

  return (
    <>
      <Navbar current={tab} onChange={setTab} />
      <main className="page">
        <h1 className="left-title">
          {tab === "lineal" ? "Algoritmo lineal" : "Algoritmo multiplicativo"}
        </h1>
        {tab === "lineal" ? <Lineal /> : <Multiplicativo />}
      </main>
      <Footer />
    </>
  );
}
