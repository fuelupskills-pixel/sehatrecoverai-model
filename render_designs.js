const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rendersDir = path.join(__dirname, 'renders');
if (!fs.existsSync(rendersDir)) {
  fs.mkdirSync(rendersDir);
}

const jobs = [
  { file: 'sehatrecover flow.fig', node: '1:2713', out: 'flow_patient.png' },
  { file: 'sehatrecover flow.fig', node: '1:7482', out: 'flow_doctor.png' },
  { file: 'sehatrecover flow.fig', node: '1:8392', out: 'flow_pharmacy.png' },
  { file: 'sehatrecover flow.fig', node: '1:9222', out: 'flow_admin.png' },
  { file: 'sehatrecover flow.fig', node: '1:10352', out: 'flow_insurance.png' },
  
  { file: 'Figma file (Copy).fig', node: '1:2', out: 'home_desktop.png' },
  { file: 'Figma file (Copy).fig', node: '2:407', out: 'home_option2.png' },
  { file: 'Figma file (Copy).fig', node: '32:106', out: 'home_mobile.png' },
  { file: 'Figma file (Copy).fig', node: '137:2', out: 'home2_desktop.png' }
];

console.log('Starting render jobs...');

for (const job of jobs) {
  const outPath = path.join(rendersDir, job.out);
  console.log(`Rendering ${job.file} | Node: ${job.node} -> renders/${job.out}...`);
  try {
    // Run @grida/refig CLI
    const cmd = `npx @grida/refig "${job.file}" --node "${job.node}" --out "${outPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Successfully rendered: ${job.out}`);
  } catch (err) {
    console.error(`Failed to render ${job.out}:`, err.message);
  }
}

console.log('All render jobs completed!');
