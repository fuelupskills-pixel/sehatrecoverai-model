const fs = require('fs');
const { FigmaDocument } = require('@grida/refig');

function dumpStructure(filename) {
  console.log(`\n========================================`);
  console.log(`Dumping structure for: ${filename}`);
  console.log(`========================================`);
  
  const doc = FigmaDocument.fromFile(filename);
  const resolved = doc._resolve();
  const parsed = JSON.parse(resolved.sceneJson);
  
  // Find all nodes
  const nodes = parsed.document.nodes;
  console.log(`Total nodes in document: ${Object.keys(nodes).length}`);
  
  // Let's print out the root level nodes or frames.
  // In Grida IR, let's see how they are structured.
  // We can search for nodes that don't have parents or are containers at the top level, or find all frame-like nodes.
  const pages = [];
  const frames = [];
  
  for (const id in nodes) {
    const node = nodes[id];
    // Check type
    if (node.type === 'page') {
      pages.push(node);
    } else if (node.type === 'container' || node.type === 'frame') {
      // In Grida IR, frames might be container type
      // Let's look for nodes with reasonable size or names
      if (node.name && (node.name.toLowerCase().includes('flow') || node.name.toLowerCase().includes('screen') || node.name.toLowerCase().includes('page') || node.name.toLowerCase().includes('step') || node.name.toLowerCase().includes('patient') || node.name.toLowerCase().includes('doctor') || node.layout_target_width > 100)) {
        frames.push(node);
      }
    }
  }
  
  console.log(`Found Pages:`, pages.map(p => ({ id: p.id, name: p.name })));
  console.log(`Found ${frames.length} Frame/Container candidate nodes. Listing top 30:`);
  frames.slice(0, 30).forEach(f => {
    console.log(`  - ID: ${f.id} | Name: "${f.name}" | Type: ${f.type} | Size: ${f.layout_target_width}x${f.layout_target_height}`);
  });
  
  // Let's also look at all unique node names that seem like screens or sections.
  const uniqueNames = new Set(frames.map(f => f.name));
  console.log(`Unique candidate names (${uniqueNames.size}):`, Array.from(uniqueNames).slice(0, 40));
}

dumpStructure('sehatrecover flow.fig');
dumpStructure('Figma file (Copy).fig');
