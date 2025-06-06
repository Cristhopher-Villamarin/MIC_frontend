// src/components/App.jsx
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RealWorldNavbar from './components/RealWorldNavbar';
import SearchPanel from './components/SearchPanel';
import PropagationModal from './components/PropagationModal';
import NodeModal from './components/NodeModal';
import PropagationResult from './components/PropagationResult';
import RipDsnPropagationResult from './components/RipDsnPropagationResult';
import Graph3D from './components/Graph3D';
import RealWorldGraph3D from './components/RealWorldGraph3D';
import RipDsnGraph3D from './components/RipDsnGraph3D';
import Sidebar from './components/Sidebar';
import { readCsv, readXlsx, buildGraph, buildRealWorldGraph } from './utils/loadFiles';
import axios from 'axios';
import './App.css';

export default function App() {
  // Estados para la funcionalidad original (propagación)
  const [csvFile, setCsvFile] = useState(null);
  const [xlsxFile, setXlsxFile] = useState(null);
  const [linksAll, setLinksAll] = useState([]);
  const [attrsAll, setAttrsAll] = useState([]);
  const [networkList, setNetworkList] = useState([]);
  const [selectedNet, setSelectedNet] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [status, setStatus] = useState('Sube el CSV y el XLSX…');
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [highlightId, setHighlightId] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [modalNode, setModalNode] = useState(null);
  const [isPropagationModalOpen, setIsPropagationModalOpen] = useState(false);
  const [propagationStatus, setPropagationStatus] = useState('');
  const [propagationResult, setPropagationResult] = useState(null);
  const [highlightedLinks, setHighlightedLinks] = useState([]);
  const [propagationLog, setPropagationLog] = useState([]);

  // Estados para Redes del Mundo Real y RIP-DSN
  const [nodesCsvFile, setNodesCsvFile] = useState(null);
  const [linksCsvFile, setLinksCsvFile] = useState(null);
  const [realWorldNodesAll, setRealWorldNodesAll] = useState([]);
  const [realWorldLinksAll, setRealWorldLinksAll] = useState([]);
  const [realWorldNetworkList, setRealWorldNetworkList] = useState([]);
  const [realWorldSelectedNet, setRealWorldSelectedNet] = useState('');
  const [realWorldGraphData, setRealWorldGraphData] = useState({ nodes: [], links: [] });
  const [realWorldStatus, setRealWorldStatus] = useState('Sube los archivos CSV…');
  const [ripDsnPropagationStatus, setRipDsnPropagationStatus] = useState('');
  const [ripDsnPropagationResult, setRipDsnPropagationResult] = useState(null);
  const [ripDsnHighlightedLinks, setRipDsnHighlightedLinks] = useState([]);
  const [ripDsnPropagationLog, setRipDsnPropagationLog] = useState([]);

  // Estado para controlar la vista
  const [viewMode, setViewMode] = useState('welcome');

  // Maneja la selección de opciones del menú
  const handleMenuSelect = (key) => {
    console.log(`Opción seleccionada: ${key}`);
    if (key === 'real-world') {
      setViewMode('real-world');
      if (!nodesCsvFile || !linksCsvFile) {
        setRealWorldStatus('Sube los archivos CSV…');
      }
    } else if (key === 'real-world-rip') {
      setViewMode('rip-dsn');
      if (!nodesCsvFile || !linksCsvFile) {
        setRealWorldStatus('Sube los archivos CSV…');
      }
    } else {
      setViewMode('simulation');
      setStatus('Sube el CSV y el XLSX…');
      // Limpiar estados solo para simulación
      setCsvFile(null);
      setXlsxFile(null);
      setLinksAll([]);
      setAttrsAll([]);
      setNetworkList([]);
      setSelectedNet('');
      setGraphData({ nodes: [], links: [] });
      setSearchText('');
      setHighlightId('');
      setMessage('');
      setSelectedUser('');
      setPropagationStatus('');
      setPropagationResult(null);
      setHighlightedLinks([]);
      setPropagationLog([]);
      setIsNodeModalOpen(false);
      setIsPropagationModalOpen(false);
      setModalNode(null);
    }
    // Limpiar estados de propagación al cambiar de vista
    setRipDsnPropagationStatus('');
    setRipDsnPropagationResult(null);
    setRipDsnHighlightedLinks([]);
    setRipDsnPropagationLog([]);
    setIsPropagationModalOpen(false);
  };

  // Lee archivos CSV (original)
  useEffect(() => {
    async function loadCsv() {
      if (!csvFile) return;
      setStatus('Leyendo CSV…');
      const links = await readCsv(csvFile);
      setLinksAll(links);
      const ids = [...new Set(
        links.map(l => String(l.network_id ?? l.networkId))
      )].filter(id => id);
      setNetworkList(ids);
      setSelectedNet(ids[0] ?? '');
      setStatus('CSV listo. Ahora el XLSX…');
    }
    loadCsv();
  }, [csvFile]);

  // Lee archivos XLSX (original)
  useEffect(() => {
    async function loadXlsx() {
      if (!xlsxFile) return;
      setStatus('Leyendo XLSX…');
      const attrs = await readXlsx(xlsxFile);
      setAttrsAll(attrs);
      setStatus('XLSX listo.');
    }
    loadXlsx();
  }, [xlsxFile]);

  // Construye el grafo (original)
  useEffect(() => {
    if (!selectedNet || linksAll.length === 0 || attrsAll.length === 0) {
      return;
    }
    setStatus('Filtrando y construyendo la red…');
    const linksFiltered = linksAll.filter(
      l => String(l.network_id ?? l.networkId) === selectedNet
    );
    const data = buildGraph(linksFiltered, attrsAll);
    console.log('graphData.links generados:', data.links);
    setGraphData(data);
    setStatus(
      `Red ${selectedNet}: ${data.nodes.length} nodos · ${data.links.length} enlaces`
    );
    setSelectedUser('');
    setHighlightId('');
  }, [selectedNet, linksAll, attrsAll]);

  // Lee el CSV de nodos (Real World y RIP-DSN)
  useEffect(() => {
    async function loadNodesCsv() {
      if (!nodesCsvFile) return;
      setRealWorldStatus('Leyendo CSV de nodos…');
      const nodes = await readCsv(nodesCsvFile);
      setRealWorldNodesAll(nodes);
      const ids = [...new Set(nodes.map(n => String(n.network_id)))].filter(id => id);
      setRealWorldNetworkList(ids);
      setRealWorldSelectedNet(ids[0] ?? '');
      setRealWorldStatus('CSV de nodos listo. Ahora sube el CSV de relaciones…');
    }
    loadNodesCsv();
  }, [nodesCsvFile]);

  // Lee el CSV de relaciones (Real World y RIP-DSN)
  useEffect(() => {
    async function loadLinksCsv() {
      if (!linksCsvFile) return;
      setRealWorldStatus('Leyendo CSV de relaciones…');
      const links = await readCsv(linksCsvFile);
      setRealWorldLinksAll(links);
      setRealWorldStatus('CSV de relaciones listo.');
    }
    loadLinksCsv();
  }, [linksCsvFile]);

  // Construye el grafo (Real World y RIP-DSN)
  useEffect(() => {
    if (!realWorldSelectedNet || realWorldNodesAll.length === 0 || realWorldLinksAll.length === 0) {
      return;
    }
    setRealWorldStatus('Filtrando y construyendo la red…');
    const linksFiltered = realWorldLinksAll.filter(l => String(l.network_id) === realWorldSelectedNet);
    const nodesFiltered = realWorldNodesAll.filter(n => String(n.network_id) === realWorldSelectedNet);
    const data = buildRealWorldGraph(linksFiltered, nodesFiltered);
    setRealWorldGraphData(data);
    setRealWorldStatus(
      `Red ${realWorldSelectedNet}: ${data.nodes.length} nodos · ${data.links.length} enlaces`
    );
  }, [realWorldSelectedNet, realWorldNodesAll, realWorldLinksAll]);

  // Maneja el clic en un nodo
  const handleNodeClick = (node) => {
    if (viewMode === 'simulation') {
      const nodeHistory = propagationLog
        .filter(entry => entry.receiver === node.id)
        .sort((a, b) => b.t - a.t);
      const latestState = nodeHistory.length > 0 ? nodeHistory[0].state_in_after : null;
      const emotional_vector_in = latestState
        ? {
            subjectivity: latestState[0] ?? 'N/A',
            polarity: latestState[1] ?? 'N/A',
            fear: latestState[2] ?? 'N/A',
            anger: latestState[3] ?? 'N/A',
            anticipation: latestState[4] ?? 'N/A',
            trust: latestState[5] ?? 'N/A',
            surprise: latestState[6] ?? 'N/A',
            sadness: latestState[7] ?? 'N/A',
            disgust: latestState[8] ?? 'N/A',
            joy: latestState[9] ?? 'N/A',
          }
        : {
            subjectivity: node.in_subjectivity ?? 'N/A',
            polarity: node.in_polarity ?? 'N/A',
            fear: node.in_fear ?? 'N/A',
            anger: node.in_anger ?? 'N/A',
            anticipation: node.in_anticip ?? 'N/A',
            trust: node.in_trust ?? 'N/A',
            surprise: node.in_surprise ?? 'N/A',
            sadness: node.in_sadness ?? 'N/A',
            disgust: node.in_disgust ?? 'N/A',
            joy: node.in_joy ?? 'N/A',
          };
      const emotional_vector_out = {
        subjectivity: node.out_subjectivity ?? 'N/A',
        polarity: node.out_polarity ?? 'N/A',
        fear: node.out_fear ?? 'N/A',
        anger: node.out_anger ?? 'N/A',
        anticipation: node.out_anticip ?? 'N/A',
        trust: node.out_trust ?? 'N/A',
        surprise: node.out_surprise ?? 'N/A',
        sadness: node.out_sadness ?? 'N/A',
        disgust: node.out_disgust ?? 'N/A',
        joy: node.out_joy ?? 'N/A',
      };
      const nodeWithVectors = {
        ...node,
        emotional_vector_in,
        emotional_vector_out,
      };
      setModalNode(nodeWithVectors);
      setIsNodeModalOpen(true);
      setSelectedNode(node);
    } else if (viewMode === 'real-world') {
      setHighlightId(node.id);
      setSearchText(node.id);
    } else if (viewMode === 'rip-dsn') {
      setSelectedUser(node.id);
      setHighlightId(node.id);
    }
  };

  // Maneja la propagación (simulación original)
  const handlePropagation = async () => {
    if (!selectedUser || !message.trim() || !csvFile || !xlsxFile) {
      setPropagationStatus('Por favor selecciona un usuario, escribe un mensaje y sube ambos archivos.');
      return;
    }
    setPropagationStatus('Iniciando propagación…');
    try {
      const formData = new FormData();
      formData.append('seed_user', selectedUser);
      formData.append('message', message);
      formData.append('csv_file', csvFile);
      formData.append('xlsx_file', xlsxFile);
      formData.append('max_steps', 4);
      const response = await axios.post('http://localhost:8000/propagate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPropagationResult(response.data);
      setPropagationStatus('Propagación completada.');
      const propagationLog = response.data.log || [];
      console.log('Propagation log from backend:', propagationLog);
      setPropagationLog(propagationLog);
      const linksToHighlight = propagationLog
        .filter(entry => entry.sender && entry.receiver && entry.t !== undefined)
        .sort((a, b) => a.t - b.t)
        .map((entry, index) => {
          const link = {
            source: String(entry.sender),
            target: String(entry.receiver),
            timeStep: entry.t,
            animationDelay: index * 4000,
            vector: entry.state_in_after,
          };
          console.log(`Generated link [${index}]:`, link);
          return link;
        });
      console.log('Total highlightedLinks:', linksToHighlight);
      setHighlightedLinks(linksToHighlight);
      setHighlightId(selectedUser);
      setIsPropagationModalOpen(false);
    } catch (error) {
      console.error('Propagation error:', error);
      setPropagationStatus(`Error: ${error.response?.data?.detail || error.message}`);
      setPropagationResult(null);
    }
  };

  // Maneja la propagación (RIP-DSN)
  const handleRipDsnPropagation = async () => {
    if (!selectedUser || !message.trim() || !nodesCsvFile || !linksCsvFile) {
      setRipDsnPropagationStatus('Por favor selecciona un usuario, escribe un mensaje y sube ambos archivos CSV.');
      return;
    }
    setRipDsnPropagationStatus('Iniciando propagación…');
    try {
      const formData = new FormData();
      formData.append('seed_user', selectedUser);
      formData.append('message', message);
      formData.append('nodes_csv_file', nodesCsvFile);
      formData.append('links_csv_file', linksCsvFile);
      formData.append('max_steps', 4);
      const response = await axios.post('http://localhost:8000/propagate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRipDsnPropagationResult(response.data);
      setRipDsnPropagationStatus('Propagación completada.');
      const propagationLog = response.data.log || [];
      console.log('RIP-DSN Propagation log from backend:', propagationLog);
      setRipDsnPropagationLog(propagationLog);
      const linksToHighlight = propagationLog
        .filter(entry => entry.sender && entry.receiver && entry.t !== undefined)
        .sort((a, b) => a.t - b.t)
        .map((entry, index) => ({
          source: String(entry.sender),
          target: String(entry.receiver),
          timeStep: entry.t,
          animationDelay: index * 4000,
        }));
      console.log('Total RIP-DSN highlightedLinks:', linksToHighlight);
      setRipDsnHighlightedLinks(linksToHighlight);
      setHighlightId(selectedUser);
      setIsPropagationModalOpen(false);
    } catch (error) {
      console.error('RIP-DSN Propagation error:', error);
      const errorMessage = error.response?.data?.detail
        ? error.response.data.detail
        : error.message || 'Error desconocido';
      setRipDsnPropagationStatus(`Error: ${errorMessage}`);
      setRipDsnPropagationResult(null);
    }
  };

  // Resetear la vista
  const handleResetView = () => {
    setHighlightId('');
    setSearchText('');
    if (viewMode === 'simulation') {
      setMessage('');
      setSelectedUser('');
      setPropagationStatus('');
      setPropagationResult(null);
      setHighlightedLinks([]);
      setPropagationLog([]);
      setIsNodeModalOpen(false);
      setIsPropagationModalOpen(false);
      setModalNode(null);
    } else if (viewMode === 'rip-dsn') {
      setMessage('');
      setSelectedUser('');
      setRipDsnPropagationStatus('');
      setRipDsnPropagationResult(null);
      setRipDsnHighlightedLinks([]);
      setRipDsnPropagationLog([]);
      setIsPropagationModalOpen(false);
    }
  };

  return (
    <div className="app-container">
     <Sidebar onMenuSelect={handleMenuSelect} />
    <div className="main-content">
      {viewMode === 'welcome' && (
        <div className="welcome-message">
          <h1>Bienvenido al Simulador de Redes Sociales</h1>
          <p>Selecciona una opción en el menú lateral para comenzar.</p>
        </div>
      )}
      {viewMode === 'real-world' && (
        <>
          <RealWorldNavbar
            nodesCsvFile={nodesCsvFile}
            setNodesCsvFile={setNodesCsvFile}
            linksCsvFile={linksCsvFile}
            setLinksCsvFile={setLinksCsvFile}
            networkList={realWorldNetworkList}
            selectedNet={realWorldSelectedNet}
            setSelectedNet={setRealWorldSelectedNet}
            viewMode={viewMode} // Pasar viewMode
          />
          <SearchPanel
            searchText={searchText}
            setSearchText={setSearchText}
            highlightId={highlightId}
            setHighlightId={setHighlightId}
            status={realWorldStatus}
            selectedNode={realWorldGraphData.nodes.find(n => n.id === highlightId)}
            handleResetView={handleResetView}
          />
          <div className="graph-container">
            <RealWorldGraph3D
              data={realWorldGraphData}
              onNodeInfo={handleNodeClick}
              highlightId={highlightId}
              onResetView={handleResetView}
            />
          </div>
        </>
      )}
{viewMode === 'rip-dsn' && (
  <>
    <RealWorldNavbar
      nodesCsvFile={nodesCsvFile}
      setNodesCsvFile={setNodesCsvFile}
      linksCsvFile={linksCsvFile}
      setLinksCsvFile={setLinksCsvFile}
      networkList={realWorldNetworkList}
      selectedNet={realWorldSelectedNet}
      setSelectedNet={setRealWorldSelectedNet}
      viewMode={viewMode}
    />
    <div className="propagation-button-container">
      <button
        onClick={() => setIsPropagationModalOpen(true)}
        className="button"
      >
        Iniciar Propagación
      </button>
    </div>
    <PropagationModal
      isOpen={isPropagationModalOpen}
      setIsOpen={setIsPropagationModalOpen}
      selectedUser={selectedUser}
      setSelectedUser={setSelectedUser}
      message={message}
      setMessage={setMessage}
      nodes={realWorldGraphData.nodes}
      handlePropagation={handleRipDsnPropagation}
      propagationStatus={ripDsnPropagationStatus}
    />
    {ripDsnPropagationResult && (
      <RipDsnPropagationResult
        propagationLog={ripDsnPropagationLog}
        selectedUser={selectedUser}
        onClose={() => {
          setRipDsnPropagationResult(null);
          setRipDsnPropagationLog([]);
          setRipDsnHighlightedLinks([]);
        }}
      />
    )}
    <div className="graph-container">
      <RipDsnGraph3D
        data={realWorldGraphData}
        onNodeInfo={handleNodeClick}
        highlightId={highlightId}
        highlightedLinks={ripDsnHighlightedLinks}
        onResetView={handleResetView}
      />
    </div>
  </>
)}
      {viewMode === 'simulation' && (
        <>
          <Navbar
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            xlsxFile={xlsxFile}
            setXlsxFile={setXlsxFile}
            networkList={networkList}
            selectedNet={selectedNet}
            setSelectedNet={setSelectedNet}
          />
          <SearchPanel
            searchText={searchText}
            setSearchText={setSearchText}
            highlightId={highlightId}
            setHighlightId={setHighlightId}
            status={status}
            selectedNode={selectedNode}
            handleResetView={handleResetView}
          />
          <div className="propagation-button-container">
            <button
              onClick={() => setIsPropagationModalOpen(true)}
              className="button"
            >
              Iniciar Propagación
            </button>
          </div>
          <div className="legend-container">
            <h4 className="legend-title">Leyenda de Colores</h4>
            <ul className="legend-list">
              <li style={{ color: '#FFFF00' }}>Amarillo: Alegría</li>
              <li style={{ color: '#FF0000' }}>Rojo: Ira</li>
              <li style={{ color: '#4682B4' }}>Azul: Tristeza</li>
              <li style={{ color: '#00FF00' }}>Verde claro: Disgusto</li>
              <li style={{ color: '#A100A1' }}>Morado: Miedo</li>
              <li style={{ color: '#FF6200' }}>Naranja: Anticipación</li>
              <li style={{ color: '#00CED1' }}>Turquesa: Confianza</li>
              <li style={{ color: '#FF69B4' }}>Rosa: Sorpresa</li>
            </ul>
          </div>
          <PropagationModal
            isOpen={isPropagationModalOpen}
            setIsOpen={setIsPropagationModalOpen}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            message={message}
            setMessage={setMessage}
            nodes={graphData.nodes}
            handlePropagation={handlePropagation}
            propagationStatus={propagationStatus}
          />
          <NodeModal
            isOpen={isNodeModalOpen}
            setIsOpen={setIsNodeModalOpen}
            modalNode={modalNode}
            propagationLog={propagationLog}
          />
          <PropagationResult
            propagationLog={propagationLog}
            selectedUser={selectedUser}
            onClose={() => {
              setPropagationResult(null);
              setPropagationLog([]);
              setHighlightedLinks([]);
            }}
          />
          <div className="graph-container">
            <Graph3D
              data={graphData}
              onNodeInfo={handleNodeClick}
              highlightId={highlightId}
              highlightedLinks={highlightedLinks}
              onResetView={handleResetView}
            />
          </div>
        </>
      )}
    </div>
    </div>
  );
}