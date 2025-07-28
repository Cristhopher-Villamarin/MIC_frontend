import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import PropTypes from 'prop-types';
import CentralityModal from './CentralityModal';

function HolmeKimSIRGraph3D({ data, nodesWithCentrality, onNodeInfo, highlightedLinks = [], highlightId, onResetView, beta, gamma, selectedUser, message }) {
  const fgRef = useRef();
  const isTransitioning = useRef(false);
  const animationTimeoutRefs = useRef(new Set());
  const animationFrameRef = useRef(null);
  const batchUpdateRef = useRef(null);
  const [isCentralityModalOpen, setIsCentralityModalOpen] = useState(false);
  const [modalNode, setModalNode] = useState(null);

  // Colores para estados SIR
  const susceptibleNodeColor = "#808080"; // Gris para susceptibles
  const infectedNodeColor = "#FF0000"; // Rojo para infectados
  const recoveredNodeColor = "#00FF00"; // Verde para recuperados
  const defaultLinkColor = "#828282"; // Gris claro para enlaces
  const animatingLinkColor = "#00FFFF"; // Cian brillante para animación
  const permanentLinkColor = "#FF4500"; // Naranja para enlaces destacados permanentemente

  // Configuración dinámica para la animación
  const isInPropagationMode = highlightedLinks.length > 0;
  const isLargePropagation = highlightedLinks.length > 50;
  const isExtensivePropagation = highlightedLinks.length > 200;

  const getAnimationConfig = useCallback(() => {
    if (isExtensivePropagation) {
      return {
        ANIMATION_DELAY: 4000,
        ANIMATION_DURATION: 4000,
        BATCH_SIZE: 1,
        VISIBILITY_DURATION: 4000,
        REFRESH_THROTTLE: 50,
      };
    } else if (isLargePropagation) {
      return {
        ANIMATION_DELAY: 4000,
        ANIMATION_DURATION: 4000,
        BATCH_SIZE: 1,
        VISIBILITY_DURATION: 4000,
        REFRESH_THROTTLE: 50,
      };
    } else {
      return {
        ANIMATION_DELAY: 4000,
        ANIMATION_DURATION: 4000,
        BATCH_SIZE: 1,
        VISIBILITY_DURATION: 4000,
        REFRESH_THROTTLE: 50,
      };
    }
  }, [isExtensivePropagation, isLargePropagation]);

  // Estado SIR para cada nodo
  const nodeStates = useMemo(() => {
    const states = {};
    data.nodes.forEach(node => {
      states[node.id] = selectedUser === node.id ? 'infected' : 'susceptible';
    });
    return states;
  }, [data.nodes, selectedUser]);

  // Usar la red completa, pero crear un mapa de enlaces para la animación
const filteredData = useMemo(() => {
  const nodeIds = new Set(data.nodes.map(node => String(node.id)));
  const validLinks = data.links.filter(link => {
    const sourceId = link.source.id ? String(link.source.id) : String(link.source);
    const targetId = link.target.id ? String(link.target.id) : String(link.target);
    return nodeIds.has(sourceId) && nodeIds.has(targetId) && sourceId !== targetId; // <- Añadimos validación para evitar self-links
  });

  const linkMap = new Map();
  validLinks.forEach(link => {
    const sourceId = link.source.id ? String(link.source.id) : String(link.source);
    const targetId = link.target.id ? String(link.target.id) : String(link.target);
    const key = `${sourceId}-${targetId}`;
    linkMap.set(key, link);
  });

  return {
    nodes: data.nodes,
    links: validLinks,
    linkMap,
  };
}, [data]);

  // Función de refresh throttled
  const throttledRefresh = useCallback(() => {
    if (batchUpdateRef.current) return;
    const config = getAnimationConfig();
    batchUpdateRef.current = setTimeout(() => {
      if (fgRef.current) fgRef.current.refresh();
      batchUpdateRef.current = null;
    }, config.REFRESH_THROTTLE);
  }, [getAnimationConfig]);

  // Centra la red al cargar o cambiar datos
  useEffect(() => {
    if (!isTransitioning.current && fgRef.current) {
      const delay = isExtensivePropagation ? 300 : 200;
      setTimeout(() => {
        if (fgRef.current) fgRef.current.zoomToFit(400, 0);
      }, delay);
    }
  }, [filteredData.nodes, filteredData.links, isExtensivePropagation]);

  // Forzar refresco inicial
  useEffect(() => {
    if (fgRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        if (fgRef.current) fgRef.current.refresh();
      });
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Enfoca al nodo destacado
  useEffect(() => {
    if (!highlightId || !fgRef.current || !filteredData.nodes.length || isTransitioning.current) return;

    const node = filteredData.nodes.find(n => n.id === highlightId);
    if (!node) {
      console.warn('Node not found:', highlightId);
      return;
    }

    const focusNode = () => {
      isTransitioning.current = true;
      const { x = 0, y = 0, z = 0 } = node;
      const bounds = calculateGraphBounds(filteredData.nodes);
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
  }, [highlightId, filteredData.nodes]);

  // Resetea la vista
  useEffect(() => {
    if (!highlightId && fgRef.current && !isTransitioning.current) {
      isTransitioning.current = true;
      fgRef.current.zoomToFit(400, 0);
      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
    }
  }, [highlightId]);

  // Calcular límites del grafo
  const calculateGraphBounds = useCallback((nodes) => {
    if (!nodes.length) return { maxDistance: 10 };

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    nodes.forEach(node => {
      const x = node.x || 0;
      const y = node.y || 0;
      const z = node.z || 0;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    });

    return {
      maxDistance: Math.max(maxX - minX, maxY - minY, maxZ - minZ),
    };
  }, []);

  // Limpiar timeouts
  const clearAllTimeouts = useCallback(() => {
    animationTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    animationTimeoutRefs.current.clear();
    if (batchUpdateRef.current) {
      clearTimeout(batchUpdateRef.current);
      batchUpdateRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Limpiar animaciones previas
  const cleanupAnimation = useCallback(() => {
    clearAllTimeouts();
    filteredData.links.forEach(link => {
      link.__isHighlighted = false;
      link.__isPermanentlyHighlighted = false;
      link.__isCurrentlyAnimating = false;
      link.__animationCount = 0;
    });
    throttledRefresh();
  }, [filteredData.links, clearAllTimeouts, throttledRefresh]);

  // Animación secuencial de enlaces
  useEffect(() => {
    cleanupAnimation();

    if (!fgRef.current || !highlightedLinks.length || !filteredData.links.length) return;

    const config = getAnimationConfig();
    const linkMap = filteredData.linkMap;

    const sortedHighlightedLinks = [...highlightedLinks].sort((a, b) => a.timeStep - b.timeStep);

    const animateLink = (highlight, index) => {
      const sourceId = String(highlight.source);
      const targetId = String(highlight.target);
      const key1 = `${sourceId}-${targetId}`;
      const key2 = `${targetId}-${sourceId}`;
      let linkObj = linkMap.get(key1) || linkMap.get(key2);

      if (!linkObj) {
        console.warn(`Enlace no encontrado: ${sourceId} -> ${targetId}`);
        return;
      }

      linkObj.__animationCount = (linkObj.__animationCount || 0) + 1;
      linkObj.__isCurrentlyAnimating = true;
      linkObj.__isHighlighted = true;

      console.log(`Animando enlace ${index + 1}/${sortedHighlightedLinks.length}: ${targetId} -> ${sourceId} (inverso)`);

      throttledRefresh();

      const animationEndTimeout = setTimeout(() => {
        if (linkObj) {
          linkObj.__isCurrentlyAnimating = false;
          linkObj.__isPermanentlyHighlighted = true;
          nodeStates[sourceId] = 'infected';

          // Disparar evento de propagación
          const propagationEvent = new CustomEvent('baSIRPropagationUpdate', {
            detail: {
              t: highlight.timeStep,
              sender: targetId,
              receiver: sourceId,
              state: nodeStates[sourceId],
            },
          });
          window.dispatchEvent(propagationEvent);

          // Verificar si el nodo target ha propagado a todos sus seguidores
          const incomingLinks = filteredData.links.filter(link => {
            const linkTargetId = link.target.id ? String(link.target.id) : String(link.target);
            return linkTargetId === targetId;
          });
          const allPropagated = incomingLinks.every(link => {
            const linkSourceId = link.source.id ? String(link.source.id) : String(link.source);
            return nodeStates[linkSourceId] !== 'susceptible' || link.__isPermanentlyHighlighted;
          });
          if (allPropagated && Math.random() < gamma) {
            nodeStates[targetId] = 'recovered';
            // Disparar evento para la recuperación del nodo target
            const recoveryEvent = new CustomEvent('baSIRPropagationUpdate', {
              detail: {
                t: highlight.timeStep,
                sender: targetId,
                receiver: targetId,
                state: nodeStates[targetId],
              },
            });
            window.dispatchEvent(recoveryEvent);
          }
          throttledRefresh();
        }
        animationTimeoutRefs.current.delete(animationEndTimeout);
      }, config.ANIMATION_DURATION);

      animationTimeoutRefs.current.add(animationEndTimeout);
    };

    sortedHighlightedLinks.forEach((highlight, index) => {
      const delay = index * config.ANIMATION_DELAY;
      const animationTimeout = setTimeout(() => {
        animateLink(highlight, index);
        animationTimeoutRefs.current.delete(animationTimeout);
      }, delay);
      animationTimeoutRefs.current.add(animationTimeout);
    });

    const totalDuration = sortedHighlightedLinks.length * config.ANIMATION_DELAY + config.ANIMATION_DURATION;
    const finalTimeout = setTimeout(() => {
      console.log('Animación secuencial completada');
      animationTimeoutRefs.current.delete(finalTimeout);
    }, totalDuration);

    animationTimeoutRefs.current.add(finalTimeout);

    return () => cleanupAnimation();
  }, [highlightedLinks, filteredData.links, filteredData.linkMap, isExtensivePropagation, cleanupAnimation, getAnimationConfig, throttledRefresh, gamma, nodeStates]);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Memoizar geometrías
  const sphereGeometry = useMemo(() => {
    return isExtensivePropagation
      ? new THREE.SphereGeometry(6, 8, 8)
      : new THREE.SphereGeometry(6, 16, 16);
  }, [isExtensivePropagation]);

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
        graphData={{ nodes: filteredData.nodes, links: filteredData.links }}
        backgroundColor="#111"
        linkOpacity={0.85}
        linkWidth={link => {
          if (link.__isCurrentlyAnimating) return 1.2;
          if (link.__isPermanentlyHighlighted) return 1.2;
          return 0.8;
        }}
        linkColor={link => {
          if (link.__isCurrentlyAnimating) return animatingLinkColor;
          if (link.__isPermanentlyHighlighted) return permanentLinkColor;
          return defaultLinkColor;
        }}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={link => {
          if (link.__isCurrentlyAnimating) return animatingLinkColor;
          if (link.__isPermanentlyHighlighted) return permanentLinkColor;
          return "#FFFFFF";
        }}
        linkDirectionalArrowResolution={isExtensivePropagation ? 4 : 8}
        d3VelocityDecay={isExtensivePropagation ? 0.4 : 0.3}
        warmupTicks={isExtensivePropagation ? 20 : 100}
        cooldownTicks={isExtensivePropagation ? 20 : 50}
        onNodeClick={handleNodeClick}
        nodeThreeObject={node => {
          const group = new THREE.Group();
          const nodeState = nodeStates[node.id] || 'susceptible';
          const material = new THREE.MeshBasicMaterial({
            color: nodeState === 'infected' ? infectedNodeColor : nodeState === 'recovered' ? recoveredNodeColor : susceptibleNodeColor,
            transparent: true,
            opacity: 0.8,
          });

          const sphere = new THREE.Mesh(sphereGeometry, material);
          group.add(sphere);

          const label = new SpriteText(node.id);
          label.color = "white";
          label.textHeight = isExtensivePropagation ? 2.5 : 3;
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

HolmeKimSIRGraph3D.propTypes = {
  data: PropTypes.shape({
    nodes: PropTypes.array.isRequired,
    links: PropTypes.array.isRequired,
  }).isRequired,
  nodesWithCentrality: PropTypes.array.isRequired,
  onNodeInfo: PropTypes.func.isRequired,
  highlightedLinks: PropTypes.array,
  highlightId: PropTypes.string,
  onResetView: PropTypes.func.isRequired,
  beta: PropTypes.number,
  gamma: PropTypes.number,
  selectedUser: PropTypes.string,
  message: PropTypes.string,
};

export default HolmeKimSIRGraph3D;