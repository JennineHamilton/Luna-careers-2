#!/usr/bin/env node

/**
 * Luna Design System Export Script
 * 
 * This script helps export the Luna Design System to another project.
 * 
 * Usage:
 *   node scripts/export-design-system.js [destination-path] [--minimal|--full|--custom]
 * 
 * Examples:
 *   node scripts/export-design-system.js ../my-new-project --full
 *   node scripts/export-design-system.js ../my-new-project --minimal
 */

const fs = require('fs');
const path = require('path');

// Configuration
const EXPORT_CONFIGS = {
  minimal: {
    name: 'Minimal (Core Components Only)',
    components: [
      'button.tsx',
      'card.tsx',
      'input.tsx',
      'badge.tsx',
      'dialog.tsx',
      'separator.tsx',
      'index.ts',
    ],
    utils: ['utils.ts', 'utils/formatters.ts'],
    includeStyles: true,
  },
  forms: {
    name: 'Form Components',
    components: [
      'button.tsx',
      'input.tsx',
      'textarea.tsx',
      'select.tsx',
      'checkbox.tsx',
      'radio.tsx',
      'switch.tsx',
      'date-picker.tsx',
      'file-upload.tsx',
      'searchable-select.tsx',
      'phone-input.tsx',
      'multi-text-input.tsx',
      'tag-input.tsx',
      'index.ts',
    ],
    utils: ['utils.ts', 'utils/formatters.ts'],
    includeStyles: true,
  },
  dataDisplay: {
    name: 'Data Display Components',
    components: [
      'data-table.tsx',
      'data-table-toolbar.tsx',
      'badge.tsx',
      'avatar.tsx',
      'stats-card.tsx',
      'timeline.tsx',
      'progress.tsx',
      'skeleton.tsx',
      'empty-state.tsx',
      'chart.tsx',
      'index.ts',
    ],
    utils: ['utils.ts', 'utils/formatters.ts'],
    includeStyles: true,
  },
  full: {
    name: 'Full Design System (All Components)',
    components: '*', // All files
    utils: '*', // All utils
    includeStyles: true,
  },
};

// Helper functions
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied: ${path.basename(src)}`);
}

function copyDirectory(src, dest, filter = null) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath, filter);
    } else {
      if (!filter || filter(entry.name)) {
        copyFile(srcPath, destPath);
      }
    }
  }
}

function exportDesignSystem(destPath, config) {
  const sourcePath = process.cwd();
  
  console.log(`\n🎨 Exporting Luna Design System: ${config.name}`);
  console.log(`📁 Destination: ${destPath}\n`);

  // Create destination directories
  const destComponents = path.join(destPath, 'components', 'luna');
  const destLib = path.join(destPath, 'lib');
  const destApp = path.join(destPath, 'app');

  // Export components
  console.log('📦 Exporting components...');
  const srcComponents = path.join(sourcePath, 'components', 'luna');
  
  if (config.components === '*') {
    copyDirectory(srcComponents, destComponents);
  } else {
    fs.mkdirSync(destComponents, { recursive: true });
    config.components.forEach(file => {
      const srcFile = path.join(srcComponents, file);
      const destFile = path.join(destComponents, file);
      if (fs.existsSync(srcFile)) {
        copyFile(srcFile, destFile);
      }
    });
  }

  // Export utilities
  console.log('\n🔧 Exporting utilities...');
  const srcLib = path.join(sourcePath, 'lib');
  
  if (config.utils === '*') {
    copyDirectory(srcLib, destLib);
  } else {
    config.utils.forEach(utilPath => {
      const srcFile = path.join(srcLib, utilPath);
      const destFile = path.join(destLib, utilPath);
      if (fs.existsSync(srcFile)) {
        if (fs.statSync(srcFile).isDirectory()) {
          copyDirectory(srcFile, destFile);
        } else {
          copyFile(srcFile, destFile);
        }
      }
    });
  }

  // Export styles
  if (config.includeStyles) {
    console.log('\n🎨 Exporting styles...');
    
    // Copy Tailwind config
    const srcTailwind = path.join(sourcePath, 'tailwind.config.ts');
    const destTailwind = path.join(destPath, 'tailwind.config.ts');
    copyFile(srcTailwind, destTailwind);

    // Copy globals.css
    const srcGlobals = path.join(sourcePath, 'app', 'globals.css');
    const destGlobals = path.join(destApp, 'globals.css');
    copyFile(srcGlobals, destGlobals);
  }

  console.log('\n✅ Export complete!\n');
  console.log('📋 Next steps:');
  console.log('1. Install dependencies (see LUNA_DESIGN_SYSTEM_EXPORT_GUIDE.md)');
  console.log('2. Import globals.css in your root layout');
  console.log('3. Configure path aliases in tsconfig.json');
  console.log('4. Start using Luna components!\n');
}

// Main execution
const args = process.argv.slice(2);
const destPath = args[0];
const configType = args[1]?.replace('--', '') || 'full';

if (!destPath) {
  console.error('❌ Error: Destination path required');
  console.log('\nUsage: node scripts/export-design-system.js [destination-path] [--minimal|--full|--forms|--dataDisplay]');
  process.exit(1);
}

const config = EXPORT_CONFIGS[configType];
if (!config) {
  console.error(`❌ Error: Unknown config type "${configType}"`);
  console.log('\nAvailable configs: minimal, forms, dataDisplay, full');
  process.exit(1);
}

exportDesignSystem(destPath, config);

