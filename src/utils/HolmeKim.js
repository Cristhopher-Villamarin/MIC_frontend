export function generateHolmeKim(n, m, p) {
  if (n < 2 || m < 1 || m >= n || p < 0 || p > 1) {
    throw new Error('Parámetros inválidos: n ≥ 2, 1 ≤ m < n, 0 ≤ p ≤ 1');
  }

  const nodes = Array.from({ length: n }, (_, i) => ({ id: String(i) }));
  const links = [];
  const degrees = new Array(n).fill(0);
  const neighbors = Array.from({ length: n }, () => new Set());

  // Grafo inicial completo con m0 = m + 1 nodos
  const m0 = m + 1;
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      links.push({ source: String(i), target: String(j) });
      degrees[i]++;
      degrees[j]++;
      neighbors[i].add(String(j));
      neighbors[j].add(String(i));
    }
  }

  // Añadir nodos restantes
  for (let i = m0; i < n; i++) {
    const connected = new Set();
    let edgesAdded = 0;

    // Primer enlace por unión preferencial
    let target = selectNodeByPreferentialAttachment(degrees, connected);
    links.push({ source: String(i), target: String(target) });
    degrees[i]++;
    degrees[target]++;
    neighbors[i].add(String(target));
    neighbors[target].add(String(i));
    connected.add(target);
    edgesAdded++;

    // Enlaces restantes: triada o unión preferencial
    while (edgesAdded < m) {
      if (Math.random() < p && neighbors[target].size > 0) {
        // Formación de triada: conectar a un vecino del último nodo conectado
        const neighborArray = Array.from(neighbors[target]);
        const triadTarget = neighborArray[Math.floor(Math.random() * neighborArray.length)];
        if (!connected.has(Number(triadTarget))) {
          links.push({ source: String(i), target: triadTarget });
          degrees[i]++;
          degrees[Number(triadTarget)]++;
          neighbors[i].add(triadTarget);
          neighbors[Number(triadTarget)].add(String(i));
          connected.add(Number(triadTarget));
          edgesAdded++;
          target = Number(triadTarget); // Actualizar target para la próxima iteración
        } else {
          // Si el vecino ya está conectado, intentar unión preferencial
          target = selectNodeByPreferentialAttachment(degrees, connected);
          links.push({ source: String(i), target: String(target) });
          degrees[i]++;
          degrees[target]++;
          neighbors[i].add(String(target));
          neighbors[target].add(String(i));
          connected.add(target);
          edgesAdded++;
        }
      } else {
        // Unión preferencial
        target = selectNodeByPreferentialAttachment(degrees, connected);
        links.push({ source: String(i), target: String(target) });
        degrees[i]++;
        degrees[target]++;
        neighbors[i].add(String(target));
        neighbors[target].add(String(i));
        connected.add(target);
        edgesAdded++;
      }
    }
  }

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
  return degrees.findIndex((d) => !exclude.has(d));
}