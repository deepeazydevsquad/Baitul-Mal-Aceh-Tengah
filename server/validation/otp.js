const validation = {};

/* 
    Fungsi untuk mengecek nomor whatsapp
*/
validation.check_whatsappnumber = async (whatsappNumber) => {
    const normalized = String(whatsappNumber || "")
        .replace(/\D/g, "")
        .replace(/^62/, "0")
        .replace(/^8/, "08");
    if (!/^(08)\d{8,10}$/.test(normalized)) {
        throw new Error(
            "Nomor WhatsApp harus berformat Indonesia (08) dan memiliki 10-12 digit."
        );
    }
    return true;
};

module.exports = validation;
