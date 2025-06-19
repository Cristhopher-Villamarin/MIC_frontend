export function generateBarabasiAlbert(n, m) {
  // Initialize nodes and links
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    cluster: null,
  }));
  const links = [];

  // Create an initial complete graph with m0 = m + 1 nodes
  const m0 = Math.min(m + 1, n);
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      links.push({
        source: String(i + 1),
        target: String(j + 1),
      });
    }
  }

  // Calculate degrees for preferential attachment
  const degrees = new Array(n).fill(0);
  links.forEach(link => {
    degrees[parseInt(link.source) - 1]++;
    degrees[parseInt(link.target) - 1]++;
  });

  // Add remaining nodes with preferential attachment
  for (let i = m0; i < n; i++) {
    const newNode = String(i + 1);
    const connected = new Set();

    // Connect to m existing nodes
    while (connected.size < m && connected.size < i) {
      // Calculate total degree excluding already connected nodes
      const totalDegree = degrees.slice(0, i).reduce((sum, deg, idx) => 
        sum + (connected.has(String(idx + 1)) ? 0 : deg), 0
      );
      
      let targetIdx = -1;
      const rand = Math.random() * totalDegree;
      let sum = 0;
      
      // CORRECCIÓN: Solo sumar grados de nodos disponibles
      for (let j = 0; j < i; j++) {
        if (!connected.has(String(j + 1))) {  // ← CLAVE: Solo nodos disponibles
          sum += degrees[j];
          if (rand <= sum) {
            targetIdx = j;
            break;
          }
        }
      }

      // Fallback: choose a random unconnected node if needed
      if (targetIdx === -1) {
        const unconnected = Array.from({ length: i }, (_, j) => j)
          .filter(j => !connected.has(String(j + 1)));
        if (unconnected.length === 0) break;
        targetIdx = unconnected[Math.floor(Math.random() * unconnected.length)];
      }

      const target = String(targetIdx + 1);
      links.push({
        source: newNode,
        target,
      });
      connected.add(target);
      degrees[i]++;
      degrees[targetIdx]++;
    }
  }

  console.log('Barabási-Albert network generated:', {
    nodes: nodes.length,
    links: links.length,
  });

  return { nodes, links };
}