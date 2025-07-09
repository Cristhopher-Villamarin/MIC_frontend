// src/components/RealWorldNavbar.jsx
import PropTypes from 'prop-types';
import './Navbar.css';

export default function RealWorldNavbar({ nodesCsvFile, setNodesCsvFile, linksCsvFile, setLinksCsvFile, networkList, selectedNet, setSelectedNet, viewMode, setCsvFile }) {
  const getNavbarTitle = () => {
    switch (viewMode) {
      case 'real-world':
        return 'Análisis de Redes del Mundo Real';
      case 'rip-dsn':
        return 'Modelo RIP-DSN';
      case 'simulation':
        return 'Simulación de Redes';
      default:
        return 'Análisis de Redes';
    }
  };

  // Handle file changes and synchronize with csvFile
  const handleLinksCsvChange = (e) => {
    const file = e.target.files?.[0];
    setLinksCsvFile(file);
    setCsvFile(file); // Update csvFile in App.jsx
  };

  return (
    <div className="navbar">
      <h1 className="navbar-title">{getNavbarTitle()}</h1>
      <div className="navbar-controls">
        {viewMode !== 'rip-dsn' && (
          <>
            <div className="navbar-input-container">
              <label htmlFor="nodes-file" className="navbar-label">Suba el archivo de nodos</label>
              <input
                id="nodes-file"
                type="file"
                accept=".csv"
                onChange={e => setNodesCsvFile(e.target.files?.[0])}
                className="navbar-input"
              />
            </div>
            <div className="navbar-input-container">
              <label htmlFor="links-file" className="navbar-label">Suba el archivo de red</label>
              <input
                id="links-file"
                type="file"
                accept=".csv"
                onChange={handleLinksCsvChange}
                className="navbar-input"
              />
            </div>
          </>
        )}
        {networkList.length > 0 ? (
          <div className="navbar-select-container">
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
          </div>
        ) : (
          viewMode === 'rip-dsn' && (
            <p className="navbar-message">No hay redes disponibles. Suba archivos en "Redes del Mundo Real".</p>
          )
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
  viewMode: PropTypes.string.isRequired,
  setCsvFile: PropTypes.func.isRequired, // Added to sync csvFile
};