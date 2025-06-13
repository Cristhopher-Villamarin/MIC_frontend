// src/utils/centrality.js
export function calculateCentralityMetrics(nodes, links) {
  const nodeMap = new Map(nodes.map(node => [node.id, { ...node, inDegree: 0, outDegree: 0 }]));
  const n = nodes.length;

  // Calcular centralidad de grado (in-degree y out-degree)
  links.forEach(link => {
    const source = String(link.source);
    const target = String(link.target);
    if (nodeMap.has(source)) nodeMap.get(source).outDegree += 1;
    if (nodeMap.has(target)) nodeMap.get(target).inDegree += 1;
  });

  // Normalizar centralidad de grado (dividir por n-1)
  const maxDegree = n - 1;
  nodeMap.forEach(node => {
    node.degreeCentralityIn = node.inDegree / maxDegree;
    node.degreeCentralityOut = node.outDegree / maxDegree;
    node.degreeCentrality = (node.inDegree + node.outDegree) / (2 * maxDegree);
  });

  // Calcular centralidad de intermediación (betweenness)
  const betweenness = new Map(nodes.map(node => [node.id, 0]));
  nodes.forEach(source => {
    const stack = [];
    const paths = new Map(nodes.map(node => [node.id, []]));
    const sigma = new Map(nodes.map(node => [node.id, 0]));
    const d = new Map(nodes.map(node => [node.id, -1]));
    const Q = [];
    const delta = new Map(nodes.map(node => [node.id, 0]));

    sigma.set(source.id, 1);
    d.set(source.id, 0);
    Q.push(source.id);

    while (Q.length > 0) {
      const v = Q.shift();
      stack.push(v);
      // Obtener vecinos salientes
      const neighbors = links
        .filter(link => String(link.source) === v)
        .map(link => String(link.target));
      neighbors.forEach(w => {
        if (d.get(w) === -1) {
          Q.push(w);
          d.set(w, d.get(v) + 1);
        }
        if (d.get(w) === d.get(v) + 1) {
          sigma.set(w, sigma.get(w) + sigma.get(v));
          paths.get(w).push(v);
        }
      });
    }

    while (stack.length > 0) {
      const w = stack.pop();
      paths.get(w).forEach(v => {
        delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)));
      });
      if (w !== source.id) {
        betweenness.set(w, betweenness.get(w) + delta.get(w));
      }
    }
  });

  // Normalizar betweenness
  const maxBetweenness = (n - 1) * (n - 2) / 2;
  nodeMap.forEach(node => {
    node.betweennessCentrality = maxBetweenness > 0 ? (betweenness.get(node.id) / maxBetweenness) : 0;
  });

  // Calcular centralidad de cercanía (closeness)
  nodeMap.forEach(node => {
    let totalDistance = 0;
    let reachable = 0;
    const Q = [{ id: node.id, dist: 0 }];
    const visited = new Set([node.id]);
    while (Q.length > 0) {
      const { id: v, dist } = Q.shift();
      totalDistance += dist;
      reachable += 1;
      const neighbors = links
        .filter(link => String(link.source) === v)
        .map(link => String(link.target));
      neighbors.forEach(w => {
        if (!visited.has(w)) {
          visited.add(w);
          Q.push({ id: w, dist: dist + 1 });
        }
      });
    }
    // Normalizar: closeness = (n-1) / suma de distancias
    node.closenessCentrality = reachable > 1 ? (reachable - 1) / totalDistance : 0;
  });

  return Array.from(nodeMap.values());
}