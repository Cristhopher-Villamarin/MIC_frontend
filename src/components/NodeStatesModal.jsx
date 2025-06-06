// src/components/NodeStatesModal.jsx
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import './NodeStatesModal.css';

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function NodeStatesModal({ isOpen, setIsOpen, involvedNodes, propagationLog }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  if (!isOpen) return null;

  // Emotion keys for radar chart labels
  const emotionKeys = [
    'subjectivity', 'polarity', 'fear', 'anger', 'anticipation',
    'trust', 'surprise', 'sadness', 'disgust', 'joy'
  ];

  // Spanish labels for display
  const emotionLabels = {
    subjectivity: 'Subjetividad',
    polarity: 'Polaridad',
    fear: 'Miedo',
    anger: 'Ira',
    anticipation: 'Anticipación',
    trust: 'Confianza',
    surprise: 'Sorpresa',
    sadness: 'Tristeza',
    disgust: 'Disgusto',
    joy: 'Alegría'
  };

  // Radar chart options (same as NodeModal.jsx)
  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.2)',
          lineWidth: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
          lineWidth: 1,
        },
        ticks: {
          display: true,
          backdropColor: 'transparent',
          color: '#d1d5db',
          font: {
            size: 12,
            family: "'Inter', 'Roboto', sans-serif",
          },
          stepSize: 0.2,
        },
        pointLabels: {
          color: '#ffffff',
          font: {
            size: 14,
            family: "'Inter', 'Roboto', sans-serif",
            weight: '600',
          },
          padding: 10,
        },
        suggestedMin: 0,
        suggestedMax: 1,
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 14,
            family: "'Inter', 'Roboto', sans-serif",
            weight: '600',
          },
          boxWidth: 20,
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        padding: 12,
        cornerRadius: 6,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
        tension: 0.2,
      },
      point: {
        radius: 4,
        backgroundColor: '#ffffff',
        borderWidth: 1,
      },
    },
  };

  // Get selected node
  const selectedNode = involvedNodes.find(node => node.id === selectedNodeId);

  // Prepare radar chart data
  const chartData = selectedNode
    ? {
        labels: emotionKeys.map(key => emotionLabels[key]),
        datasets: [
          {
            label: 'Estado Inicial',
            data: selectedNode.initialState,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: '#EF4444',
            borderWidth: 2,
            pointBackgroundColor: '#EF4444',
            pointBorderColor: '#ffffff',
            fill: true,
          },
          {
            label: 'Estado Final',
            data: selectedNode.finalState,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3B82F6',
            borderWidth: 2,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#ffffff',
            fill: true,
          },
        ],
      }
    : null;

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="node-states-modal">
        <h3 className="modal-title">Estados de Nodos en la Propagación</h3>
        <div className="modal-section">
          <h4 className="modal-section-title">Seleccionar Nodo</h4>
          <div className="node-list">
            {involvedNodes.length > 0 ? (
              involvedNodes.map(node => (
                <button
                  key={node.id}
                  className={`node-button ${selectedNodeId === node.id ? 'selected' : ''}`}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  {node.id}
                </button>
              ))
            ) : (
              <p className="no-nodes">No hay nodos involucrados en la propagación.</p>
            )}
          </div>
        </div>
        {selectedNode ? (
          <div className="modal-section">
            <h4 className="modal-section-title">Comparación de Estados: {selectedNode.id}</h4>
            {chartData && selectedNode.initialState.some(v => v !== 0) && selectedNode.finalState.some(v => v !== 0) ? (
              <div className="modal-radar-chart">
                <Radar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <p className="no-data">No hay datos suficientes para mostrar el gráfico de estados.</p>
            )}
          </div>
        ) : (
          <p className="no-selection">Selecciona un nodo para ver su comparación de estados.</p>
        )}
        <div className="modal-footer">
          <button
            onClick={() => setIsOpen(false)}
            className="modal-close-button"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

NodeStatesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  involvedNodes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      initialState: PropTypes.arrayOf(PropTypes.number),
      finalState: PropTypes.arrayOf(PropTypes.number),
    })
  ).isRequired,
  propagationLog: PropTypes.arrayOf(PropTypes.object).isRequired,
};