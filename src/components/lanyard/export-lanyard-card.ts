import { jsPDF } from "jspdf";

const cardWidth = 54;
const cardHeight = 86;
const gap = 4;

export async function exportLanyardCard(frontImage: string, backImage: string, memberId: string) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [cardWidth * 2 + gap, cardHeight],
    compress: true,
  });

  pdf.addImage(frontImage, "PNG", 0, 0, cardWidth, cardHeight);
  pdf.addImage(backImage, "PNG", cardWidth + gap, 0, cardWidth, cardHeight);
  pdf.save(`kartu-lanyard-${memberId}.pdf`);
}
