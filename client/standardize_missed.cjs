const fs = require('fs');
const glob = require('glob');

const filesToProcess = [
  'src/modules/RiwayatPesanWhatsapp/RiwayatPesanWhatsapp.vue',
  'src/modules/RekapPengumpulan/CetakRekapPengumpulan.vue',
  'src/modules/RekapDistribusiPerKodeAsnaf/CetakRekapDistribusiPerKodeAsnaf.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafMualaf.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafMiskin.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafIbnuSabil.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafGharim.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafFilsabilillah.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafFakir.vue'
];

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

for (const file of filesToProcess) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    if (file.includes('RiwayatPesanWhatsapp')) {
        content = content.replace(/<td\s+(:colspan="[^"]+")[^>]*>\s*<font-awesome-icon\s+icon="([^"]+)"[^>]*\/>\s*<p[^>]*>\s*(.*?)\s*<\/p>\s*<\/td>/gs, (m, colspanProp, icon, desc) => {
            return generateHTML(colspanProp, icon, 'Tidak ada data', desc.trim().replace(/<\/?p[^>]*>/g, ''));
        });
    } else {
        // Cetak files have just <td colspan="X" class="..."> Text </td>
        content = content.replace(/<td\s+(colspan="?[^"]+"?)[^>]*>\s*(?:<p[^>]*>)?\s*(.*?)\s*(?:<\/p>)?\s*<\/td>/g, (m, colspanProp, text) => {
            // Some text might have HTML tags, strip them
            let cleanText = text.trim().replace(/<\/?[^>]+(>|$)/g, "");
            return generateHTML(colspanProp, 'fa-solid fa-print', 'Tidak ada data', cleanText);
        });
    }

    fs.writeFileSync(file, content);
    console.log(`Standardized ${file}`);
}
