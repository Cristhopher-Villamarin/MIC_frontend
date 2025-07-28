export function generateHolmeKim(n, m, p) {
  if (n < 2 || m < 1 || m >= n || p < 0 || p > 1) {
    throw new Error('Parámetros inválidos: n ≥ 2, 1 ≤ m < n, 0 ≤ p ≤ 1');
  }

  // Initialize nodes starting from user_1
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `user_${i + 1}`, // Start from user_1
    cluster: null,
  }));
  const links = [];
  const degrees = new Array(n).fill(0);
  const neighbors = Array.from({ length: n }, () => new Set());

  // Create initial complete graph with m0 = m + 1 nodes
  const m0 = m + 1;
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      links.push({
        source: `user_${i + 1}`, // Start from user_1
        target: `user_${j + 1}`, // Start from user_1
      });
      degrees[i]++;
      degrees[j]++;
      neighbors[i].add(`user_${j + 1}`);
      neighbors[j].add(`user_${i + 1}`);
    }
  }

  // Add remaining nodes
  for (let i = m0; i < n; i++) {
    const connected = new Set();
    let edgesAdded = 0;

    // First link by preferential attachment
    let target = selectNodeByPreferentialAttachment(degrees, connected);
    links.push({ source: `user_${i + 1}`, target: `user_${target + 1}` });
    degrees[i]++;
    degrees[target]++;
    neighbors[i].add(`user_${target + 1}`);
    neighbors[target].add(`user_${i + 1}`);
    connected.add(target);
    edgesAdded++;

    // Remaining links: triad or preferential attachment
    while (edgesAdded < m) {
      if (Math.random() < p && neighbors[target].size > 0) {
        // Triad formation: connect to a neighbor of the last connected node
        const neighborArray = Array.from(neighbors[target]);
        const triadTarget = neighborArray[Math.floor(Math.random() * neighborArray.length)];
        const triadTargetIdx = parseInt(triadTarget.replace('user_', '')) - 1; // Adjust for user_1-based IDs
        if (!connected.has(triadTargetIdx)) {
          links.push({ source: `user_${i + 1}`, target: triadTarget });
          degrees[i]++;
          degrees[triadTargetIdx]++;
          neighbors[i].add(triadTarget);
          neighbors[triadTargetIdx].add(`user_${i + 1}`);
          connected.add(triadTargetIdx);
          edgesAdded++;
          target = triadTargetIdx; // Update target for next iteration
        } else {
          // If neighbor is already connected, try preferential attachment
          target = selectNodeByPreferentialAttachment(degrees, connected);
          links.push({ source: `user_${i + 1}`, target: `user_${target + 1}` });
          degrees[i]++;
          degrees[target]++;
          neighbors[i].add(`user_${target + 1}`);
          neighbors[target].add(`user_${i + 1}`);
          connected.add(target);
          edgesAdded++;
        }
      } else {
        // Preferential attachment
        target = selectNodeByPreferentialAttachment(degrees, connected);
        links.push({ source: `user_${i + 1}`, target: `user_${target + 1}` });
        degrees[i]++;
        degrees[target]++;
        neighbors[i].add(`user_${target + 1}`);
        neighbors[target].add(`user_${i + 1}`);
        connected.add(target);
        edgesAdded++;
      }
    }
  }

  console.log('Holme-Kim network generated:', {
    nodes: nodes.length,
    links: links.length,
    nodeIds: nodes.map(n => n.id), // Log to verify IDs
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