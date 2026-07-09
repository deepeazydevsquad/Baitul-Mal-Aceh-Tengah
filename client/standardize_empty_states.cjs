const fs = require('fs');

const filesToProcess = [
  'src/modules/template_table.vue',
  'src/modules/ValidasiPermohonanBantuan/ValidasiPermohonanBantuan.vue',
  'src/modules/TemplatePesanWhatsapp/TemplatePesanWhatsapp.vue',
  'src/modules/TargetPengumpulan/TargetPengumpulan.vue',
  'src/modules/TargetDistribusi/TargetDistribusi.vue',
  'src/modules/SystemLogSurveyor/SystemLogSurveyor.vue',
  'src/modules/Syarat/syarat.vue',
  'src/modules/RunningText/RunningText.vue',
  'src/modules/PertanyaanMonev/PertanyaanMonev.vue'
];

function generateHTML(colspan, icon, title, desc) {
    let iconHTML = '';
    if (icon) {
        iconHTML = `<font-awesome-icon icon="${icon}" class="text-4xl" />`;
    } else {
        iconHTML = `<svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="1.5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>`;
    }
    
    return `<td ${colspan.includes(':') ? '' : 'colspan="'}${colspan}${colspan.includes(':') ? '' : '"'} class="empty-state-cell">
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

    // Handle PertanyaanMonev.vue which has two!
    if (file.includes('PertanyaanMonev.vue')) {
        content = content.replace(/<td\s+:colspan="(.*?)"[^>]*>\s*Tidak ada pertanyaan untuk bagian ini\.\s*<\/td>/g, (m, colspan) => {
            return generateHTML(':' + colspan + '="'+colspan+'"', '', 'Tidak ada data', 'Tidak ada pertanyaan untuk bagian ini.');
        });
        content = content.replace(/<td\s+:colspan="(.*?)"[^>]*>\s*<font-awesome-icon\s+icon="([^"]+)"[^>]*\/>\s*<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>\s*(.*?)\s*<\/p>\s*<\/td>/gs, (m, colspan, icon, title, desc) => {
            return generateHTML(':' + colspan + '="'+colspan+'"', icon, title, desc);
        });
    } else {
        // Standard replacement for others
        const regex = /<td\s+(:?colspan="?[^"]+"?)[^>]*>\s*(?:<font-awesome-icon[^>]*icon="([^"]+)"[^>]*\/>)?\s*(?:<h3[^>]*>(.*?)<\/h3>)?\s*(?:<p[^>]*>)?\s*(.*?)\s*(?:<\/p>)?\s*<\/td>/gi;
        
        content = content.replace(regex, (match, colspanProp, icon, title, descText) => {
            // Clean up text
            let titleText = title ? title.trim() : 'Tidak ada data';
            
            // For SystemLogSurveyor: "Belum ada data."
            // For Syarat: "<p>Belum ada syarat.</p>" -> the regex captures <p>Belum ada syarat.</p> in descText. 
            // Wait, I made regex `<p[^>]*>` optional, so it matches the inner text.
            let desc = descText.replace(/<\/?[^>]+(>|$)/g, "").trim(); 
            if (!desc || desc.length > 200) desc = "Belum ada data tersedia atau coba gunakan kata kunci lain.";
            
            // Clean colspanProp (it might be `:colspan="totalColumns"` or `colspan="4"`)
            let colspan = colspanProp;
            // The generateHTML function expects just the value, OR if it has :, it will just inject it raw.
            // Let's modify generateHTML to just take the raw prop string!
            let iconStr = icon || '';
            
            let iconHTML = '';
            if (iconStr) {
                iconHTML = `<font-awesome-icon icon="${iconStr}" class="text-4xl" />`;
            } else {
                iconHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>`;
            }
            
            return `<td ${colspanProp} class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      ${iconHTML}
                    </div>
                    <p class="empty-state-title">${titleText}</p>
                    <p class="empty-state-desc">${desc}</p>
                  </div>
                </td>`;
        });
    }

    fs.writeFileSync(file, content);
    console.log(`Standardized ${file}`);
}
