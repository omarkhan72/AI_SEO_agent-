import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawnSync } from 'child_process';

const BANNER = `
===================================================
   ⚡ SEO AGENT STUDIO - AUTOMATED SETUP WIZARD ⚡
===================================================
`;

function askQuestion(rl, query, defaultVal = '') {
  const prompt = defaultVal ? `${query} [${defaultVal}]: ` : `${query}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultVal);
    });
  });
}

async function main() {
  console.log(BANNER);

  // --- Step 1: Welcome & Environment Checks ---
  console.log("🔍 Running System Diagnostics...");
  console.log(`- Node.js version: ${process.version}`);
  
  const nodeMajorVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeMajorVersion < 18) {
    console.error("❌ Error: Node.js version 18.0.0 or higher is required.");
    process.exit(1);
  }
  console.log("✓ Node.js version is compatible.\n");

  // --- Step 2: Interactive Key Collection or Automated Fallback ---
  let port = "5000";
  let openaiKey = "mock_openai_key";
  let claudeKey = "mock_claude_key";
  let braveKey = "mock_brave_key";
  let firebaseProjectId = "seo-agent-saas";

  // Check if we are running in an interactive TTY session
  const isInteractive = process.stdin.isTTY || process.argv.includes('--interactive');

  if (isInteractive) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log("📝 Please configure your environment settings:");
    port = await askQuestion(rl, "Backend Server Port", "5000");
    openaiKey = await askQuestion(rl, "OpenAI API Key (sk-...)");
    claudeKey = await askQuestion(rl, "Claude API Key (sk-ant-...)");
    braveKey = await askQuestion(rl, "Brave Search API Key");
    firebaseProjectId = await askQuestion(rl, "Firebase Project ID", "seo-agent-saas");
    rl.close();
  } else {
    console.log("🤖 Non-interactive shell detected. Writing default/mock settings...");
  }

  // Create Backend .env contents
  const backendEnvContent = `# WARNING: Do not commit this file to Git / Version Control!
PORT=${port}
NODE_ENV=development
OPENAI_API_KEY=${openaiKey}
CLAUDE_API_KEY=${claudeKey}
BRAVE_SEARCH_API_KEY=${braveKey}
FIREBASE_PROJECT_ID=${firebaseProjectId}
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
`;

  // Create Frontend .env.local contents
  const frontendEnvContent = `VITE_API_URL=http://localhost:${port}
`;

  console.log("\n💾 Writing Configuration Files...");
  
  try {
    const backendEnvPath = path.join('backend', '.env');
    fs.writeFileSync(backendEnvPath, backendEnvContent, 'utf8');
    console.log(`✓ Created: ${backendEnvPath}`);
  } catch (err) {
    console.error("❌ Failed to write backend .env configuration:", err.message);
  }

  try {
    const frontendEnvPath = path.join('frontend', '.env.local');
    fs.writeFileSync(frontendEnvPath, frontendEnvContent, 'utf8');
    console.log(`✓ Created: ${frontendEnvPath}`);
  } catch (err) {
    console.error("❌ Failed to write frontend .env.local configuration:", err.message);
  }

  // --- Step 3: Dependency Installer Automation ---
  console.log("\n📦 Automating Package Installations (this may take a few moments)...");

  // Install backend packages
  console.log("\n[1/2] Installing Backend Dependencies...");
  const backendInstall = spawnSync('npm', ['install'], {
    cwd: 'backend',
    stdio: 'inherit',
    shell: true
  });

  if (backendInstall.status !== 0) {
    console.warn("⚠️ Warning: Backend packages installation returned non-zero status.");
  } else {
    console.log("✓ Backend dependencies installed successfully.");
  }

  // Install frontend packages
  console.log("\n[2/2] Installing Frontend Dependencies...");
  const frontendInstall = spawnSync('npm', ['install'], {
    cwd: 'frontend',
    stdio: 'inherit',
    shell: true
  });

  if (frontendInstall.status !== 0) {
    console.warn("⚠️ Warning: Frontend packages installation returned non-zero status.");
  } else {
    console.log("✓ Frontend dependencies installed successfully.");
  }

  // --- Step 4: Initial Profile Saver Check ---
  console.log("\n📋 Verifying Administrative Seeding Blueprint...");
  const configPath = path.join('backend', 'admin_config.json');
  if (fs.existsSync(configPath)) {
    console.log("✓ Seeding blueprint found. Baseline E-E-A-T configurations will seed automatically on first server boot.");
  } else {
    console.warn("⚠️ admin_config.json is missing. Please ensure it exists inside the backend folder.");
  }

  // --- Step 5: Completion Summary Dashboard ---
  console.log(`
===================================================
   🎉 SETUP COMPLETED SUCCESSFULLY!
===================================================

🚀 How to start your local SEO Agent Studio SaaS:

1. Start the Backend Server:
   $ cd backend
   $ node server.js

2. Start the React Frontend Dashboard:
   $ cd frontend
   $ npm run dev

===================================================
`);
}

main().catch(err => {
  console.error("❌ Setup Wizard encountered an unexpected crash:", err.message);
  process.exit(1);
});
