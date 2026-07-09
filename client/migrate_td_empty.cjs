const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/modules/**/*.vue');
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // We are looking for <td colspan="X" ... > Data tidak ditemukan </td>
  const regex = /<td\s+colspan="([^"]+)"[^>]*>\s*(Data tidak ditemukan|Belum ada data|Tidak ada data|Data Laporan tidak ditemukan|Data Kosong|Belum ada data riwayat infaq|Belum ada data riwayat donasi|Tidak Ada Data)\s*<\/td>/gi;

  if (regex.test(content)) {
    content = content.replace(regex, (match, colspan, text) => {
      // Get the title based on matched text or default it
      let title = "Tidak ada data";
      if (text.toLowerCase().includes("tidak ditemukan")) {
         title = "Data tidak ditemukan";
      }

      return `<td colspan="${colspan}" class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      <svg
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
                      </svg>
                    </div>
                    <p class="empty-state-title">${title}</p>
                    <p class="empty-state-desc">Belum ada data tersedia atau coba gunakan kata kunci lain.</p>
                  </div>
                </td>`;
    });

    fs.writeFileSync(file, content);
    console.log(`Updated empty state inside tbody: ${file}`);
    count++;
  }
}
console.log(`Updated ${count} files.`);
