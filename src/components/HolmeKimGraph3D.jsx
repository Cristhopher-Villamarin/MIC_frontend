import { useEffect, useRef, useState, memo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import CentralityModal from './CentralityModal';

function HolmeKimGraph3D({ data, nodesWithCentrality, onNodeInfo, highlightId, onResetView }) {
  const fgRef = useRef();
  const isTransitioning = useRef(false);
  const [tempHighlightId, setTempHighlightId] = useState('');
  const [isCentralityModalOpen, setIsCentralityModalOpen] = useState(false);
  const [modalNode, setModalNode] = useState(null);

  // Colores
  const defaultNodeColor = '#7b8a84'; // Gris predeterminado
  const highlightNodeColor = '#FFFF00'; // Amarillo fosforescente para resaltado

  // Función para normalizar el highlightId
  const normalizeNodeId = (id) => {
    if (typeof id === 'string' && id.startsWith('user_')) {
      return id.replace('user_', '');
    }
    return id;
  };

  // Centra la red al cargar o cambiar datos
  useEffect(() => {
    if (!isTransitioning.current && fgRef.current) {
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 0);
        }
      }, 200);
    }
  }, [data.nodes, data.links]);

  // Enfoca al nodo destacado y activa el resaltado temporal
  useEffect(() => {
    if (!highlightId || !fgRef.current || !data.nodes.length || isTransitioning.current) return;

    // Normalizar el highlightId
    const normalizedHighlightId = normalizeNodeId(highlightId);

    // Activar resaltado temporal
    setTempHighlightId(normalizedHighlightId);

    // Limpiar resaltado después de 5 segundos
    const timer = setTimeout(() => {
      setTempHighlightId('');
    }, 5000);

    const node = data.nodes.find(n => n.id === normalizedHighlightId);
    if (!node) {
      console.warn('Nodo no encontrado:', normalizedHighlightId);
      return;
    }

    const focusNode = () => {
      isTransitioning.current = true;
      const { x = 0, y = 0, z = 0 } = node;
      const bounds = calculateGraphBounds(data.nodes);
      const graphSize = Math.max(bounds.maxDistance, 10);
      const distance = graphSize * 1.5;

      fgRef.current.cameraPosition(
        { x: x + distance, y: y + distance * 0.5, z },
        { x, y, z },
        1500
      );

      isTransitioning.current = false;
    };

    setTimeout(focusNode, 100);

    return () => clearTimeout(timer);
  }, [highlightId, data.nodes]);

  // Resetea la vista
  useEffect(() => {
    if (!highlightId && fgRef.current && !isTransitioning.current) {
      isTransitioning.current = true;
      fgRef.current.zoomToFit(400, 0);
      setTempHighlightId('');
      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
    }
  }, [highlightId]);

  // Calcular límites del grafo
  const calculateGraphBounds = (nodes) => {
    if (!nodes.length) return { maxDistance: 10 };

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const x = node.x || 0;
      const y = node.y || 0;
      const z = node.z || 0;

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    return {
      maxDistance: Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    };
  };

  // Manejar clic en nodo
  const handleNodeClick = (node) => {
    const nodeWithCentrality = nodesWithCentrality.find(n => n.id === node.id) || node;
    setModalNode(nodeWithCentrality);
    setIsCentralityModalOpen(true);
    onNodeInfo(node);
  };

  return (
    <>
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        backgroundColor="#111"
        linkOpacity={0.4}
        linkWidth={0.8}
        linkColor="#828282"
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={100}
        onNodeClick={handleNodeClick}
        nodeThreeObject={node => {
          const group = new THREE.Group();

          const material = new THREE.MeshBasicMaterial({
            color: node.id === normalizeNodeId(tempHighlightId) ? highlightNodeColor : defaultNodeColor,
            transparent: true,
            opacity: 1,
          });

          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(6, 16, 16),
            material
          );
          group.add(sphere);

          const label = new SpriteText(node.id);
          label.color = 'white';
          label.textHeight = 3;
          label.material.depthWrite = false;
          label.material.depthTest = false;
          group.add(label);

          return group;
        }}
        width={window.innerWidth - 250}
        height={window.innerHeight - 120}
      />
      <CentralityModal
        isOpen={isCentralityModalOpen}
        setIsOpen={setIsCentralityModalOpen}
        modalNode={modalNode}
      />
    </>
  );
}

export default memo(HolmeKimGraph3D);