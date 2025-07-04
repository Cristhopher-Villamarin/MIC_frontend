// src/components/Sidebar.jsx
import PropTypes from 'prop-types';
import './Sidebar.css';

export default function Sidebar({ onMenuSelect }) {
  const menuSections = [
    {
      title: 'Visualización de Redes',
      items: [
        { label: 'Redes Barabási-Albert', key: 'barabasi-albert' },
        { label: 'Redes Holme-Kim Dirigidas', key: 'holme-kim' },
        { label: 'Redes del Mundo Real', key: 'real-world' },
      ],
    },
    {
      title: 'Propagación de Información',
      items: [
        { label: 'Barabási - Modelo SI Clásico', key: 'barabasi-si' },
        { label: 'Holme-Kim SI Adaptado', key: 'holme-kim-si' },
        { label: 'Mundo Real - Modelo RIP-DSN', key: 'real-world-rip' },
      ],
    },
    {
      title: 'Comportamiento de Usuario',
      items: [
        { label: 'Simulación con Perfiles de Comportamiento', key: 'behavior-profiles' },
        { label: 'Estados de los Nodos', key: 'node-states' },
      ],
    },
  ];

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">
        Simulación de Propagación de Información de Redes Sociales Digitales (RSD)
      </h2>
      {menuSections.map((section, index) => (
        <div key={index} className="sidebar-section">
          <h3 className="sidebar-section-title">{section.title}</h3>
          <ul className="sidebar-list">
            {section.items.map((item) => (
              <li key={item.key} className="sidebar-item">
                <button
                  className="sidebar-button"
                  onClick={() => onMenuSelect(item.key)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

Sidebar.propTypes = {
  onMenuSelect: PropTypes.func.isRequired,
};