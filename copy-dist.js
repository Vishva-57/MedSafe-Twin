const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'client', 'dist');
const targetDir = path.resolve(__dirname, 'dist');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(srcDir, targetDir, { recursive: true });
  console.log('Successfully mirrored client/dist to root dist/');
} else {
  console.error('client/dist not found! Run client build first.');
}
