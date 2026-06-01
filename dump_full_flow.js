const fs = require('fs');
const { FigmaDocument } = require('@grida/refig');

const doc = FigmaDocument.fromFile('sehatrecover flow.fig');
const parsed = JSON.parse(doc._resolve().sceneJson);
const nodes = parsed.document.nodes;
const links = parsed.document.links;

const roots = ['1:2713', '1:7482', '1:8392', '1:9222', '1:10352'];
const flowNames = {
  '1:2713': 'Patient Flow',
  '1:7482': 'Doctor Flow',
  '1:8392': 'Pharmacy Flow',
  '1:9222': 'Admin Flow',
  '1:10352': 'Insurance Flow'
};

let output = '';

function log(text) {
  output += text + '\n';
  console.log(text);
}

function traverse(id, indentLevel = 0) {
  const node = nodes[id];
  if (!node) return;
  
  const indent = '  '.repeat(indentLevel);
  
  // Clean up type and format
  let textContent = '';
  if (node.text) {
    textContent = ` [Text: "${node.text.trim().replace(/\n/g, ' ')}"]`;
  }
  
  // Decide whether to print this node
  // We want to skip empty vectors/lines to keep the text flow clean,
  // but keep containers, components, tspans, and anything with text.
  const isInteresting = node.text || 
                        (node.type === 'container') || 
                        (node.name && !node.name.toLowerCase().includes('vector') && !node.name.toLowerCase().includes('arrow') && !node.name.toLowerCase().includes('line'));
  
  if (isInteresting) {
    log(`${indent}- ${node.name} (${node.type})${textContent}`);
  }
  
  // Traverse children
  const children = links[id];
  if (children) {
    // Sort children by their visual position (z_index or layout_inset_left/top)
    // to match left-to-right or top-to-bottom reading order.
    const sortedChildren = [...children].sort((a, b) => {
      const na = nodes[a];
      const nb = nodes[b];
      if (!na || !nb) return 0;
      
      const leftA = na.layout_inset_left || 0;
      const leftB = nb.layout_inset_left || 0;
      const topA = na.layout_inset_top || 0;
      const topB = nb.layout_inset_top || 0;
      
      // First sort by top position (approximate rows), then left position
      if (Math.abs(topA - topB) > 20) {
        return topA - topB;
      }
      return leftA - leftB;
    });
    
    for (const childId of sortedChildren) {
      traverse(childId, isInteresting ? indentLevel + 1 : indentLevel);
    }
  }
}

log('# SehatRecover Flowchart Structure\n');

for (const rootId of roots) {
  const name = flowNames[rootId] || nodes[rootId].name;
  log(`\n## ${name} (Node: ${rootId})`);
  traverse(rootId, 0);
}

fs.writeFileSync('renders/extracted_flows.md', output);
console.log('\nSaved structure to renders/extracted_flows.md');
