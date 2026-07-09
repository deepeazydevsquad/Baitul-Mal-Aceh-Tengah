const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/modules/**/*.vue');
console.log('Total vue files:', files.length);

const emptyStateRegex = /<template\s+#empty>\s*<div[^>]*>\s*(?:<!--.*?-->\s*)?<font-awesome-icon\s+icon="([^"]+)"[^>]*\/>\s*<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>(.*?)<\/p>\s*<\/div>\s*<\/template>/gs;

let replacedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let replaced = false;

  content = content.replace(emptyStateRegex, (match, icon, title, desc) => {
    replaced = true;
    return `<template #empty>
          <div class="empty-state-icon">
            <font-awesome-icon icon="${icon}" />
          </div>
          <p class="empty-state-title">${title.trim()}</p>
          <p class="empty-state-desc">${desc.trim()}</p>
        </template>`;
  });

  if (replaced) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    replacedCount++;
  }
}

console.log(`Updated ${replacedCount} files.`);
