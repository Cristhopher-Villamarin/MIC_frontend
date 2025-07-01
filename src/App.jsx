// src/components/App.jsx
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchPanel from './components/SearchPanel';
import PropagationModal from './components/PropagationModal';
import NodeModal from './components/NodeModal';
import PropagationResult from './components/PropagationResult';
import Graph3D from './components/Graph3D';
import Sidebar from './components/Sidebar';
import { readCsv, readXlsx, buildGraph } from './utils/loadFiles';
import axios from 'axios';
import './App.css';

export default function App() {
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

  // Función para manejar la selección de opciones del menú
  const handleMenuSelect = (key) => {
    console.log(`Opción seleccionada: ${key}`);
    // Aquí puedes implementar la lógica para cada opción del menú
    // Por ejemplo, cambiar el estado para cargar diferentes tipos de redes o modelos
  };

  // Lee archivos CSV
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

  // Lee archivos XLSX
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

  // Construye el grafo
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

  // Maneja el clic en un nodo
  const handleNodeClick = (node) => {
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
  };

  // Maneja la propagación
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

  // Resetear la vista
  const handleResetView = () => {
    setHighlightId('');
    setSearchText('');
    setMessage('');
    setSelectedUser('');
    setPropagationStatus('');
    setPropagationResult(null);
    setHighlightedLinks([]);
    setPropagationLog([]);
    setIsNodeModalOpen(false);
    setIsPropagationModalOpen(false);
    setModalNode(null);
  };

  return (
    <div className="app-container">
      <Sidebar onMenuSelect={handleMenuSelect} />
      <div className="main-content">
<<<<<<< Updated upstream
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
=======
        {viewMode === 'welcome' && (
          <div className="welcome-message">
            <h1>Bienvenido al Simulador de Redes Sociales</h1>
            <p>Selecciona una opción en el menú lateral para comenzar.</p>
          </div>
        )}
        {viewMode === 'barabasi-albert' && (
          <>
            <BarabasiAlbertInput onGenerateNetwork={handleGenerateBaNetwork} />
            <SearchPanel
              searchText={searchText}
              setSearchText={setSearchText}
              highlightId={highlightId}
              setHighlightId={setHighlightId}
              status={baStatus}
              selectedNode={baGraphData.nodes.find(n => n.id === highlightId)}
              handleResetView={handleResetView}
            />
            <div className="graph-container">
              <BarabasiAlbertGraph3D
                data={baGraphData}
                nodesWithCentrality={baNodesWithCentrality}
                onNodeInfo={handleNodeClick}
                highlightId={highlightId}
                onResetView={handleResetView}
              />
            </div>
          </>
        )}
        {viewMode === 'barabasi-si' && (
          <>
            <BarabasiSIRInput
              onGenerateNetwork={handleGenerateBaNetwork}
              nodes={baGraphData.nodes}
              onStartPropagation={handleBaSIRPropagation}
            />
            <SearchPanel
              searchText={searchText}
              setSearchText={setSearchText}
              highlightId={highlightId}
              setHighlightId={setHighlightId}
              status={baStatus}
              selectedNode={baGraphData.nodes.find(n => n.id === highlightId)}
              handleResetView={handleResetView}
            />
            <div className="graph-container">
              <BarabasiSIRGraph3D
                data={baGraphData}
                nodesWithCentrality={baNodesWithCentrality}
                onNodeInfo={handleNodeClick}
                highlightId={highlightId}
                highlightedLinks={baSIRHighlightedLinks}
                onResetView={handleResetView}
                beta={baSIRBeta}
                gamma={baSIRGamma}
                selectedUser={selectedUser}
                message={message}
              />
              {showBaSIRPropagationResult && (
                <BaSIRPropagationResult
                  selectedUser={selectedUser}
                  onClose={handleCloseBaSIRPropagationResult}
                />
              )}
            </div>
          </>
        )}
        {viewMode === 'holme-kim' && (
          <>
            <HolmeKimInput onGenerateNetwork={handleGenerateHkNetwork} />
            <SearchPanel
              searchText={searchText}
              setSearchText={setSearchText}
              highlightId={highlightId}
              setHighlightId={setHighlightId}
              status={hkStatus}
              selectedNode={hkGraphData.nodes.find(n => n.id === highlightId)}
              handleResetView={handleResetView}
            />
            <div className="graph-container">
              <HolmeKimGraph3D
                data={hkGraphData}
                nodesWithCentrality={hkNodesWithCentrality}
                onNodeInfo={handleNodeClick}
                highlightId={highlightId}
                onResetView={handleResetView}
              />
            </div>
          </>
        )}
        {viewMode === 'holme-kim-si' && (
          <>
            <HolmeKimSIRInput
              nodes={hkGraphData.nodes}
              onStartPropagation={handleHkSIRPropagation}
            />
            <SearchPanel
              searchText={searchText}
              setSearchText={setSearchText}
              highlightId={highlightId}
              setHighlightId={setHighlightId}
              status={hkStatus}
              selectedNode={hkGraphData.nodes.find(n => n.id === highlightId)}
              handleResetView={handleResetView}
            />
            <div className="graph-container">
              <HolmeKimSIRGraph3D
                data={hkGraphData}
                nodesWithCentrality={hkNodesWithCentrality}
                onNodeInfo={handleNodeClick}
                highlightId={highlightId}
                highlightedLinks={hkSIRHighlightedLinks}
                onResetView={handleResetView}
                beta={hkSIRBeta}
                gamma={hkSIRGamma}
                selectedUser={selectedUser}
                message={message}
              />
              {showHkSIRPropagationResult && (
                <BaSIRPropagationResult
                  selectedUser={selectedUser}
                  onClose={handleCloseHkSIRPropagationResult}
                />
              )}
            </div>
          </>
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
              viewMode={viewMode}
              setCsvFile={setCsvFile}
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
                nodesWithCentrality={realWorldNodesWithCentrality}
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
              setCsvFile={setCsvFile}
            />
            <div className="propagation-button-container">
              <button
                onClick={() => setIsPropagationModalOpen(true)}
                className="button"
              >
                Iniciar Propagación
              </button>
            </div>
          <RipPropagationModal
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
            <div className="propagation-button-container">
              <button
                onClick={() => setIsPropagationModalOpen(true)}
                className="button"
              >
                Iniciar Propagación
              </button>
            </div>
            <div className="nodes-button-container">
              <button
                onClick={() => setIsNodeStatesModalOpen(true)}
                className={propagationLog.length ? 'button' : 'button-disabled'}
                disabled={!propagationLog.length}
              >
                Ver Estados de Nodos
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
              method={method}
              setMethod={setMethod}
              thresholds={thresholds}
              setThresholds={setThresholds}
              csvFile={csvFile}
              xlsxFile={xlsxFile}
            />
            <NodeModal
              isOpen={isNodeModalOpen}
              setIsOpen={setIsNodeModalOpen}
              modalNode={modalNode}
              propagationLog={propagationLog}
            />
            <NodeStatesModal
              isOpen={isNodeStatesModalOpen}
              setIsOpen={setIsNodeStatesModalOpen}
              involvedNodes={getInvolvedNodes()}
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
>>>>>>> Stashed changes
      </div>
    </div>
  );
}