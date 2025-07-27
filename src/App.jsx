import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RealWorldNavbar from './components/RealWorldNavbar';
import SearchPanel from './components/SearchPanel';
import PropagationModal from './components/PropagationModal';
import NodeModal from './components/NodeModal';
import NodeStatesModal from './components/NodeStatesModal';
import PropagationResult from './components/PropagationResult';
import RipDsnPropagationResult from './components/RipDsnPropagationResult';
import Graph3D from './components/Graph3D';
import RealWorldGraph3D from './components/RealWorldGraph3D';
import RipDsnGraph3D from './components/RipDsnGraph3D';
import BarabasiAlbertInput from './components/BarabasiAlbertInput';
import BarabasiAlbertGraph3D from './components/BarabasiAlbertGraph3D';
import BarabasiSIRInput from './components/BarabasiSIRInput';
import BarabasiSIRGraph3D from './components/BarabasiSIRGraph3D';
import HolmeKimInput from './components/HolmeKimInput';
import HolmeKimGraph3D from './components/HolmeKimGraph3D';
import HolmeKimSIRInput from './components/HolmeKimSIRInput';
import HolmeKimSIRGraph3D from './components/HolmeKimSIRGraph3D';
import Sidebar from './components/Sidebar';
import BaSIRPropagationResult from './components/BaSIRPropagationResult';
import { readCsv, readXlsx, buildGraph, buildRealWorldGraph } from './utils/loadFiles';
import { generateBarabasiAlbert } from './utils/BarabasiAlbert';
import { generateHolmeKim } from './utils/HolmeKim';
import BarabasiBehaviorGraph3D from './components/BarabasiBehaviorGraph3D';
import HolmeKimBehaviorGraph3D from './components/HolmeKimBehaviorGraph3D';
import axios from 'axios';
import './App.css';
import { calculateCentralityMetrics } from './utils/centrality';
import RipPropagationModal from './components/RipPropagationModal';
import VectorsInput from './components/VectorsInput';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function App() {
  // State declarations (unchanged from original)
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
  const [viewMode, setViewMode] = useState('welcome');
  const [isNodeStatesModalOpen, setIsNodeStatesModalOpen] = useState(false);
  const [nodesWithCentrality, setNodesWithCentrality] = useState([]);
  const [realWorldNodesWithCentrality, setRealWorldNodesWithCentrality] = useState([]);
  const [baGraphData, setBaGraphData] = useState({ nodes: [], links: [] });
  const [baStatus, setBaStatus] = useState('Ingrese el número de nodos y enlaces…');
  const [baNodesWithCentrality, setBaNodesWithCentrality] = useState([]);
  const [baSIRBeta, setBaSIRBeta] = useState(0.3);
  const [baSIRGamma, setBaSIRGamma] = useState(0.1);
  const [baSIRHighlightedLinks, setBaSIRHighlightedLinks] = useState([]);
  const [baSIRPropagationLog, setBaSIRPropagationLog] = useState([]);
  const [baSIRPropagationStatus, setBaSIRPropagationStatus] = useState('');
  const [showBaSIRPropagationResult, setShowBaSIRPropagationResult] = useState(false);
  const [hkGraphData, setHkGraphData] = useState({ nodes: [], links: [] });
  const [hkStatus, setHkStatus] = useState('Ingrese el número de nodos, enlaces y probabilidad de triadas…');
  const [hkNodesWithCentrality, setHkNodesWithCentrality] = useState([]);
  const [hkSIRBeta, setHkSIRBeta] = useState(0.3);
  const [hkSIRGamma, setHkSIRGamma] = useState(0.1);
  const [hkSIRHighlightedLinks, setHkSIRHighlightedLinks] = useState([]);
  const [hkSIRPropagationLog, setHkSIRPropagationLog] = useState([]);
  const [hkSIRPropagationStatus, setHkSIRPropagationStatus] = useState('');
  const [showHkSIRPropagationResult, setShowHkSIRPropagationResult] = useState(false);
  const [method, setMethod] = useState('ema');
  const [thresholds, setThresholds] = useState({
    "High-Credibility Informant": { forward: 0.8, modify: 0.2, ignore: 0.05, alpha: 0.3 },
    "Emotionally-Driven Amplifier": { forward: 0.95, modify: 0.6, ignore: 0.1, alpha: 0.8 },
    "Mobilisation-Oriented Catalyst": { forward: 0.6, modify: 0.7, ignore: 0.3, alpha: 0.7 },
    "Emotionally Exposed Participant": { forward: 0.3, modify: 0.4, ignore: 0.7, alpha: 0.6 },
  });
  const [emotionVector, setEmotionVector] = useState(null);
  const [nodeVectors, setNodeVectors] = useState([]);

  const emotionKeys = [
    'subjectivity', 'polarity', 'fear', 'anger', 'anticipation',
    'trust', 'surprise', 'sadness', 'disgust', 'joy'
  ];

  const handleMenuSelect = (key) => {
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
    } else if (key === 'behavior-profiles') {
      setViewMode('simulation');
      setCsvFile(linksCsvFile);
      if (!linksCsvFile) {
        setStatus('Sube el archivo CSV de relaciones en "Redes del Mundo Real" primero…');
      } else if (linksAll.length > 0) {
        setStatus(`Red ${selectedNet}: ${graphData.nodes.length} nodos · ${graphData.links.length} enlaces`);
      } else {
        setStatus('CSV listo. Construyendo red básica…');
      }
    } else if (key === 'barabasi-albert') {
      setViewMode('barabasi-albert');
      if (baGraphData.nodes.length > 0 && baNodesWithCentrality.length > 0) {
        setBaStatus(`Red Barabási-Albert: ${baGraphData.nodes.length} nodos · ${baGraphData.links.length} enlaces`);
      } else {
        setBaStatus('Ingrese el número de nodos y enlaces…');
        setBaNodesWithCentrality([]);
      }
    } else if (key === 'barabasi-si') {
      setViewMode('barabasi-si');
      if (baGraphData.nodes.length > 0) {
        setBaStatus(`Red Barabási-Albert (SIR): ${baGraphData.nodes.length} nodos · ${baGraphData.links.length} enlaces`);
      } else {
        setBaStatus('Genere una red Barabási-Albert primero…');
      }
    } else if (key === 'holme-kim') {
      setViewMode('holme-kim');
      if (hkGraphData.nodes.length > 0 && hkNodesWithCentrality.length > 0) {
        setHkStatus(`Red Holme-Kim: ${hkGraphData.nodes.length} nodos · ${hkGraphData.links.length} enlaces`);
      } else {
        setHkStatus('Ingrese el número de nodos, enlaces y probabilidad de triadas…');
        setHkNodesWithCentrality([]);
      }
    } else if (key === 'holme-kim-si') {
      setViewMode('holme-kim-si');
      if (hkGraphData.nodes.length > 0) {
        setHkStatus(`Red Holme-Kim (SIR): ${hkGraphData.nodes.length} nodos · ${hkGraphData.links.length} enlaces`);
      } else {
        setHkStatus('Genere una red Holme-Kim primero…');
      }
    } else if (key === 'barabasi-behavior') {
      setViewMode('barabasi-behavior');
      if (baGraphData.nodes.length > 0 && baNodesWithCentrality.length > 0) {
        setBaStatus(`Red Barabási-Albert (Comportamiento): ${baGraphData.nodes.length} nodos · ${baGraphData.links.length} enlaces`);
      } else {
        setBaStatus('Genere una red Barabási-Albert primero…');
        setBaNodesWithCentrality([]);
      }
    } else if (key === 'holme-kim-behavior') {
      setViewMode('holme-kim-behavior');
      if (hkGraphData.nodes.length > 0 && hkNodesWithCentrality.length > 0) {
        setHkStatus(`Red Holme-Kim (Comportamiento): ${hkGraphData.nodes.length} nodos · ${hkGraphData.links.length} enlaces`);
      } else {
        setHkStatus('Genere una red Holme-Kim primero…');
        setHkNodesWithCentrality([]);
      }
    } else {
      setViewMode('simulation');
      setStatus('Sube el CSV y el XLSX…');
      setCsvFile(null);
      setXlsxFile(null);
      setLinksAll([]);
      setAttrsAll([]);
      setNetworkList([]);
      setSelectedNet('');
      setGraphData({ nodes: [], links: [] });
    }
    setSearchText('');
    setHighlightId('');
    setMessage('');
    setSelectedUser('');
    setPropagationStatus('');
    setPropagationResult(null);
    setHighlightedLinks([]);
    setPropagationLog([]);
    setRipDsnPropagationStatus('');
    setRipDsnPropagationResult(null);
    setRipDsnHighlightedLinks([]);
    setRipDsnPropagationLog([]);
    setBaSIRPropagationStatus('');
    setBaSIRHighlightedLinks([]);
    setBaSIRPropagationLog([]);
    setHkSIRPropagationStatus('');
    setHkSIRHighlightedLinks([]);
    setHkSIRPropagationLog([]);
    setIsNodeModalOpen(false);
    setIsPropagationModalOpen(false);
    setIsNodeStatesModalOpen(false);
    setModalNode(null);
    setMethod('ema');
    setThresholds({
      "High-Credibility Informant": { forward: 0.8, modify: 0.2, ignore: 0.05, alpha: 0.3 },
      "Emotionally-Driven Amplifier": { forward: 0.95, modify: 0.6, ignore: 0.1, alpha: 0.8 },
      "Mobilisation-Oriented Catalyst": { forward: 0.6, modify: 0.7, ignore: 0.3, alpha: 0.7 },
      "Emotionally Exposed Participant": { forward: 0.3, modify: 0.4, ignore: 0.7, alpha: 0.6 },
    });
    setEmotionVector(null);
    setNodeVectors([]);
  };

  // useEffect hooks (unchanged from original)
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
      setStatus('CSV listo. Construyendo red básica…');
    }
    loadCsv();
  }, [csvFile]);

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

  useEffect(() => {
    if (!selectedNet || linksAll.length === 0) {
      setGraphData({ nodes: [], links: [] });
      setNodesWithCentrality([]);
      return;
    }
    setStatus('Filtrando y construyendo la red…');
    const linksFiltered = linksAll.filter(
      l => String(l.network_id ?? l.networkId) === selectedNet
    );
    const data = buildGraph(linksFiltered, attrsAll.length > 0 ? attrsAll : []);
    setGraphData(data);
    const nodesWithMetrics = calculateCentralityMetrics(data.nodes, data.links);
    setNodesWithCentrality(nodesWithMetrics);
    setStatus(
      `Red ${selectedNet}: ${data.nodes.length} nodos · ${data.links.length} enlaces`
    );
    setSelectedUser('');
    setHighlightId('');
  }, [selectedNet, linksAll, attrsAll]);

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

  useEffect(() => {
    async function loadLinksCsv() {
      if (!linksCsvFile) return;
      setRealWorldStatus('Leyendo CSV de relaciones…');
      const links = await readCsv(linksCsvFile);
      setRealWorldLinksAll(links);
      setRealWorldStatus('CSV de relaciones listo.');
      setCsvFile(linksCsvFile);
    }
    loadLinksCsv();
  }, [linksCsvFile]);

  useEffect(() => {
    if (!realWorldSelectedNet || realWorldNodesAll.length === 0 || realWorldLinksAll.length === 0) {
      setRealWorldGraphData({ nodes: [], links: [] });
      setRealWorldNodesWithCentrality([]);
      return;
    }
    setRealWorldStatus('Filtrando y construyendo la red…');
    const linksFiltered = realWorldLinksAll.filter(l => String(l.network_id) === realWorldSelectedNet);
    const nodesFiltered = realWorldNodesAll.filter(n => String(n.network_id) === realWorldSelectedNet);
    const data = buildRealWorldGraph(linksFiltered, nodesFiltered);
    setRealWorldGraphData(data);
    const nodesWithMetrics = calculateCentralityMetrics(data.nodes, data.links);
    setRealWorldNodesWithCentrality(nodesWithMetrics);
    setRealWorldStatus(
      `Red ${realWorldSelectedNet}: ${data.nodes.length} nodos · ${data.links.length} enlaces`
    );
  }, [realWorldSelectedNet, realWorldNodesAll, realWorldLinksAll]);

  const handleGenerateVectors = async (numNodes) => {
    if (numNodes === 0) {
      setBaStatus('No hay nodos en la red para generar vectores.');
      setHkStatus('No hay nodos en la red para generar vectores.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:8000/generate-vectors', { num_vectors: numNodes }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const vectors = response.data.vectors || [];
      console.log('Vectores generados:', vectors);

      const shuffledVectors = [...vectors].sort(() => Math.random() - 0.5);
      const updatedBaNodes = baGraphData.nodes.map((node, index) => ({
        ...node,
        emotional_vector_in: {
          subjectivity: shuffledVectors[index % shuffledVectors.length].in_subjectivity || 0,
          polarity: shuffledVectors[index % shuffledVectors.length].in_polarity || 0,
          fear: shuffledVectors[index % shuffledVectors.length].in_fear || 0,
          anger: shuffledVectors[index % shuffledVectors.length].in_anger || 0,
          anticipation: shuffledVectors[index % shuffledVectors.length].in_anticip || 0,
          trust: shuffledVectors[index % shuffledVectors.length].in_trust || 0,
          surprise: shuffledVectors[index % shuffledVectors.length].in_surprise || 0,
          sadness: shuffledVectors[index % shuffledVectors.length].in_sadness || 0,
          disgust: shuffledVectors[index % shuffledVectors.length].in_disgust || 0,
          joy: shuffledVectors[index % shuffledVectors.length].in_joy || 0,
        },
        emotional_vector_out: {
          subjectivity: shuffledVectors[index % shuffledVectors.length].out_subjectivity || 0,
          polarity: shuffledVectors[index % shuffledVectors.length].out_polarity || 0,
          fear: shuffledVectors[index % shuffledVectors.length].out_fear || 0,
          anger: shuffledVectors[index % shuffledVectors.length].out_anger || 0,
          anticipation: shuffledVectors[index % shuffledVectors.length].out_anticip || 0,
          trust: shuffledVectors[index % shuffledVectors.length].out_trust || 0,
          surprise: shuffledVectors[index % shuffledVectors.length].out_surprise || 0,
          sadness: shuffledVectors[index % shuffledVectors.length].out_sadness || 0,
          disgust: shuffledVectors[index % shuffledVectors.length].out_disgust || 0,
          joy: shuffledVectors[index % shuffledVectors.length].out_joy || 0,
        },
        cluster: shuffledVectors[index % shuffledVectors.length].cluster || 0,
      }));
      const updatedHkNodes = hkGraphData.nodes.map((node, index) => ({
        ...node,
        emotional_vector_in: {
          subjectivity: shuffledVectors[index % shuffledVectors.length].in_subjectivity || 0,
          polarity: shuffledVectors[index % shuffledVectors.length].in_polarity || 0,
          fear: shuffledVectors[index % shuffledVectors.length].in_fear || 0,
          anger: shuffledVectors[index % shuffledVectors.length].in_anger || 0,
          anticipation: shuffledVectors[index % shuffledVectors.length].in_anticip || 0,
          trust: shuffledVectors[index % shuffledVectors.length].in_trust || 0,
          surprise: shuffledVectors[index % shuffledVectors.length].in_surprise || 0,
          sadness: shuffledVectors[index % shuffledVectors.length].in_sadness || 0,
          disgust: shuffledVectors[index % shuffledVectors.length].in_disgust || 0,
          joy: shuffledVectors[index % shuffledVectors.length].in_joy || 0,
        },
        emotional_vector_out: {
          subjectivity: shuffledVectors[index % shuffledVectors.length].out_subjectivity || 0,
          polarity: shuffledVectors[index % shuffledVectors.length].out_polarity || 0,
          fear: shuffledVectors[index % shuffledVectors.length].out_fear || 0,
          anger: shuffledVectors[index % shuffledVectors.length].out_anger || 0,
          anticipation: shuffledVectors[index % shuffledVectors.length].out_anticip || 0,
          trust: shuffledVectors[index % shuffledVectors.length].out_trust || 0,
          surprise: shuffledVectors[index % shuffledVectors.length].out_surprise || 0,
          sadness: shuffledVectors[index % shuffledVectors.length].out_sadness || 0,
          disgust: shuffledVectors[index % shuffledVectors.length].out_disgust || 0,
          joy: shuffledVectors[index % shuffledVectors.length].out_joy || 0,
        },
        cluster: shuffledVectors[index % shuffledVectors.length].cluster || 0,
      }));

      setBaGraphData({ ...baGraphData, nodes: updatedBaNodes });
      setHkGraphData({ ...hkGraphData, nodes: updatedHkNodes });
      setNodeVectors(vectors);

      const baNodesWithMetrics = calculateCentralityMetrics(updatedBaNodes, baGraphData.links);
      const hkNodesWithMetrics = calculateCentralityMetrics(updatedHkNodes, hkGraphData.links);
      setBaNodesWithCentrality(baNodesWithMetrics);
      setHkNodesWithCentrality(hkNodesWithMetrics);

      setBaStatus(`Red Barabási-Albert: ${updatedBaNodes.length} nodos · ${baGraphData.links.length} enlaces con vectores generados`);
      setHkStatus(`Red Holme-Kim: ${updatedHkNodes.length} nodos · ${hkGraphData.links.length} enlaces con vectores generados`);
    } catch (error) {
      console.error('Error generating vectors:', error);
      setBaStatus(`Error: ${error.response?.data?.detail || error.message}`);
      setHkStatus(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };

const handleGenerateBaNetwork = (numNodes, numEdges) => {
  setBaStatus('Generando red Barabási-Albert…');
  const data = generateBarabasiAlbert(numNodes, numEdges);
  console.log('Nodos generados:', data.nodes); // ← Añade este log
  setBaGraphData(data);
  const nodesWithMetrics = calculateCentralityMetrics(data.nodes, data.links);
  setBaNodesWithCentrality(nodesWithMetrics);
  setBaStatus(`Red Barabási-Albert: ${data.nodes.length} nodos · ${data.links.length} enlaces`);
};

const handleGenerateHkNetwork = (numNodes, numEdges, triadProb) => {
  setHkStatus('Generando red Holme-Kim…');
  const data = generateHolmeKim(numNodes, numEdges, triadProb);
  console.log('Generated Holme-Kim graph:', data); // Añade este log
  setHkGraphData(data);
  const nodesWithMetrics = calculateCentralityMetrics(data.nodes, data.links);
  setHkNodesWithCentrality(nodesWithMetrics);
  setHkStatus(`Red Holme-Kim: ${data.nodes.length} nodos · ${data.links.length} enlaces`);
};

  const handleBaSIRPropagation = ({ beta, gamma, selectedUser, message }) => {
    if (!baGraphData.nodes.length) {
      setBaSIRPropagationStatus('Por favor, genere una red Barabási-Albert primero.');
      return;
    }
    if (!selectedUser || !message.trim()) {
      setBaSIRPropagationStatus('Por favor, seleccione un nodo inicial y escriba un mensaje.');
      return;
    }
    setBaSIRPropagationStatus('Iniciando propagación SIR inversa…');
    setBaSIRBeta(beta);
    setBaSIRGamma(gamma);
    setSelectedUser(selectedUser);
    setMessage(message);
    setShowBaSIRPropagationResult(true);

    const nodes = [...baGraphData.nodes];
    const links = [...baGraphData.links];
    const nodeStates = {};
    nodes.forEach(node => {
      nodeStates[node.id] = node.id === selectedUser ? 'infected' : 'susceptible';
    });

    const propagationLog = [];
    const highlightedLinks = [];
    let currentInfected = [selectedUser];
    let timeStep = 0;
    const maxSteps = 10;

    while (currentInfected.length > 0 && timeStep < maxSteps) {
      const newInfected = [];

      currentInfected.forEach(infectedId => {
        const incomingLinks = links.filter(link => {
          const targetId = link.target.id ? String(link.target.id) : String(link.target);
          return targetId === infectedId && nodeStates[link.source.id || link.source] === 'susceptible';
        });

        incomingLinks.forEach(link => {
          const sourceId = link.source.id ? String(link.source.id) : String(link.source);
          if (Math.random() < beta) {
            nodeStates[sourceId] = 'infected';
            newInfected.push(sourceId);
            propagationLog.push({
              sender: infectedId,
              receiver: sourceId,
              t: timeStep,
              state: 'infected',
            });
            highlightedLinks.push({
              source: sourceId,
              target: infectedId,
              timeStep,
              animationDelay: highlightedLinks.length * 4000,
            });
          }
        });
      });

      currentInfected = newInfected;
      timeStep++;
    }

    setBaSIRPropagationLog(propagationLog);
    setBaSIRHighlightedLinks(highlightedLinks);
    setHighlightId(selectedUser);
    setBaSIRPropagationStatus('Propagación SIR inversa completada.');
  };

  const handleHkSIRPropagation = ({ beta, gamma, selectedUser, message }) => {
    if (!hkGraphData.nodes.length) {
      setHkSIRPropagationStatus('Por favor, genere una red Holme-Kim primero.');
      return;
    }
    if (!selectedUser || !message.trim()) {
      setHkSIRPropagationStatus('Por favor, seleccione un nodo inicial y escriba un mensaje.');
      return;
    }
    setHkSIRPropagationStatus('Iniciando propagación SIR inversa…');
    setHkSIRBeta(beta);
    setHkSIRGamma(gamma);
    setSelectedUser(selectedUser);
    setMessage(message);
    setShowHkSIRPropagationResult(true);

    const nodes = [...hkGraphData.nodes];
    const links = [...hkGraphData.links];
    const nodeStates = {};
    nodes.forEach(node => {
      nodeStates[node.id] = node.id === selectedUser ? 'infected' : 'susceptible';
    });

    const propagationLog = [];
    const highlightedLinks = [];
    let currentInfected = [selectedUser];
    let timeStep = 0;
    const maxSteps = 10;

    while (currentInfected.length > 0 && timeStep < maxSteps) {
      const newInfected = [];

      currentInfected.forEach(infectedId => {
        const incomingLinks = links.filter(link => {
          const targetId = link.target.id ? String(link.target.id) : String(link.target);
          return targetId === infectedId && nodeStates[link.source.id || link.source] === 'susceptible';
        });

        incomingLinks.forEach(link => {
          const sourceId = link.source.id ? String(link.source.id) : String(link.source);
          if (Math.random() < beta) {
            nodeStates[sourceId] = 'infected';
            newInfected.push(sourceId);
            propagationLog.push({
              sender: infectedId,
              receiver: sourceId,
              t: timeStep,
              state: 'infected',
            });
            highlightedLinks.push({
              source: sourceId,
              target: infectedId,
              timeStep,
              animationDelay: highlightedLinks.length * 4000,
            });
          }
        });
      });

      currentInfected = newInfected;
      timeStep++;
    }

    setHkSIRPropagationLog(propagationLog);
    setHkSIRHighlightedLinks(highlightedLinks);
    setHighlightId(selectedUser);
    setHkSIRPropagationStatus('Propagación SIR inversa completada.');
  };

  const handleCloseBaSIRPropagationResult = () => {
    setShowBaSIRPropagationResult(false);
    setBaSIRPropagationStatus('');
    setBaSIRHighlightedLinks([]);
    setBaSIRPropagationLog([]);
    setHighlightId('');
    setSelectedUser('');
    setMessage('');
  };

  const handleCloseHkSIRPropagationResult = () => {
    setShowHkSIRPropagationResult(false);
    setHkSIRPropagationStatus('');
    setHkSIRHighlightedLinks([]);
    setHkSIRPropagationLog([]);
    setHighlightId('');
    setSelectedUser('');
    setMessage('');
  };

  const handleNodeClick = (node) => {
    console.log('Nodo seleccionado:', node.id); // ← Añade este log
    if (viewMode === 'simulation') {
      const nodeWithCentrality = nodesWithCentrality.find(n => n.id === node.id) || node;
      const nodeHistory = propagationLog
        .filter(entry => entry.receiver === node.id);
      const sortedHistory = nodeHistory.sort((a, b) => b.t - a.t);
      const latestState = sortedHistory.length > 0 ? sortedHistory[0].state_in_after : null;
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
        ...nodeWithCentrality,
        emotional_vector_in,
        emotional_vector_out,
      };
      setModalNode(nodeWithVectors);
      setIsNodeModalOpen(true);
      setSelectedNode(node);
    } else if (viewMode === 'real-world') {
      const nodeWithCentrality = realWorldNodesWithCentrality.find(n => n.id === node.id) || node;
      setModalNode(nodeWithCentrality);
      setSelectedNode(nodeWithCentrality);
    } else if (viewMode === 'barabasi-albert' || viewMode === 'barabasi-si') {
      const nodeWithCentrality = baNodesWithCentrality.find(n => n.id === node.id) || node;
      setModalNode(nodeWithCentrality);
      setSelectedNode(nodeWithCentrality);
    } else if (viewMode === 'holme-kim' || viewMode === 'holme-kim-si') {
      const nodeWithCentrality = hkNodesWithCentrality.find(n => n.id === node.id) || node;
      setModalNode(nodeWithCentrality);
      setSelectedNode(nodeWithCentrality);
    } else if (viewMode === 'rip-dsn') {
      setSelectedUser(node.id);
    }
  };

const handleVectorPropagation = async ({ selectedUser, message, method, thresholds, emotionVector }) => {
  console.log('Nodos disponibles:', baGraphData.nodes.map(n => n.id)); // ← Añade este log
  if (!selectedUser || !message.trim() || !nodeVectors.length) {
    setPropagationStatus('Por favor selecciona un usuario, escribe un mensaje y genera vectores.');
    return;
  }

  setPropagationStatus('Iniciando propagación con vectores aleatorios…');
  try {
    const formData = new FormData();
    formData.append('seed_user', String(selectedUser));
    formData.append('message', message);
    formData.append('max_steps', '4');
    formData.append('method', method);
    formData.append('thresholds', JSON.stringify(thresholds));
    
    if (emotionVector && Object.values(emotionVector).some(val => val !== 0)) {
      formData.append('custom_vector', JSON.stringify(emotionVector));
    }

    const currentGraphData = viewMode === 'barabasi-behavior' ? baGraphData : hkGraphData;
    
    // Preparar archivo CSV de enlaces
    const linksCsvContent = currentGraphData.links.map(link => ({
      source: String(link.source.id || link.source),
      target: String(link.target.id || link.target),
    }));
    
    // Depurar los enlaces generados
    console.log('Links CSV content:', linksCsvContent);
    
    const linksCsvBlob = new Blob([Papa.unparse(linksCsvContent)], { type: 'text/csv' });
    const linksCsvFile = new File([linksCsvBlob], 'links.csv', { type: 'text/csv' });

    // Preparar archivo XLSX de estados
    const statesXlsxContent = currentGraphData.nodes.map(node => ({
      user_name: String(node.id),
      cluster: node.cluster || 0,
      in_subjectivity: node.emotional_vector_in.subjectivity || 0,
      in_polarity: node.emotional_vector_in.polarity || 0,
      in_fear: node.emotional_vector_in.fear || 0,
      in_anger: node.emotional_vector_in.anger || 0,
      in_anticip: node.emotional_vector_in.anticipation || 0,
      in_trust: node.emotional_vector_in.trust || 0,
      in_surprise: node.emotional_vector_in.surprise || 0,
      in_sadness: node.emotional_vector_in.sadness || 0,
      in_disgust: node.emotional_vector_in.disgust || 0,
      in_joy: node.emotional_vector_in.joy || 0,
      out_subjectivity: node.emotional_vector_out.subjectivity || 0,
      out_polarity: node.emotional_vector_out.polarity || 0,
      out_fear: node.emotional_vector_out.fear || 0,
      out_anger: node.emotional_vector_out.anger || 0,
      out_anticip: node.emotional_vector_out.anticipation || 0,
      out_trust: node.emotional_vector_out.trust || 0,
      out_surprise: node.emotional_vector_out.surprise || 0,
      out_sadness: node.emotional_vector_out.sadness || 0,
      out_disgust: node.emotional_vector_out.disgust || 0,
      out_joy: node.emotional_vector_out.joy || 0,
    }));
    
    // Depurar los estados generados
    console.log('States XLSX content:', statesXlsxContent);
    
    // Verificar si seed_user está en los nodos
    const seedUserInNodes = statesXlsxContent.some(node => node.user_name === String(selectedUser));
    console.log(`Seed user ${selectedUser} in nodes:`, seedUserInNodes);
    
    const ws = XLSX.utils.json_to_sheet(statesXlsxContent);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'States');
    const xlsxArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const xlsxBlob = new Blob([xlsxArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const xlsxFile = new File([xlsxBlob], 'states.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    formData.append('csv_file', linksCsvFile);
    formData.append('xlsx_file', xlsxFile);

    const response = await axios.post('http://localhost:8000/propagate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setPropagationResult(response.data);
    setPropagationStatus(`Propagación completada con método ${method.toUpperCase()}.`);
    const propagationLog = response.data.log || [];
    console.log('Propagation log from backend:', propagationLog);
    setPropagationLog(propagationLog);

    const updatedNodes = currentGraphData.nodes.map(node => {
      const lastEntry = propagationLog
        .filter(entry => entry.receiver === String(node.id))
        .sort((a, b) => b.t - a.t)[0];
      if (lastEntry) {
        return {
          ...node,
          emotional_vector_in: {
            subjectivity: lastEntry.state_in_after[0] || node.emotional_vector_in.subjectivity,
            polarity: lastEntry.state_in_after[1] || node.emotional_vector_in.polarity,
            fear: lastEntry.state_in_after[2] || node.emotional_vector_in.fear,
            anger: lastEntry.state_in_after[3] || node.emotional_vector_in.anger,
            anticipation: lastEntry.state_in_after[4] || node.emotional_vector_in.anticipation,
            trust: lastEntry.state_in_after[5] || node.emotional_vector_in.trust,
            surprise: lastEntry.state_in_after[6] || node.emotional_vector_in.surprise,
            sadness: lastEntry.state_in_after[7] || node.emotional_vector_in.sadness,
            disgust: lastEntry.state_in_after[8] || node.emotional_vector_in.disgust,
            joy: lastEntry.state_in_after[9] || node.emotional_vector_in.joy,
          },
          emotional_vector_out: {
            subjectivity: lastEntry.state_out_after[0] || node.emotional_vector_out.subjectivity,
            polarity: lastEntry.state_out_after[1] || node.emotional_vector_out.polarity,
            fear: lastEntry.state_out_after[2] || node.emotional_vector_out.fear,
            anger: lastEntry.state_out_after[3] || node.emotional_vector_out.anger,
            anticipation: lastEntry.state_out_after[4] || node.emotional_vector_out.anticipation,
            trust: lastEntry.state_out_after[5] || node.emotional_vector_out.trust,
            surprise: lastEntry.state_out_after[6] || node.emotional_vector_out.surprise,
            sadness: lastEntry.state_out_after[7] || node.emotional_vector_out.sadness,
            disgust: lastEntry.state_out_after[8] || node.emotional_vector_out.disgust,
            joy: lastEntry.state_out_after[9] || node.emotional_vector_out.joy,
          },
        };
      }
      return node;
    });

    if (viewMode === 'barabasi-behavior') {
      setBaGraphData({ ...baGraphData, nodes: updatedNodes });
    } else {
      setHkGraphData({ ...hkGraphData, nodes: updatedNodes });
    }

    setEmotionVector(emotionVector);
    const linksToHighlight = propagationLog
      .filter(entry => entry.sender && entry.receiver && entry.t !== undefined)
      .sort((a, b) => a.t - b.t)
      .map((entry, index) => ({
        source: String(entry.sender),
        target: String(entry.receiver),
        timeStep: entry.t,
        animationDelay: index * 4000,
        vector: entry.state_in_after,
      }));
    setHighlightedLinks(linksToHighlight);
    setHighlightId(String(selectedUser));
    setIsPropagationModalOpen(false);
    setIsNodeStatesModalOpen(false);
  } catch (error) {
    console.error('Propagation error:', error);
    setPropagationStatus(`Error: ${error.response?.data?.detail || error.message}`);
    setPropagationResult(null);
  }
};

  const handlePropagation = async ({ selectedUser, message, method, thresholds, csvFile, xlsxFile, emotionVector }) => {
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
      formData.append('method', method);
      formData.append('thresholds', JSON.stringify(thresholds));
      if (emotionVector && Object.values(emotionVector).some(val => val !== 0)) {
        formData.append('custom_vector', JSON.stringify(emotionVector));
      }
      const response = await axios.post('http://localhost:8000/propagate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPropagationResult(response.data);
      setPropagationStatus(`Propagación completada con método ${method.toUpperCase()}.`);
      const propagationLog = response.data.log || [];
      console.log('Propagation log from backend:', propagationLog);
      setPropagationLog(propagationLog);
      setEmotionVector(emotionVector);
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
      setIsNodeStatesModalOpen(false);
    } catch (error) {
      console.error('Propagation error:', error);
      setPropagationStatus(`Error: ${error.response?.data?.detail || error.message}`);
      setPropagationResult(null);
    }
  };

  const handleRipDsnPropagation = async ({ selectedUser, message }) => {
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

      let linksToHighlight = propagationLog
        .filter(entry => entry.sender && entry.receiver && entry.t !== undefined)
        .sort((a, b) => a.t - b.t)
        .map((entry, index) => ({
          source: String(entry.sender),
          target: String(entry.receiver),
          timeStep: entry.t,
          animationDelay: index * 4000,
        }));

      const involvedNodeIds = new Set(linksToHighlight.flatMap(link => [link.source, link.target]));
      const allLinks = realWorldLinksAll.filter(link => {
        const sourceId = link.source.id ? String(link.source.id) : String(link.source);
        const targetId = link.target.id ? String(link.target.id) : String(link.target);
        return involvedNodeIds.has(sourceId) && involvedNodeIds.has(targetId);
      });

      linksToHighlight.forEach(link => {
        const sourceId = link.source;
        const targetId = link.target;
        const nextLinks = allLinks.filter(l => {
          const lSourceId = l.source.id ? String(l.source.id) : String(l.source);
          const lTargetId = l.target.id ? String(l.target.id) : String(l.target);
          return lSourceId === targetId && involvedNodeIds.has(lTargetId) && !linksToHighlight.some(l => l.source === lSourceId && l.target === lTargetId);
        });
        nextLinks.forEach(nextLink => {
          const nextTargetId = nextLink.target.id ? String(nextLink.target.id) : String(nextLink.target);
          const maxTimeStep = Math.max(...linksToHighlight.map(l => l.timeStep)) + 1;
          if (!linksToHighlight.some(l => l.source === targetId && l.target === nextTargetId)) {
            linksToHighlight.push({
              source: targetId,
              target: nextTargetId,
              timeStep: maxTimeStep,
              animationDelay: linksToHighlight.length * 4000,
            });
            involvedNodeIds.add(nextTargetId);
          }
        });
      });

      console.log('Total RIP-DSN highlightedLinks (incluyendo secundarias):', linksToHighlight);
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
      setIsNodeStatesModalOpen(false);
      setModalNode(null);
      setMethod('ema');
      setThresholds({
        "High-Credibility Informant": { forward: 0.8, modify: 0.2, ignore: 0.05, alpha: 0.3 },
        "Emotionally-Driven Amplifier": { forward: 0.95, modify: 0.6, ignore: 0.1, alpha: 0.8 },
        "Mobilisation-Oriented Catalyst": { forward: 0.6, modify: 0.7, ignore: 0.3, alpha: 0.7 },
        "Emotionally Exposed Participant": { forward: 0.3, modify: 0.4, ignore: 0.7, alpha: 0.6 },
      });
      setEmotionVector(null);
    } else if (viewMode === 'rip-dsn') {
      setMessage('');
      setSelectedUser('');
      setRipDsnPropagationStatus('');
      setRipDsnPropagationResult(null);
      setRipDsnHighlightedLinks([]);
      setRipDsnPropagationLog([]);
      setIsPropagationModalOpen(false);
    } else if (viewMode === 'barabasi-si') {
      setMessage('');
      setSelectedUser('');
      setBaSIRPropagationStatus('');
      setBaSIRHighlightedLinks([]);
      setBaSIRPropagationLog([]);
      setShowBaSIRPropagationResult(false);
    } else if (viewMode === 'holme-kim-si') {
      setMessage('');
      setSelectedUser('');
      setHkSIRPropagationStatus('');
      setHkSIRHighlightedLinks([]);
      setHkSIRPropagationLog([]);
      setShowHkSIRPropagationResult(false);
    }
  };

  const getInvolvedNodes = () => {
    const nodeIds = new Set();
    propagationLog.forEach(entry => {
      if (entry.sender) nodeIds.add(entry.sender);
      if (entry.receiver) nodeIds.add(entry.receiver);
    });

    return Array.from(nodeIds).map(id => {
      const node = graphData.nodes.find(node => node.id === id);
      const nodeHistory = propagationLog
        .filter(entry => entry.receiver === id)
        .sort((a, b) => a.t - b.t);
      let initialState = nodeHistory.length > 0 && nodeHistory[0].state_in_before
        ? nodeHistory[0].state_in_before
        : null;
      if (!initialState && node) {
        initialState = emotionKeys.map(key => {
          const attrKey = `in_${key}`;
          return node[attrKey] != null ? Number(node[attrKey]) : 0;
        });
      }
      initialState = initialState && Array.isArray(initialState) && initialState.length === 10
        ? initialState.map(Number)
        : Array(10).fill(0);
      const finalState = nodeHistory.length > 0
        ? nodeHistory[nodeHistory.length - 1].state_in_after
        : null;
      const validFinalState = finalState && Array.isArray(finalState) && finalState.length === 10
        ? finalState.map(Number)
        : Array(10).fill(0);
      return {
        id,
        initialState,
        finalState: validFinalState,
      };
    });
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
              selectedNode={graphData.nodes.find(n => n.id === highlightId)}
              handleResetView={handleResetView}
            />
            <div className="propagation-button-container">
              <button
                onClick={() => setIsPropagationModalOpen(true)}
                className={graphData.nodes.length ? 'button' : 'button-disabled'}
                disabled={!graphData.nodes.length}
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
              setEmotionVector={setEmotionVector}
              isBehaviorMode={false}
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
                setEmotionVector(null);
              }}
              emotionVector={emotionVector}
            />
            <div className="graph-container">
              <Graph3D
                data={graphData}
                nodesWithCentrality={nodesWithCentrality}
                onNodeInfo={handleNodeClick}
                highlightId={highlightId}
                highlightedLinks={highlightedLinks}
                onResetView={handleResetView}
              />
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
            <SearchPanel
              searchText={searchText}
              setSearchText={setSearchText}
              highlightId={highlightId}
              setHighlightId={setHighlightId}
              status={realWorldStatus}
              selectedNode={realWorldGraphData.nodes.find(n => n.id === highlightId)}
              handleResetView={handleResetView}
            />
            <div className="propagation-button-container">
              <button
                onClick={() => setIsPropagationModalOpen(true)}
                className={realWorldGraphData.nodes.length ? 'button' : 'button-disabled'}
                disabled={!realWorldGraphData.nodes.length}
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
            <NodeModal
              isOpen={isNodeModalOpen}
              setIsOpen={setIsNodeModalOpen}
              modalNode={modalNode}
              propagationLog={ripDsnPropagationLog}
            />
            <RipDsnPropagationResult
              propagationLog={ripDsnPropagationLog}
              selectedUser={selectedUser}
              onClose={() => {
                setRipDsnPropagationResult(null);
                setRipDsnPropagationLog([]);
                setRipDsnHighlightedLinks([]);
              }}
            />
            <div className="graph-container">
              <RipDsnGraph3D
                data={realWorldGraphData}
                nodesWithCentrality={realWorldNodesWithCentrality}
                onNodeInfo={handleNodeClick}
                highlightId={highlightId}
                highlightedLinks={ripDsnHighlightedLinks}
                onResetView={handleResetView}
              />
            </div>
          </>
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
        {viewMode === 'barabasi-behavior' && (
          <>
            <VectorsInput
              onGenerateVectors={handleGenerateVectors}
              numNodes={baGraphData.nodes.length}
            />
            <div className="propagation-button-container">
              <button
                onClick={() => setIsPropagationModalOpen(true)}
                className={baGraphData.nodes.length && nodeVectors.length ? 'button' : 'button-disabled'}
                disabled={!baGraphData.nodes.length || !nodeVectors.length}
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
              nodes={baGraphData.nodes}
              handlePropagation={handleVectorPropagation}
              propagationStatus={propagationStatus}
              method={method}
              setMethod={setMethod}
              thresholds={thresholds}
              setThresholds={setThresholds}
              csvFile={null}
              xlsxFile={null}
              setEmotionVector={setEmotionVector}
              isBehaviorMode={true}
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
                setEmotionVector(null);
              }}
              emotionVector={emotionVector}
            />
            <div className="graph-container">
              <BarabasiBehaviorGraph3D
                data={baGraphData}
                nodesWithCentrality={baNodesWithCentrality}
                onNodeInfo={handleNodeClick}
                highlightId={highlightId}
                highlightedLinks={highlightedLinks}
                onResetView={handleResetView}
              />
            </div>
          </>
        )}
        {viewMode === 'holme-kim-behavior' && (
          <>
            <VectorsInput
              onGenerateVectors={handleGenerateVectors}
              numNodes={hkGraphData.nodes.length}
            />
            <div className="propagation-button-container">
              <button
                onClick={() => setIsPropagationModalOpen(true)}
                className={hkGraphData.nodes.length && nodeVectors.length ? 'button' : 'button-disabled'}
                disabled={!hkGraphData.nodes.length || !nodeVectors.length}
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
              nodes={hkGraphData.nodes}
              handlePropagation={handleVectorPropagation}
              propagationStatus={propagationStatus}
              method={method}
              setMethod={setMethod}
              thresholds={thresholds}
              setThresholds={setThresholds}
              csvFile={null}
              xlsxFile={null}
              setEmotionVector={setEmotionVector}
              isBehaviorMode={true}
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
                setEmotionVector(null);
              }}
              emotionVector={emotionVector}
            />
            <div className="graph-container">
              <HolmeKimBehaviorGraph3D
                data={hkGraphData}
                nodesWithCentrality={hkNodesWithCentrality}
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