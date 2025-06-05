// src/components/RealWorldNavbar.jsx
import PropTypes from 'prop-types';
import './Navbar.css'; // Reutilizamos los estilos de Navbar.css

export default function RealWorldNavbar({ nodesCsvFile, setNodesCsvFile, linksCsvFile, setLinksCsvFile, networkList, selectedNet, setSelectedNet }) {
  return (
    <div className="navbar">
      <h1 className="navbar-title">Análisis de Redes del Mundo Real</h1>
      <div className="navbar-controls">
        <input
          type="file"
          accept=".csv"
          onChange={e => setNodesCsvFile(e.target.files?.[0])}
          className="navbar-input"
          placeholder="Subir CSV de nodos"
        />
        <input
          type="file"
          accept=".csv"
          onChange={e => setLinksCsvFile(e.target.files?.[0])}
          className="navbar-input"
          placeholder="Subir CSV de relaciones"
        />
        {networkList.length > 0 && (
          <select
            value={selectedNet}
            onChange={e => setSelectedNet(e.target.value)}
            className="navbar-select"
          >
            <option value="">Selecciona red</option>
            {networkList.map(id => (
              <option key={id} value={id}>
                Red: {id}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

RealWorldNavbar.propTypes = {
  nodesCsvFile: PropTypes.object,
  setNodesCsvFile: PropTypes.func.isRequired,
  linksCsvFile: PropTypes.object,
  setLinksCsvFile: PropTypes.func.isRequired,
  networkList: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedNet: PropTypes.string.isRequired,
  setSelectedNet: PropTypes.func.isRequired,
};