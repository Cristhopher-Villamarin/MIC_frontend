import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import CentralityModal from './CentralityModal';
import NodeModal from './NodeModal';

function HolmeKimBehaviorGraph3D({ data, nodesWithCentrality, onNodeInfo, highlightId, highlightedLinks = [], onResetView, propagationLog = [] }) {
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
    anticip: '#FF6200',
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

    data.links.forEach(link => {
      const sourceId = link.source.id ? String(link.source.id) : String(link.source);
      const targetId = link.target.id ? String(link.target.id) : String(link.target);
      const key1 = `${sourceId}-${targetId}`;
      const key2 = `${targetId}-${sourceId}`;
      linkMap.set(key1, link);
      linkMap.set(key2, link);
      involvedNodeIds.add(sourceId);
      involvedNodeIds.add(targetId);
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

  // Obtener color del nodo (memoizado por performance)
  const getNodeColor = useCallback((node) => {
    const emotions = [
      ((node.in_fear || 0) + (node.out_fear || 0)) / 2,
      ((node.in_anger || 0) + (node.out_anger || 0)) / 2,
      ((node.in_anticip || 0) + (node.out_anticip || 0)) / 2,
      ((node.in_trust || 0) + (node.out_trust || 0)) / 2,
      ((node.in_surprise || 0) + (node.out_surprise || 0)) / 2,
      ((node.in_sadness || 0) + (node.out_sadness || 0)) / 2,
      ((node.in_disgust || 0) + (node.out_disgust || 0)) / 2,
      ((node.in_joy || 0) + (node.out_joy || 0)) / 2,
    ];
    const emotionKeys = [
      'fear',
      'anger',
      'anticip',
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
        Object.assign(node, node.original_emotions);
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
        in_fear: node.in_fear,
        in_anger: node.in_anger,
        in_anticip: node.in_anticip,
        in_trust: node.in_trust,
        in_surprise: node.in_surprise,
        in_sadness: node.in_sadness,
        in_disgust: node.in_disgust,
        in_joy: node.in_joy,
        out_fear: node.out_fear,
        out_anger: node.out_anger,
        out_anticip: node.out_anticip,
        out_trust: node.out_trust,
        out_surprise: node.out_surprise,
        out_sadness: node.out_sadness,
        out_disgust: node.out_disgust,
        out_joy: node.out_joy,
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
              'in_subjectivity',
              'in_polarity',
              'in_fear',
              'in_anger',
              'in_anticip',
              'in_trust',
              'in_surprise',
              'in_sadness',
              'in_disgust',
              'in_joy',
            ];
            emotionKeys.forEach((key, idx) => {
              if (highlight.vector[idx] !== undefined) {
                targetNode[key] = highlight.vector[idx];
              }
            });
            console.log(`Actualizado estado emocional del nodo ${targetId} después de animación:`, targetNode);
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
  }, [highlightedLinks, filteredData.nodes, filteredData.links, isExtensivePropagation, isLargePropagation,
      cleanupAnimation, getAnimationConfig, throttledRefresh]);

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
    setModalNode(nodeWithCentrality);
    setIsNodeModalOpen(true);
    onNodeInfo(node);
  };

  // Configurar fuerzas para fijar nodos en sus posiciones
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      const graph = fgRef.current;
      graph.d3Force('center', null); // Desactivar fuerza de centrado
      graph.d3Force('charge', null); // Desactivar fuerza de repulsión
      graph.d3Force('link', null); // Desactivar fuerza de enlaces
      graph.d3Force('collide', null); // Desactivar colisiones

      // Fijar posiciones iniciales
      graph.d3Force('fix', () => {
        data.nodes.forEach(node => {
          node.fx = node.x;
          node.fy = node.y;
          node.fz = node.z;
        });
      });

      graph.refresh(); // Aplicar cambios inmediatamente
    }
  }, [data.nodes]);

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
        propagationLog={propagationLog} // Pass propagationLog here
      />
    </>
  );
}

export default memo(HolmeKimBehaviorGraph3D);