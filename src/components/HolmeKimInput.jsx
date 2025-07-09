import { useState } from 'react';
import PropTypes from 'prop-types';
import './HolmeKimInput.css';

export default function HolmeKimInput({ onGenerateNetwork }) {
  const [numNodes, setNumNodes] = useState('');
  const [numEdges, setNumEdges] = useState('');
  const [triadProb, setTriadProb] = useState('');

  const handleGenerate = () => {
    const n = parseInt(numNodes);
    const m = parseInt(numEdges);
    const p = parseFloat(triadProb);

    if (isNaN(n) || n < 2) {
      alert('El número de nodos debe ser al menos 2.');
      return;
    }
    if (isNaN(m) || m < 1 || m >= n) {
      alert('El número de enlaces por nodo debe ser al menos 1 y menor que el número de nodos.');
      return;
    }
    if (isNaN(p) || p < 0 || p > 1) {
      alert('La probabilidad de formación de triadas debe estar entre 0 y 1.');
      return;
    }

    onGenerateNetwork(n, m, p);
  };

  return (
    <div className="navbar">
      <h1 className="navbar-title">Generación de Redes Holme-Kim</h1>
      <div className="navbar-controls">
        <div className="navbar-input-container">
          <label htmlFor="num-nodes" className="navbar-label">Número de Nodos</label>
          <input
            id="num-nodes"
            type="number"
            value={numNodes}
            onChange={(e) => setNumNodes(e.target.value)}
            className="navbar-input"
            placeholder="Ej. 100"
            min="2"
          />
        </div>
        <div className="navbar-input-container">
          <label htmlFor="num-edges" className="navbar-label">Enlaces por Nodo (m)</label>
          <input
            id="num-edges"
            type="number"
            value={numEdges}
            onChange={(e) => setNumEdges(e.target.value)}
            className="navbar-input"
            placeholder="Ej. 2"
            min="1"
          />
        </div>
        <div className="navbar-input-container">
          <label htmlFor="triad-prob" className="navbar-label">Probabilidad de Triadas (p)</label>
          <input
            id="triad-prob"
            type="number"
            value={triadProb}
            onChange={(e) => setTriadProb(e.target.value)}
            className="navbar-input"
            placeholder="Ej. 0.5"
            step="0.1"
            min="0"
            max="1"
          />
        </div>
        <button onClick={handleGenerate} className="button">
          Generar Red
        </button>
      </div>
    </div>
  );
}

HolmeKimInput.propTypes = {
  onGenerateNetwork: PropTypes.func.isRequired,
};