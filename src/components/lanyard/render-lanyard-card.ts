import type { LanyardCardDetails } from "./types";

const artworkWidth = 1004;
const artworkHeight = 1600;
type Point = readonly [x: number, y: number];

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gambar kartu gagal dimuat."));
    image.src = source;
  });
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function fillCardQuad(
  context: CanvasRenderingContext2D,
  points: Point[],
  color: string,
) {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

function getInverseHomography(quad: Point[]) {
  const sourceCorners: Point[] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  const equations: number[][] = [];

  for (const [index, [x, y]] of quad.entries()) {
    const [u, v] = sourceCorners[index];
    equations.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    equations.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }

  for (let column = 0; column < 8; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < 8; row += 1) {
      if (Math.abs(equations[row][column]) > Math.abs(equations[pivotRow][column])) {
        pivotRow = row;
      }
    }

    if (Math.abs(equations[pivotRow][column]) < 0.000001) {
      throw new Error("Bingkai foto kartu tidak valid.");
    }

    [equations[column], equations[pivotRow]] = [equations[pivotRow], equations[column]];
    const pivot = equations[column][column];
    for (let entry = column; entry <= 8; entry += 1) {
      equations[column][entry] /= pivot;
    }

    for (let row = 0; row < 8; row += 1) {
      if (row === column) continue;
      const factor = equations[row][column];
      for (let entry = column; entry <= 8; entry += 1) {
        equations[row][entry] -= factor * equations[column][entry];
      }
    }
  }

  return equations.map((equation) => equation[8]);
}

function drawImageIntoQuad(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  quad: Point[],
  sourceRect: { x: number; y: number; width: number; height: number },
) {
  const minX = Math.floor(Math.min(...quad.map(([x]) => x)));
  const minY = Math.floor(Math.min(...quad.map(([, y]) => y)));
  const maxX = Math.ceil(Math.max(...quad.map(([x]) => x)));
  const maxY = Math.ceil(Math.max(...quad.map(([, y]) => y)));
  const outputScale = 2;
  const outputWidth = (maxX - minX) * outputScale;
  const outputHeight = (maxY - minY) * outputScale;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) throw new Error("Canvas tidak dapat dibuat untuk merender gambar kartu.");

  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = Math.max(1, Math.ceil(sourceRect.width));
  textureCanvas.height = Math.max(1, Math.ceil(sourceRect.height));
  const textureContext = textureCanvas.getContext("2d", { willReadFrequently: true });
  if (!textureContext) throw new Error("Canvas sumber gambar tidak dapat dibuat.");
  textureContext.imageSmoothingEnabled = true;
  textureContext.imageSmoothingQuality = "high";
  textureContext.drawImage(
    image,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    textureCanvas.width,
    textureCanvas.height,
  );
  const texture = textureContext.getImageData(0, 0, textureCanvas.width, textureCanvas.height);
  const output = outputContext.createImageData(outputWidth, outputHeight);
  const sourceWidth = textureCanvas.width;
  const sourceHeight = textureCanvas.height;
  const sourcePixels = texture.data;
  const outputPixels = output.data;
  const homography = getInverseHomography(quad);

  for (let y = 0; y < outputHeight; y += 1) {
    const targetY = minY + (y + 0.5) / outputScale;
    for (let x = 0; x < outputWidth; x += 1) {
      const targetX = minX + (x + 0.5) / outputScale;
      const denominator =
        homography[6] * targetX + homography[7] * targetY + 1;
      if (Math.abs(denominator) < 0.000001) continue;
      const u =
        (homography[0] * targetX + homography[1] * targetY + homography[2]) /
        denominator;
      const v =
        (homography[3] * targetX + homography[4] * targetY + homography[5]) /
        denominator;

      if (u < 0 || u > 1 || v < 0 || v > 1) continue;

      const sourceX = u * (sourceWidth - 1);
      const sourceY = v * (sourceHeight - 1);
      const x0 = Math.floor(sourceX);
      const y0 = Math.floor(sourceY);
      const x1 = Math.min(sourceWidth - 1, x0 + 1);
      const y1 = Math.min(sourceHeight - 1, y0 + 1);
      const xWeight = sourceX - x0;
      const yWeight = sourceY - y0;
      const outputOffset = (y * outputWidth + x) * 4;

      for (let channel = 0; channel < 4; channel += 1) {
        const top = sourcePixels[(y0 * sourceWidth + x0) * 4 + channel] * (1 - xWeight) +
          sourcePixels[(y0 * sourceWidth + x1) * 4 + channel] * xWeight;
        const bottom = sourcePixels[(y1 * sourceWidth + x0) * 4 + channel] * (1 - xWeight) +
          sourcePixels[(y1 * sourceWidth + x1) * 4 + channel] * xWeight;
        outputPixels[outputOffset + channel] = top * (1 - yWeight) + bottom * yWeight;
      }
    }
  }

  outputContext.putImageData(output, 0, 0);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(outputCanvas, minX, minY, maxX - minX, maxY - minY);
  context.restore();
}

