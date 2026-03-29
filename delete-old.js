const fs = require('fs');

try {
  fs.unlinkSync('./src/data/know-more.ts');
  console.log('Deleted know-more.ts');
} catch (e) {
  console.error('could not delete know-more.ts', e);
}

try {
  fs.unlinkSync('./src/data/tools.ts');
  console.log('Deleted tools.ts');
} catch (e) {
  console.error('could not delete tools.ts', e);
}
