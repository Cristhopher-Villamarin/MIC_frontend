import PropTypes from 'prop-types';
import './HolmeKimInput.css';

export default function VectorsInput({ onGenerateVectors, numNodes }) {
  return (
    <div className="navbar">
      <h3 className="navbar-title">Generar Vectores Aleatorios</h3>
      <div className="navbar-controls">
        <div className="navbar-input-container">
          <span className="navbar-label">Número de nodos: {numNodes}</span>
          <button
            onClick={() => onGenerateVectors(numNodes)}
            className="button"
            disabled={numNodes === 0}
          >
            Generar Vectores Aleatoriamente
          </button>
        </div>
      </div>
    </div>
  );
}

VectorsInput.propTypes = {
  onGenerateVectors: PropTypes.func.isRequired,
  numNodes: PropTypes.number.isRequired,
};