function drawFeatheredPatch(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const patch = document.createElement("canvas");
  patch.width = width;
  patch.height = height;
  const patchContext = patch.getContext("2d");
  if (!patchContext) throw new Error("Canvas tidak dapat dibuat untuk merender teks kartu.");

  patchContext.fillStyle = "#092d43";
  patchContext.fillRect(0, 0, width, height);

  const horizontal = patchContext.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, "rgba(0, 0, 0, 0)");
  horizontal.addColorStop(0.06, "rgba(0, 0, 0, 1)");
  horizontal.addColorStop(0.94, "rgba(0, 0, 0, 1)");
  horizontal.addColorStop(1, "rgba(0, 0, 0, 0)");
  patchContext.globalCompositeOperation = "destination-in";
  patchContext.fillStyle = horizontal;
  patchContext.fillRect(0, 0, width, height);

  const vertical = patchContext.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, "rgba(0, 0, 0, 0)");
  vertical.addColorStop(0.15, "rgba(0, 0, 0, 1)");
  vertical.addColorStop(0.85, "rgba(0, 0, 0, 1)");
  vertical.addColorStop(1, "rgba(0, 0, 0, 0)");
  patchContext.globalCompositeOperation = "destination-in";
  patchContext.fillStyle = vertical;
  patchContext.fillRect(0, 0, width, height);

  context.drawImage(patch, x, y);
}

function drawFittedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  maxFontSize: number,
  fontFamily: string,
  color: string,
) {
  let fontSize = maxFontSize;
  context.font = `700 ${fontSize}px ${fontFamily}`;
  while (context.measureText(value).width > maxWidth && fontSize > 16) {
    fontSize -= 1;
    context.font = `700 ${fontSize}px ${fontFamily}`;
  }
  context.fillStyle = color;
  context.fillText(value, x, y, maxWidth);
}

function drawMemberPhoto(
  context: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  name: string,
) {
  const photoFrame: Point[] = [
    [432, 460],
    [881, 460],
    [941, 1054],
    [491, 1098],
  ];

  if (photo) {
    const topWidth = Math.hypot(photoFrame[1][0] - photoFrame[0][0], photoFrame[1][1] - photoFrame[0][1]);
    const bottomWidth = Math.hypot(photoFrame[2][0] - photoFrame[3][0], photoFrame[2][1] - photoFrame[3][1]);
    const leftHeight = Math.hypot(photoFrame[3][0] - photoFrame[0][0], photoFrame[3][1] - photoFrame[0][1]);
    const rightHeight = Math.hypot(photoFrame[2][0] - photoFrame[1][0], photoFrame[2][1] - photoFrame[1][1]);
    const frameAspect = (topWidth + bottomWidth) / (leftHeight + rightHeight);
    const photoAspect = photo.width / photo.height;
    const sourceWidth = photoAspect > frameAspect ? photo.height * frameAspect : photo.width;
    const sourceHeight = photoAspect > frameAspect ? photo.height : photo.width / frameAspect;
    const sourceX = (photo.width - sourceWidth) / 2;
    const sourceY = (photo.height - sourceHeight) / 2;
    drawImageIntoQuad(context, photo, photoFrame, {
      x: sourceX,
      y: sourceY,
      width: sourceWidth,
      height: sourceHeight,
    });
  } else {
    fillCardQuad(context, photoFrame, "#173b52");
    const centerX = photoFrame.reduce((total, point) => total + point[0], 0) / photoFrame.length;
    const centerY = photoFrame.reduce((total, point) => total + point[1], 0) / photoFrame.length;
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toLocaleUpperCase("id");
    context.fillStyle = "#f5f7f7";
    context.font = "700 130px Arial, Helvetica, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(initials || "FOTO", centerX, centerY);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
  }
}

