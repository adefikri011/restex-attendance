import type { jsPDF } from "jspdf";

async function waitForImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      if (image.complete) {
        throw new Error("Gambar kartu gagal dimuat untuk ekspor.");
      }

      await new Promise<void>((resolve, reject) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener(
          "error",
          () => reject(new Error("Gambar kartu gagal dimuat untuk ekspor.")),
          { once: true },
        );
      });
    }),
  );
}

async function renderCardFace(source: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas");
  const bounds = source.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;
  const wrapper = document.createElement("div");

  Object.assign(wrapper.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    overflow: "hidden",
    pointerEvents: "none",
  });

  Object.assign(clone.style, {
    position: "relative",
    inset: "auto",
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    transform: "none",
    backfaceVisibility: "visible",
    WebkitBackfaceVisibility: "visible",
  });

  wrapper.append(clone);
  document.body.append(wrapper);

  try {
    await waitForImages(clone);
    await document.fonts.ready;

    const canvas = await html2canvas(clone, {
      backgroundColor: "#f5f4ef",
      scale: 3,
      useCORS: true,
      logging: false,
    });

    return canvas.toDataURL("image/jpeg", 0.96);
  } finally {
    wrapper.remove();
  }
}

function createFileName(memberId: string) {
  const safeId = memberId.replace(/[^a-z0-9_-]/gi, "");
  return `restex-kartu-${safeId || "anggota"}.pdf`;
}

export async function exportLanyardCard(
  frontFace: HTMLElement,
  backFace: HTMLElement,
  memberId: string,
) {
  const [{ jsPDF }, frontImage, backImage] = await Promise.all([
    import("jspdf"),
    renderCardFace(frontFace),
    renderCardFace(backFace),
  ]);
  const pdf: jsPDF = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [112, 86],
    compress: true,
  });

  pdf.addImage(frontImage, "JPEG", 0, 0, 54, 86);
  pdf.addImage(backImage, "JPEG", 58, 0, 54, 86);
  const file = pdf.output("blob");
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = createFileName(memberId);
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}
