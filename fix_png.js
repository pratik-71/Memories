const fs = require('fs');
const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync('android/app/src/main/res/drawable/since_preview.png', buffer);
console.log('Created 1x1 pixel PNG');
