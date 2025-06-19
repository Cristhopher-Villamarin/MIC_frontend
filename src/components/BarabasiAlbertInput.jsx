import { useState } from 'react';
import PropTypes from 'prop-types';
import './Navbar.css'; // Reutilizamos estilos de Navbar para consistencia

export default function BarabasiAlbertInput({ onGenerateNetwork }) {
  const [numNodes, setNumNodes] = useState('');
  const [numEdges, setNumEdges] = useState('');

  const handleGenerate = () => {
    const nodes = parseInt(numNodes);
    const edges = parseInt(numEdges);
    if (isNaN(nodes) || nodes < 2) {
      alert('Por favor, ingrese un número válido de nodos (mínimo 2).');
      return;
    }
    if (isNaN(edges) || edges < 1 || edges > nodes) {
      alert('Por favor, ingrese un número válido de enlaces por nodo (entre 1 y el número de nodos).');
      return;
    }
    onGenerateNetwork(nodes, edges);
  };

  return (
    <div className="navbar">
      <h1 className="navbar-title">Generación de Redes Barabási-Albert</h1>
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
        <button onClick={handleGenerate} className="button">
          Generar Red
        </button>
      </div>
    </div>
  );
}

BarabasiAlbertInput.propTypes = {
  onGenerateNetwork: PropTypes.func.isRequired,
};