function drawFront(
  artwork: HTMLImageElement,
  photo: HTMLImageElement | null,
  qr: HTMLImageElement | null,
  details: LanyardCardDetails,
  divisionLabel: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = artworkWidth;
  canvas.height = artworkHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak dapat dibuat untuk kartu.");

  context.drawImage(artwork, 0, 0, artworkWidth, artworkHeight);

  drawMemberPhoto(context, photo, details.name);

  drawFeatheredPatch(context, 15, 467, 360, 76);
  context.textBaseline = "middle";
  drawFittedText(
    context,
    divisionLabel.toLocaleUpperCase("id"),
    28,
    505,
    320,
    48,
    '"Arial Narrow", Impact, Arial, sans-serif',
    "#f6f7f5",
  );

  drawFeatheredPatch(context, 15, 706, 360, 74);
  drawFittedText(
    context,
    details.nim || "—",
    28,
    744,
    320,
    54,
    '"Arial Narrow", Impact, Arial, sans-serif',
    "#f6f7f5",
  );

  context.fillStyle = "#092d43";
  roundedRect(context, 68, 1337, 868, 90, 14);
  context.fill();
  context.textAlign = "center";
  drawFittedText(
    context,
    details.name.trim().toLocaleUpperCase("id") || "NAMA ANGGOTA",
    artworkWidth / 2,
    1382,
    830,
    54,
    "Arial, Helvetica, sans-serif",
    "#f6f7f5",
  );
  context.textAlign = "start";

  const memberInfoPanel: Point[] = [
    [500, 1098],
    [829, 1065],
    [850, 1241],
    [516, 1275],
  ];
  const memberInfo = document.createElement("canvas");
  memberInfo.width = 660;
  memberInfo.height = 360;
  const memberInfoContext = memberInfo.getContext("2d");
  if (!memberInfoContext) {
    throw new Error("Canvas tidak dapat dibuat untuk merender kode anggota.");
  }
  memberInfoContext.fillStyle = "#f2f1ef";
  memberInfoContext.fillRect(0, 0, memberInfo.width, memberInfo.height);
  memberInfoContext.textAlign = "center";
  memberInfoContext.textBaseline = "middle";
  drawFittedText(
    memberInfoContext,
    "KODE ANGGOTA",
    memberInfo.width / 2,
    105,
    610,
    88,
    'Impact, "Arial Narrow", Arial, sans-serif',
    "#123950",
  );
  drawFittedText(
    memberInfoContext,
    details.id.toLocaleUpperCase("id"),
    memberInfo.width / 2,
    260,
    570,
    62,
    'Impact, "Arial Narrow", Arial, sans-serif',
    "#123950",
  );
  drawImageIntoQuad(context, memberInfo, memberInfoPanel, {
    x: 0,
    y: 0,
    width: memberInfo.width,
    height: memberInfo.height,
  });

  const qrPanel: Point[] = [
    [837, 1083],
    [966, 1073],
    [979, 1205],
    [849, 1217],
  ];
  fillCardQuad(context, qrPanel, "#f2f2f0");
  if (qr) {
    context.save();
    context.imageSmoothingEnabled = false;
    const qrImage: Point[] = [
      [843, 1089],
      [960, 1079],
      [972, 1199],
      [853, 1210],
    ];
    drawImageIntoQuad(context, qr, qrImage, {
      x: 0,
      y: 0,
      width: qr.width,
      height: qr.height,
    });
    context.restore();
  }

  return canvas.toDataURL("image/png");
}

function drawBack(artwork: HTMLImageElement, memberCode: string) {
  const canvas = document.createElement("canvas");
  canvas.width = artworkWidth;
  canvas.height = artworkHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak dapat dibuat untuk kartu.");

  context.drawImage(artwork, 0, 0, artworkWidth, artworkHeight);
  context.fillStyle = "#ffffff";
  context.fillRect(266, 1302, 472, 62);
  context.fillStyle = "#153950";
  context.font = "700 32px Arial, Helvetica, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const code = memberCode.toLocaleUpperCase("id");
  const letterSpacing = 7;
  const codeWidth =
    [...code].reduce((width, character) => width + context.measureText(character).width, 0) +
    Math.max(0, code.length - 1) * letterSpacing;
  let x = artworkWidth / 2 - codeWidth / 2;
  for (const character of code) {
    context.fillText(character, x + context.measureText(character).width / 2, 1333);
    x += context.measureText(character).width + letterSpacing;
  }

  return canvas.toDataURL("image/png");
}

export async function renderLanyardCard(
  details: LanyardCardDetails,
  photoUrl: string,
  qrDataUrl: string,
) {
  const [frontArtwork, backArtwork, photo, qr] = await Promise.all([
    loadImage("/assets/LanyardCard/depan.jpeg"),
    loadImage("/assets/LanyardCard/belakang.jpeg"),
    photoUrl ? loadImage(photoUrl) : Promise.resolve(null),
    qrDataUrl ? loadImage(qrDataUrl) : Promise.resolve(null),
  ]);
  const divisionLabels: Record<string, string> = {
    "Software Development": "PROGRAMMING",
    "Network & Security": "NETWORKING",
    "UI/UX Design": "UI/UX DESIGN",
    "Research & Development": "R&D",
  };
  const divisionLabel = divisionLabels[details.division] ?? details.division;

  return {
    front: drawFront(frontArtwork, photo, qr, details, divisionLabel),
    back: drawBack(backArtwork, details.id),
  };
}
