const FONNTE_TOKEN = process.env.NEXT_PUBLIC_FONNTE_TOKEN || "";

export const sendWhatsApp = async (target: string, message: string) => {
  if (!FONNTE_TOKEN) {
    console.warn("Fonnte Token not set. Skipping WhatsApp message.");
    return;
  }

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN,
      },
      body: new URLSearchParams({
        target,
        message,
        countryCode: "62", // Default to Indonesia
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("WhatsApp Error:", error);
  }
};

export const templates = {
  welcome: (name: string, packageName: string, sessions: number) => 
    `Halo *${name}*, selamat datang di Swimplash! 🏊‍♂️\n\nPaket *${packageName}* (${sessions} sesi) telah aktif. Terima kasih telah bergabung dengan kami!`,
    
  attendance: (name: string, sessionsLeft: number) => 
    `Halo *${name}*, terima kasih telah mengikuti sesi renang hari ini! 🏊‍♀️\n\nSisa sesi Anda: *${sessionsLeft} sesi*. Sampai jumpa di pertemuan berikutnya!`,
    
  payment: (name: string, amount: number, description: string) => 
    `Halo *${name}*, pembayaran sebesar *Rp ${amount.toLocaleString('id-ID')}* untuk ${description} telah kami terima. Terima kasih!`,
};
