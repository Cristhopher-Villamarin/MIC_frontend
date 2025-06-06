import { useEffect, useRef, memo, useMemo, useCallback, useContext, createContext } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import SpriteText from "three-spritetext";

// Crear un contexto para eventos de propagación
const PropagationEventContext = createContext();

function RipDsnGraph3D({ data, onNodeInfo, highlightedLinks = [], highlightId, onResetView }) {
  const fgRef = useRef();
  const isTransitioning = useRef(false);
  const animationTimeoutRefs = useRef(new Set());
  const animationFrameRef = useRef(null);
  const batchUpdateRef = useRef(null);

  // Colores
  const defaultNodeColor = "#808080"; // Gris para nodos
  const defaultLinkColor = "#828282"; // Gris claro para enlaces
  const animatingLinkColor = "#00FFFF"; // Cian brillante para animación
  const permanentLinkColor = "#AAFF00"; // Verde fosforforcente permanente

  // Determinar si estamos en modo propagación y el tamaño
  const isInPropagationMode = highlightedLinks.length > 0;
  const isLargePropagation = highlightedLinks.length > 50;
  const isExtensivePropagation = highlightedLinks.length > 200;

  // Configuración dinámica basada en el tamaño de la propagación
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

  // Filtrar datos para mostrar solo nodos y enlaces involucrados en la propagación
  const filteredData = useMemo(() => {
    if (!isInPropagationMode) {
      return data;
    }

    const involvedNodeIds = new Set();
    const linkMap = new Map();

    data.links.forEach(link => {
      const sourceId = link.source.id ? String(link.source.id) : String(link.source);
      const targetId = link.target.id ? String(link.target.id) : String(link.target);
      const key1 = `${sourceId}-${targetId}`;
      const key2 = `${targetId}-${sourceId}`;
      linkMap.set(key1, link);
      linkMap.set(key2, link);
    });

    const involvedLinks = new Set();

    highlightedLinks.forEach(highlight => {
      const sourceId = String(highlight.source);
      const targetId = String(highlight.target);
      involvedNodeIds.add(sourceId);
      involvedNodeIds.add(targetId);

      const key1 = `${sourceId}-${targetId}`;
      const key2 = `${targetId}-${sourceId}`;
      const originalLink = linkMap.get(key1) || linkMap.get(key2);
      if (originalLink) {
        involvedLinks.add(originalLink);
      }
    });

    const filteredNodes = data.nodes.filter(node =>
      involvedNodeIds.has(String(node.id))
    );

    console.log(`Modo propagación activado:`, {
      totalNodes: data.nodes.length,
      filteredNodes: filteredNodes.length,
      totalLinks: data.links.length,
      filteredLinks: Array.from(involvedLinks).length,
      highlightedLinks: highlightedLinks.length,
      isLarge: isLargePropagation,
      isExtensive: isExtensivePropagation,
    });

    return {
      nodes: filteredNodes,
      links: Array.from(involvedLinks),
    };
  }, [data, highlightedLinks, isInPropagationMode, isLargePropagation, isExtensivePropagation]);

  // Función de refresh throttled para mejor rendimiento
  const throttledRefresh = useCallback(() => {
    if (batchUpdateRef.current) {
      return;
    }

    const config = getAnimationConfig();
    batchUpdateRef.current = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.refresh();
      }
      batchUpdateRef.current = null;
    }, config.REFRESH_THROTTLE);
  }, [getAnimationConfig]);

  // Centra la red al cargar o cambiar datos filtrados
  useEffect(() => {
    if (!isTransitioning.current && fgRef.current) {
      const delay = isExtensivePropagation ? 300 : 200;
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 0);
        }
      }, delay);
    }
  }, [filteredData.nodes, filteredData.links, isExtensivePropagation]);

  // Forzar refresco inicial
  useEffect(() => {
    if (fgRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        if (fgRef.current) {
          fgRef.current.refresh();
        }
      });
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
  }, []);

  // Limpiar todos los timeouts activos
  const clearAllTimeouts = useCallback(() => {
    animationTimeoutRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
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

    const links = filteredData.links;
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      link.__isHighlighted = false;
      link.__isPermanentlyHighlighted = false;
      link.__isCurrentlyAnimating = false;
    }

    throttledRefresh();
  }, [filteredData.links, clearAllTimeouts, throttledRefresh]);

  // Animación secuencial de enlaces con eventos
  useEffect(() => {
    cleanupAnimation();

    if (!fgRef.current || !highlightedLinks.length || !filteredData.links.length) {
      return;
    }

    const config = getAnimationConfig();
    console.log('Iniciando animación secuencial:', {
      highlightedLinks: highlightedLinks.length,
      config,
      isExtensive: isExtensivePropagation,
    });

    const links = filteredData.links;
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      link.__isHighlighted = false;
      link.__isPermanentlyHighlighted = false;
      link.__isCurrentlyAnimating = false;
    }

    const linkMap = new Map();
    links.forEach(link => {
      const sourceId = link.source.id ? String(link.source.id) : String(link.source);
      const targetId = link.target.id ? String(link.target.id) : String(link.target);
      const key1 = `${sourceId}-${targetId}`;
      const key2 = `${targetId}-${sourceId}`;
      linkMap.set(key1, link);
      linkMap.set(key2, link);
    });

    const sortedHighlightedLinks = [...highlightedLinks].sort((a, b) => a.timeStep - b.timeStep);

    const animateLink = (highlight, index) => {
      const sourceId = String(highlight.source);
      const targetId = String(highlight.target);

      const key1 = `${sourceId}-${targetId}`;
      const key2 = `${targetId}-${sourceId}`;
      const linkObj = linkMap.get(key1) || linkMap.get(key2);

      if (!linkObj) {
        console.warn(`Enlace no encontrado: ${sourceId} -> ${targetId}`);
        return;
      }

      linkObj.__isCurrentlyAnimating = true;
      linkObj.__isHighlighted = true;

      console.log(`Animando enlace ${index + 1}/${sortedHighlightedLinks.length}: ${sourceId} -> ${targetId}`);

      // Emitir evento cuando la línea se pinta de cian
      const propagationEvent = new CustomEvent('propagationUpdate', {
        detail: { t: highlight.timeStep, sender: sourceId, receiver: targetId }
      });
      window.dispatchEvent(propagationEvent);

      throttledRefresh();

      const animationEndTimeout = setTimeout(() => {
        if (linkObj) {
          linkObj.__isCurrentlyAnimating = false;
          linkObj.__isPermanentlyHighlighted = true;
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
      console.log('Animation sequential completed');
      animationTimeoutRefs.current.delete(finalTimeout);
    }, totalDuration);

    animationTimeoutRefs.current.add(finalTimeout);

    return () => {
      cleanupAnimation();
    };
  }, [highlightedLinks, filteredData.links, isExtensivePropagation, cleanupAnimation, getAnimationConfig, throttledRefresh]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Memoizar geometrías para mejor rendimiento
  const sphereGeometry = useMemo(() => {
    return isExtensivePropagation
      ? new THREE.SphereGeometry(6, 8, 8)
      : new THREE.SphereGeometry(6, 16, 16);
  }, [isExtensivePropagation]);

  return (
    <PropagationEventContext.Provider value={{}}>
      <ForceGraph3D
        ref={fgRef}
        graphData={filteredData}
        backgroundColor="#111"
        linkOpacity={0.85}
        linkWidth={link => {
          if (link.__isCurrentlyAnimating) {
            return 1.2;
          } else if (link.__isPermanentlyHighlighted) {
            return 1.2;
          }
          return 0.8;
        }}
        linkColor={link => {
          if (link.__isCurrentlyAnimating) {
            return animatingLinkColor;
          } else if (link.__isPermanentlyHighlighted) {
            return permanentLinkColor;
          }
          return defaultLinkColor;
        }}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={link => {
          if (link.__isCurrentlyAnimating) {
            return animatingLinkColor;
          } else if (link.__isPermanentlyHighlighted) {
            return permanentLinkColor;
          }
          return "#FFFFFF";
        }}
        linkDirectionalArrowResolution={isExtensivePropagation ? 4 : 8}
        d3VelocityDecay={isExtensivePropagation ? 0.4 : 0.3}
        warmupTicks={isExtensivePropagation ? 20 : 100}
        cooldownTicks={isExtensivePropagation ? 20 : 50}
        onNodeClick={onNodeInfo}
        nodeThreeObject={node => {
          const group = new THREE.Group();

          const material = new THREE.MeshBasicMaterial({
            color: defaultNodeColor,
            transparent: true,
            opacity: 0.8,
          });

          const sphere = new THREE.Mesh(sphereGeometry, material);
          group.add(sphere);

          const label = new SpriteText(String(node.id));
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
    </PropagationEventContext.Provider>
  );
}

export default memo(RipDsnGraph3D);