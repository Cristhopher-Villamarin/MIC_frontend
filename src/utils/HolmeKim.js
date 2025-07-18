export function generateHolmeKim(n, m, p) {
  if (n < 2 || m < 1 || m >= n || p < 0 || p > 1) {
    throw new Error('Parámetros inválidos: n ≥ 2, 1 ≤ m < n, 0 ≤ p ≤ 1');
  }

  // Inicializar nodos con prefijo user_
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `user_${i}`, // Usar prefijo user_ (user_0, user_1, etc.)
    cluster: null,
  }));
  const links = [];
  const degrees = new Array(n).fill(0);
  const neighbors = Array.from({ length: n }, () => new Set());

  // Grafo inicial completo con m0 = m + 1 nodos
  const m0 = m + 1;
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      links.push({
        source: `user_${i}`, // Usar prefijo user_
        target: `user_${j}`, // Usar prefijo user_
      });
      degrees[i]++;
      degrees[j]++;
      neighbors[i].add(`user_${j}`);
      neighbors[j].add(`user_${i}`);
    }
  }

  // Añadir nodos restantes
  for (let i = m0; i < n; i++) {
    const connected = new Set();
    let edgesAdded = 0;

    // Primer enlace por unión preferencial
    let target = selectNodeByPreferentialAttachment(degrees, connected);
    links.push({ source: `user_${i}`, target: `user_${target}` });
    degrees[i]++;
    degrees[target]++;
    neighbors[i].add(`user_${target}`);
    neighbors[target].add(`user_${i}`);
    connected.add(target);
    edgesAdded++;

    // Enlaces restantes: triada o unión preferencial
    while (edgesAdded < m) {
      if (Math.random() < p && neighbors[target].size > 0) {
        // Formación de triada: conectar a un vecino del último nodo conectado
        const neighborArray = Array.from(neighbors[target]);
        const triadTarget = neighborArray[Math.floor(Math.random() * neighborArray.length)];
        if (!connected.has(parseInt(triadTarget.replace('user_', '')))) {
          links.push({ source: `user_${i}`, target: triadTarget });
          degrees[i]++;
          degrees[parseInt(triadTarget.replace('user_', ''))]++;
          neighbors[i].add(triadTarget);
          neighbors[parseInt(triadTarget.replace('user_', ''))].add(`user_${i}`);
          connected.add(parseInt(triadTarget.replace('user_', '')));
          edgesAdded++;
          target = parseInt(triadTarget.replace('user_', '')); // Actualizar target para la próxima iteración
        } else {
          // Si el vecino ya está conectado, intentar unión preferencial
          target = selectNodeByPreferentialAttachment(degrees, connected);
          links.push({ source: `user_${i}`, target: `user_${target}` });
          degrees[i]++;
          degrees[target]++;
          neighbors[i].add(`user_${target}`);
          neighbors[target].add(`user_${i}`);
          connected.add(target);
          edgesAdded++;
        }
      } else {
        // Unión preferencial
        target = selectNodeByPreferentialAttachment(degrees, connected);
        links.push({ source: `user_${i}`, target: `user_${target}` });
        degrees[i]++;
        degrees[target]++;
        neighbors[i].add(`user_${target}`);
        neighbors[target].add(`user_${i}`);
        connected.add(target);
        edgesAdded++;
      }
    }
  }

  console.log('Holme-Kim network generated:', {
    nodes: nodes.length,
    links: links.length,
    nodeIds: nodes.map(n => n.id), // Log para verificar IDs
  });

  return { nodes, links };
}

function selectNodeByPreferentialAttachment(degrees, exclude) {
  const totalDegree = degrees.reduce((sum, d, i) => sum + (exclude.has(i) ? 0 : d), 0);
  if (totalDegree === 0) {
    const available = degrees.map((_, i) => i).filter(i => !exclude.has(i));
    return available[Math.floor(Math.random() * available.length)] || 0;
  }
  let r = Math.random() * totalDegree;
  for (let i = 0; i < degrees.length; i++) {
    if (exclude.has(i)) continue;
    r -= degrees[i];
    if (r <= 0) return i;
  }
  return degrees.findIndex((d, i) => !exclude.has(i));
}