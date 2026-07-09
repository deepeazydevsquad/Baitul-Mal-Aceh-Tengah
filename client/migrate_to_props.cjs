const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/modules/**/*.vue');

let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Match the entire template #empty block
  const emptyBlockRegex = /<template\s+#empty>[\s\S]*?<\/template>/;
  const match = content.match(emptyBlockRegex);

  if (match) {
    const emptyBlock = match[0];

    // Extract icon, title, desc
    let iconMatch = emptyBlock.match(/<font-awesome-icon[^>]*icon="([^"]+)"/);
    let titleMatch = emptyBlock.match(/<h3[^>]*>(.*?)<\/h3>/) || emptyBlock.match(/<p[^>]*class="empty-state-title"[^>]*>(.*?)<\/p>/);
    let descMatch = emptyBlock.match(/<p[^>]*>(.*?)<\/p>/) && !emptyBlock.match(/<p[^>]*class="empty-state-title"[^>]*>(.*?)<\/p>/) 
                    ? emptyBlock.match(/<p[^>]*>(.*?)<\/p>/) // this matches the first <p> which could be title if we aren't careful, but since we check class above...
                    : null;
    
    // Better description extraction
    if (!descMatch) {
       // if it has empty-state-desc
       descMatch = emptyBlock.match(/<p[^>]*class="empty-state-desc"[^>]*>(.*?)<\/p>/);
    }
    if (!descMatch) {
       // just find all <p> and take the last one or one without title
       let allP = [...emptyBlock.matchAll(/<p[^>]*>(.*?)<\/p>/g)];
       if (allP.length > 0) {
           descMatch = allP[allP.length - 1]; // take last p
       }
    }

    let icon = iconMatch ? iconMatch[1] : '';
    let title = titleMatch ? titleMatch[1].trim() : 'Data tidak ditemukan';
    let desc = descMatch ? descMatch[1].trim() : 'Belum ada data tersedia.';

    // Remove the empty block
    content = content.replace(emptyBlockRegex, '');

    // Inject props into <BaseTable
    // Find <BaseTable and add props
    const baseTableRegex = /<BaseTable(\s|>)/;
    
    let propsToInject = ``;
    if (title) propsToInject += `\n          empty-title="${title}"`;
    if (desc) propsToInject += `\n          empty-desc="${desc}"`;
    if (icon) propsToInject += `\n          empty-icon="${icon}"`;
    
    content = content.replace(baseTableRegex, `<BaseTable${propsToInject}$1`);

    fs.writeFileSync(file, content);
    console.log(`Migrated ${file}`);
    updatedCount++;
  }
}

console.log(`Total files migrated to props: ${updatedCount}`);
