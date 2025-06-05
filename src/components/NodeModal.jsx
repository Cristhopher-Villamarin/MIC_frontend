import PropTypes from 'prop-types';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import './NodeModal.css';

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function NodeModal({ isOpen, setIsOpen, modalNode, propagationLog }) {
  if (!isOpen || !modalNode) return null;

  // Filter propagation log for this node (as receiver)
  const nodeHistory = propagationLog
    .filter(entry => entry.receiver === modalNode.id)
    .map(entry => ({
      timeStep: entry.t,
      action: entry.action,
      sender: entry.sender,
      state_in_before: entry.state_in_before,
      state_in_after: entry.state_in_after,
    }));

  // Emotion keys for radar chart labels
  const emotionKeys = [
    'subjectivity', 'polarity', 'fear', 'anger', 'anticipation',
    'trust', 'surprise', 'sadness', 'disgust', 'joy'
  ];

  // Radar chart options with enhanced styling
  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(219, 219, 219, 0.5)', // Darker angle lines for visibility
          lineWidth: 2,
        },
        grid: {
          color: 'rgba(219, 219, 219, 0.5)', // Slightly darker grid lines
          lineWidth: 1.5,
        },
        ticks: {
          display: true,
          backdropColor: 'transparent', // No background for ticks
          color: '#ffffff', // White text for ticks
          font: {
            size: 16,
            weight: 'bold',
          },
          stepSize: 0.2,
        },
        pointLabels: {
          color: '#ffffff', // White labels for emotions
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // White background for labels
        },
        suggestedMin: 0,
        suggestedMax: 1,
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff', // White legend text
          font: {
            size: 14,
            weight: 'bold',
          },
          boxWidth: 20,
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 4,
      },
    },
    elements: {
      line: {
        borderWidth: 3, // Thicker lines for better visibility
        tension: 0.1, // Slight curve for smoothness
      },
      point: {
        radius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // White point background
        borderWidth: 2,
      },
    },
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle white background for chart
  };

  return (
    <>
      <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
      <div className="modal bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 my-8 overflow-y-auto max-h-[90vh]">
        <h3 className="modal-title text-2xl font-bold mb-4 text-gray-800">Información del Nodo: {modalNode.id}</h3>
        <div className="modal-section mb-6">
          <h4 className="modal-section-title text-lg font-semibold mb-2 text-gray-700">Detalles del Nodo</h4>
          <p className="modal-cluster text-gray-600">
            <b>Cluster:</b> {modalNode.cluster ?? 'Sin cluster'}
          </p>
        </div>
        <div className="modal-section mb-6">
          <h4 className="modal-section-title text-lg font-semibold mb-2 text-gray-700">Vectores Emocionales</h4>
          <div className="modal-vectors-container grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="modal-vector">
              <h5 className="text-base font-medium text-gray-700">Vector Emocional In</h5>
              <pre className="modal-pre bg-gray-100 p-3 rounded text-sm text-gray-800">
                {JSON.stringify(modalNode.emotional_vector_in, null, 2)}
              </pre>
            </div>
            <div className="modal-vector">
              <h5 className="text-base font-medium text-gray-700">Vector Emocional Out</h5>
              <pre className="modal-pre bg-gray-100 p-3 rounded text-sm text-gray-800">
                {JSON.stringify(modalNode.emotional_vector_out, null, 2)}
              </pre>
            </div>
          </div>
        </div>
        {nodeHistory.length > 0 && (
          <div className="modal-section mb-6">
            <h4 className="modal-section-title text-lg font-semibold mb-2 text-gray-700">Historial de Propagación</h4>
            {nodeHistory.map((entry, index) => {
              // Prepare data for radar chart
              const chartData = {
                labels: emotionKeys,
                datasets: [
                  {
                    label: 'Estado Antes',
                    data: entry.state_in_before,
                    backgroundColor: 'rgba(255, 99, 132, 0.3)', // Slightly opaque for visibility
                    borderColor: 'rgba(255, 99, 132, 1)', // Bright red line
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
                    fill: true,
                  },
                  {
                    label: 'Estado Después',
                    data: entry.state_in_after,
                    backgroundColor: 'rgba(54, 162, 235, 0.3)', // Slightly opaque for visibility
                    borderColor: 'rgba(54, 162, 235, 1)', // Bright blue line
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
                    fill: true,
                  },
                ],
              };

              return (
                <div key={index} className="modal-history-entry mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
                  <h5 className="modal-history-header text-base font-medium mb-2 text-gray-700">
                    Paso {entry.timeStep} (Interacción con {entry.sender})
                  </h5>
                  <div className="modal-history-chart mb-4 bg-white p-4 rounded-lg shadow">
                    <Radar data={chartData} options={chartOptions} />
                  </div>
                  <h5 className="modal-history-header text-base font-medium text-gray-700">
                    Acción: {entry.action} el mensaje
                  </h5>
                </div>
              );
            })}
          </div>
        )}
        <div className="modal-footer">
          <button
            onClick={() => setIsOpen(false)}
            className="modal-close-button bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

NodeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  modalNode: PropTypes.object,
  propagationLog: PropTypes.arrayOf(PropTypes.object).isRequired,
};