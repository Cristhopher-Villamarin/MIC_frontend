// src/components/Navbar.jsx
import PropTypes from 'prop-types';
import './Navbar.css';

export default function Navbar({ csvFile, setCsvFile, xlsxFile, setXlsxFile, networkList, selectedNet, setSelectedNet }) {
  return (
    <div className="navbar">
      <h1 className="navbar-title">Análisis de Redes Sociales</h1>
      <div className="navbar-controls">
        <div className="navbar-input-container">
          <label htmlFor="xlsx-file" className="navbar-label">
            Suba el archivo XLSX {xlsxFile ? `(${xlsxFile.name})` : ''}
          </label>
          <input
            id="xlsx-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={e => setXlsxFile(e.target.files?.[0])}
            className="navbar-input"
          />
        </div>
        {networkList.length > 0 && (
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
        )}
      </div>
    </div>
  );
}

Navbar.propTypes = {
  csvFile: PropTypes.object,
  setCsvFile: PropTypes.func.isRequired,
  xlsxFile: PropTypes.object,
  setXlsxFile: PropTypes.func.isRequired,
  networkList: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedNet: PropTypes.string.isRequired,
  setSelectedNet: PropTypes.func.isRequired,
};