const fs = require('fs-extra');
const path = require('path');

async function copyStaticFiles() {
  try {
    console.log('Copying static files for standalone deployment...');
    
    const sourceStatic = path.join(__dirname, '.next', 'static');
    const targetStatic = path.join(__dirname, '.next', 'standalone', '.next', 'static');
    
    const sourcePublic = path.join(__dirname, 'public');
    const targetPublic = path.join(__dirname, '.next', 'standalone', 'public');
    
    // Copy .next/static
    if (fs.existsSync(sourceStatic)) {
      await fs.copy(sourceStatic, targetStatic);
      console.log('✓ Copied .next/static to standalone/.next/static');
    } else {
      console.log('⚠ .next/static not found');
    }
    
    // Copy public folder
    if (fs.existsSync(sourcePublic)) {
      await fs.copy(sourcePublic, targetPublic);
      console.log('✓ Copied public to standalone/public');
    } else {
      console.log('⚠ public folder not found');
    }
    
    console.log('✅ Static files copy completed successfully!');
  } catch (error) {
    console.error('❌ Error copying static files:', error);
    process.exit(1);
  }
}

copyStaticFiles();