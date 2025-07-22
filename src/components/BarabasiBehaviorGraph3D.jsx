import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import CentralityModal from './CentralityModal';
import NodeModal from './NodeModal';

function BarabasiBehaviorGraph3D({ data, nodesWithCentrality, onNodeInfo, highlightId, highlightedLinks = [], onResetView, propagationLog = [] }) {
  const fgRef = useRef();
  const isTransitioning = useRef(false);
  const animationTimeoutRefs = useRef(new Set());
  const animationFrameRef = useRef(null);
  const batchUpdateRef = useRef(null);
  const [isCentralityModalOpen, setIsCentralityModalOpen] = useState(false);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [modalNode, setModalNode] = useState(null);

  // Colores inspirados en Intensamente e Intensamente 2
  const emotionColors = {
    fear: '#A100A1',
    anger: '#FF0000',
    anticipation: '#FF6200',
    trust: '#00CED1',
    surprise: '#FF69B4',
    sadness: '#4682B4',
    disgust: '#00FF00',
    joy: '#FFFF00',
  };

  // Color gris por defecto para nodos sin atributos emocionales
  const defaultColor = '#828282';

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
    const involvedLinks = new Set();

    // Crear mapa de enlaces para búsqueda eficiente
    data.links.forEach(link => {
      const sourceId = link.source.id ? String(link.source.id) : String(link.source);
      const targetId = link.target.id ? String(link.target.id) : String(link.target);
      const key1 = `${sourceId}-${targetId}`;
      const key2 = `${targetId}-${sourceId}`;
      linkMap.set(key1, link);
      linkMap.set(key2, link);
    });

    // Solo incluir nodos y enlaces de highlightedLinks
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

    // Filtrar nodos que estén en involvedNodeIds
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

  // Cache para texturas de gradiente con limpieza automática
  const textureCache = useRef(new Map());
  const textureCacheCleanup = useRef(null);

  // Limpiar cache de texturas periódicamente
  const scheduleTextureCacheCleanup = useCallback(() => {
    if (textureCacheCleanup.current) {
      clearTimeout(textureCacheCleanup.current);
    }

    textureCacheCleanup.current = setTimeout(() => {
      if (textureCache.current.size > 100) {
        const entries = Array.from(textureCache.current.entries());
        const toKeep = entries.slice(-50);
        textureCache.current.clear();
        toKeep.forEach(([key, value]) => {
          textureCache.current.set(key, value);
        });
      }
    }, 30000);
  }, []);

  // Crear textura de gradiente con cache optimizado
  const createGradientTexture = useCallback((colors, weights) => {
    const key = JSON.stringify({ colors, weights });
    if (textureCache.current.has(key)) {
      return textureCache.current.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
    let offset = 0;
    const totalWeight = weights.reduce((acc, curr) => acc + curr, 0) || 1;
    colors.forEach((color, i) => {
      const stop = offset + (weights[i] / totalWeight);
      gradient.addColorStop(offset, color);
      offset = stop;
    });
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    textureCache.current.set(key, texture);
    scheduleTextureCacheCleanup();
    return texture;
  }, [scheduleTextureCacheCleanup]);

  // Obtener color del nodo (actualizado para usar emotional_vector_in y emotional_vector_out)
  const getNodeColor = useCallback((node) => {
    const emotions = [
      ((node.emotional_vector_in?.fear || 0) + (node.emotional_vector_out?.fear || 0)) / 2,
      ((node.emotional_vector_in?.anger || 0) + (node.emotional_vector_out?.anger || 0)) / 2,
      ((node.emotional_vector_in?.anticipation || 0) + (node.emotional_vector_out?.anticipation || 0)) / 2,
      ((node.emotional_vector_in?.trust || 0) + (node.emotional_vector_out?.trust || 0)) / 2,
      ((node.emotional_vector_in?.surprise || 0) + (node.emotional_vector_out?.surprise || 0)) / 2,
      ((node.emotional_vector_in?.sadness || 0) + (node.emotional_vector_out?.sadness || 0)) / 2,
      ((node.emotional_vector_in?.disgust || 0) + (node.emotional_vector_out?.disgust || 0)) / 2,
      ((node.emotional_vector_in?.joy || 0) + (node.emotional_vector_out?.joy || 0)) / 2,
    ];
    const emotionKeys = [
      'fear',
      'anger',
      'anticipation',
      'trust',
      'surprise',
      'sadness',
      'disgust',
      'joy',
    ];

    // Si todas las emociones son 0 o no definidas, usar color gris
    const hasEmotions = emotions.some(val => val !== 0);
    if (!hasEmotions) {
      return { color: defaultColor, opacity: 0.8 };
    }

    const sortedEmotions = emotions
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);

    const colors = sortedEmotions.map(e => emotionColors[emotionKeys[e.idx]]);
    const weights = sortedEmotions.map(e => e.val);

    return { texture: createGradientTexture(colors, weights), opacity: 0.8 };
  }, [createGradientTexture]);

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
          fgRef.current.zoomToFit(400, 100);
        }
      }, delay);
    }
  }, [filteredData.nodes, filteredData.links, isExtensivePropagation]);

  // Forzar refresco inicial (optimizado)
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

    const node = filteredData.nodes.find(n => String(n.id) === String(highlightId));
    if (!node) {
      console.warn('Node not found:', highlightId);
      return;
    }

    const focusNode = () => {
      isTransitioning.current = true;
      const { x = 0, y = 0, z = 0 } = node;
      const bounds = calculateGraphBounds(filteredData.nodes);
      const graphSize = Math.max(bounds.maxDistance, 10);
      const distance = Math.min(graphSize * 0.5, 50); // Cap distance to avoid moving too far
      console.log('Camera moving to:', { x: x + distance, y: y + distance * 0.5, z }, 'target:', { x, y, z });

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
      fgRef.current.zoomToFit(400, 100);
      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
    }
  }, [highlightId]);

  // Calcular límites del grafo (optimizado)
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
      maxDistance: Math.max(maxX - minX, maxY - minY, maxZ - minZ),
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

    filteredData.nodes.forEach(node => {
      if (node.original_emotions) {
        node.emotional_vector_in = { ...node.original_emotions.emotional_vector_in };
        node.emotional_vector_out = { ...node.original_emotions.emotional_vector_out };
        delete node.original_emotions;
      }
    });

    throttledRefresh();
  }, [filteredData.nodes, filteredData.links, clearAllTimeouts, throttledRefresh]);

  // Animación secuencial optimizada
  useEffect(() => {
    cleanupAnimation();

    if (!fgRef.current || !highlightedLinks.length || !filteredData.links.length) {
      return;
    }

    const config = getAnimationConfig();
    console.log('Iniciando animación secuencial optimizada:', {
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

    filteredData.nodes.forEach(node => {
      node.original_emotions = {
        emotional_vector_in: { ...node.emotional_vector_in },
        emotional_vector_out: { ...node.emotional_vector_out },
      };
    });

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

      throttledRefresh();

      const animationEndTimeout = setTimeout(() => {
        if (linkObj) {
          linkObj.__isCurrentlyAnimating = false;
          linkObj.__isPermanentlyHighlighted = true;

          const targetNode = filteredData.nodes.find(n => String(n.id) === targetId);
          if (targetNode && highlight.vector) {
            const emotionKeys = [
              'subjectivity',
              'polarity',
              'fear',
              'anger',
              'anticipation',
              'trust',
              'surprise',
              'sadness',
              'disgust',
              'joy',
            ];
            targetNode.emotional_vector_in = {
              subjectivity: highlight.vector[0] !== undefined ? highlight.vector[0] : targetNode.emotional_vector_in.subjectivity,
              polarity: highlight.vector[1] !== undefined ? highlight.vector[1] : targetNode.emotional_vector_in.polarity,
              fear: highlight.vector[2] !== undefined ? highlight.vector[2] : targetNode.emotional_vector_in.fear,
              anger: highlight.vector[3] !== undefined ? highlight.vector[3] : targetNode.emotional_vector_in.anger,
              anticipation: highlight.vector[4] !== undefined ? highlight.vector[4] : targetNode.emotional_vector_in.anticipation,
              trust: highlight.vector[5] !== undefined ? highlight.vector[5] : targetNode.emotional_vector_in.trust,
              surprise: highlight.vector[6] !== undefined ? highlight.vector[6] : targetNode.emotional_vector_in.surprise,
              sadness: highlight.vector[7] !== undefined ? highlight.vector[7] : targetNode.emotional_vector_in.sadness,
              disgust: highlight.vector[8] !== undefined ? highlight.vector[8] : targetNode.emotional_vector_in.disgust,
              joy: highlight.vector[9] !== undefined ? highlight.vector[9] : targetNode.emotional_vector_in.joy,
            };
            console.log(`Actualizado estado emocional del nodo ${targetId} después de animación:`, targetNode.emotional_vector_in);
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

    return () => {
      cleanupAnimation();
    };
  }, [highlightedLinks, filteredData.nodes, filteredData.links, isExtensivePropagation, isLargePropagation, cleanupAnimation, getAnimationConfig, throttledRefresh]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      textureCache.current.clear();
      if (textureCacheCleanup.current) {
        clearTimeout(textureCacheCleanup.current);
      }
    };
  }, [clearAllTimeouts]);

  // Memoizar geometrías para mejor rendimiento
  const sphereGeometry = useMemo(() => {
    return isExtensivePropagation
      ? new THREE.SphereGeometry(6, 8, 8)
      : new THREE.SphereGeometry(6, 16, 16);
  }, [isExtensivePropagation]);

  // Manejar clic en nodo
  const handleNodeClick = (node) => {
    const nodeWithCentrality = nodesWithCentrality.find(n => n.id === node.id) || node;
    console.log('Node clicked:', nodeWithCentrality);
    setModalNode(nodeWithCentrality);
    setIsNodeModalOpen(true);
    if (onNodeInfo) onNodeInfo(node);
  };

  return (
    <>
      <ForceGraph3D
        ref={fgRef}
        graphData={filteredData}
        backgroundColor="#111"
        linkOpacity={0.6}
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
            return '#00ffff';
          } else if (link.__isPermanentlyHighlighted) {
            return '#aaff00';
          }
          return '#828282';
        }}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={link => {
          if (link.__isCurrentlyAnimating) {
            return '#00ffff';
          } else if (link.__isPermanentlyHighlighted) {
            return '#aaff00';
          }
          return '#FFFFFF';
        }}
        linkDirectionalArrowResolution={isExtensivePropagation ? 4 : 8}
        d3VelocityDecay={isExtensivePropagation ? 0.4 : 0.3}
        warmupTicks={isExtensivePropagation ? 20 : 100}
        cooldownTicks={isExtensivePropagation ? 20 : 100}
        onNodeClick={handleNodeClick}
        nodeThreeObject={node => {
          const group = new THREE.Group();

          const { texture, color, opacity } = getNodeColor(node);

          const material = new THREE.MeshBasicMaterial({
            map: texture instanceof THREE.Texture ? texture : null,
            color: color || (texture instanceof THREE.Texture ? null : texture),
            transparent: true,
            opacity,
          });

          const sphere = new THREE.Mesh(sphereGeometry, material);
          group.add(sphere);

          const label = new SpriteText(String(node.id));
          label.color = 'white';
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
      <NodeModal
        isOpen={isNodeModalOpen}
        setIsOpen={setIsNodeModalOpen}
        modalNode={modalNode}
        propagationLog={propagationLog}
      />
    </>
  );
}

export default memo(BarabasiBehaviorGraph3D);