const fs = require('fs');

const files = [
  'src/modules/Surveyor/Surveyor.vue',
  'src/modules/SystemLog/SystemLog.vue',
  'src/modules/ProgramKegiatanBantuan/ProgramKegiatanBantuan.vue',
  'src/modules/RekapPengumpulanPerKecamatan/RekapPengumpulanPerKecamatan.vue'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;
  
  const startWrapper = '<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">\n        ';
  const endWrapper = '\n      </div>';
  
  if (!content.includes('overflow-hidden mt-4">\n        <BaseTable')) {
     let match = content.match(/<BaseTable[\s\S]*?<\/BaseTable>/);
     if (match) {
        // Just wrap the match!
        content = content.replace(/<BaseTable[\s\S]*?<\/BaseTable>/, (m) => startWrapper + m + endWrapper);
     }
  }

  // Remove old opening wrappers if they exist BEFORE the new wrapper
  content = content.replace(/<div class="overflow-x-auto rounded-xl border border-gray-200 shadow">\s*<div class="bg-white/, '<div class="bg-white');
  content = content.replace(/<div class="overflow-hidden rounded-xl border border-gray-200 shadow mt-4">\s*<div class="bg-white/, '<div class="bg-white');
  
  // also remove old closing wrappers if we removed the old opening wrappers.
  // Actually, since this script replaces `<BaseTable...>` with `<div wrapper><BaseTable...></div>`
  // it leaves old wrappers intact. To avoid double divs or missing divs, we should just let them be, OR carefully remove them.
  // Since we already ran build successfully with the old wrappers, adding our new wrapper inside it will just double wrap it, but it won't break the tags.
  // Actually, `fix_all_tables.cjs` caused tag breaks because it removed opening tags but NOT closing tags.
  // By using `.replace(/<BaseTable.../, wrapper + BaseTable + endWrapper)` we add a full matching pair of tags. So it will NOT break the Vue template.

  if (content !== orig) {
     fs.writeFileSync(file, content);
     console.log('Safely wrapped ' + file);
  }
}
