const fs = require('fs');
let file = 'src/modules/PertanyaanMonev/PertanyaanMonev.vue';
let content = fs.readFileSync(file, 'utf8');

function generateHTML(colspanProp, icon, title, desc) {
    let iconHTML = icon 
        ? `<font-awesome-icon icon="${icon}" class="text-4xl" />`
        : `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>`;
        
    return `<td ${colspanProp} class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      ${iconHTML}
                    </div>
                    <p class="empty-state-title">${title}</p>
                    <p class="empty-state-desc">${desc}</p>
                  </div>
                </td>`;
}

// First empty state:
content = content.replace(/<td\s+(:colspan="[^"]+")[^>]*>\s*Tidak ada pertanyaan untuk bagian ini\.\s*<\/td>/g, (m, colspanProp) => {
    return generateHTML(colspanProp, '', 'Tidak ada data', 'Tidak ada pertanyaan untuk bagian ini.');
});

// Second empty state:
content = content.replace(/<td\s+(:colspan="[^"]+")[^>]*>\s*<font-awesome-icon\s+icon="([^"]+)"[^>]*\/>\s*<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>\s*(.*?)\s*<\/p>\s*<\/td>/gs, (m, colspanProp, icon, title, desc) => {
    return generateHTML(colspanProp, icon, title, desc.trim().replace(/<\/?p[^>]*>/g, ''));
});

fs.writeFileSync(file, content);
console.log('Fixed PertanyaanMonev.vue');
