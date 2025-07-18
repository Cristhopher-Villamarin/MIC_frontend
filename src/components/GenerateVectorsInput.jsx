import { useState } from 'react';
import axios from 'axios';
import './HolmeKimInput.css';

export default function GenerateVectorsInput({ nodes, onGenerateVectors }) {
  const [status, setStatus] = useState('Listo para generar vectores…');

  const handleGenerateVectors = async () => {
    if (!nodes || nodes.length === 0) {
      setStatus('No hay nodos en la red. Genera una red primero.');
      return;
    }

    setStatus('Generando vectores aleatorios…');
    try {
      const response = await axios.post('http://localhost:8000/generate-vectors', { num_vectors: nodes.length }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const vectors = response.data.vectors;
      if (!vectors || vectors.length !== nodes.length) {
        throw new Error('El número de vectores generados no coincide con el número de nodos.');
      }

      // Asignar vectores aleatoriamente a los nodos
      const shuffledVectors = vectors.sort(() => Math.random() - 0.5);
      const updatedNodes = nodes.map((node, index) => ({
        ...node,
        in_subjectivity: shuffledVectors[index].in_subjectivity,
        in_polarity: shuffledVectors[index].in_polarity,
        in_fear: shuffledVectors[index].in_fear,
        in_anger: shuffledVectors[index].in_anger,
        in_anticip: shuffledVectors[index].in_anticip,
        in_trust: shuffledVectors[index].in_trust,
        in_surprise: shuffledVectors[index].in_surprise,
        in_sadness: shuffledVectors[index].in_sadness,
        in_disgust: shuffledVectors[index].in_disgust,
        in_joy: shuffledVectors[index].in_joy,
        out_subjectivity: shuffledVectors[index].out_subjectivity,
        out_polarity: shuffledVectors[index].out_polarity,
        out_fear: shuffledVectors[index].out_fear,
        out_anger: shuffledVectors[index].out_anger,
        out_anticip: shuffledVectors[index].out_anticip,
        out_trust: shuffledVectors[index].out_trust,
        out_surprise: shuffledVectors[index].out_surprise,
        out_sadness: shuffledVectors[index].out_sadness,
        out_disgust: shuffledVectors[index].out_disgust,
        out_joy: shuffledVectors[index].out_joy,
        cluster: shuffledVectors[index].cluster,
      }));

      onGenerateVectors(updatedNodes);
      setStatus(`Vectores generados y asignados a ${nodes.length} nodos.`);
    } catch (error) {
      console.error('Error generando vectores:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="navbar">
      <h2 className="navbar-title">Generar Vectores Emocionales</h2>
      <div className="navbar-controls">
        <button className="button" onClick={handleGenerateVectors}>
          Generar Vectores Aleatoriamente
        </button>
        <span className="navbar-status">{status}</span>
      </div>
    </div>
  );
}