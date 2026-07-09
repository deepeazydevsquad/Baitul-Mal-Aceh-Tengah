const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/modules/**/*.vue');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<template #empty>') && !content.includes('class="empty-state-icon"')) {
     console.log(file);
  }
}
