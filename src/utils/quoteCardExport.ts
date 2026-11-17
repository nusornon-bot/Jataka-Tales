import { DailyWisdomData } from '../components/DailyJatakaWisdom';

function wrapTextThai(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const segmenter =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? new Intl.Segmenter('th', { granularity: 'word' })
      : null;

  const tokens = segmenter
    ? Array.from(segmenter.segment(text), (s) => s.segment)
    : Array.from(text);

  const lines: string[] = [];
  let currentLine = '';

  for (const token of tokens) {
    if (token === '\n') {
      if (currentLine.trim()) lines.push(currentLine.trimEnd());
      currentLine = '';
      continue;
    }
    const candidate = currentLine + token;
    if (ctx.measureText(candidate).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine.trimEnd());
      currentLine = token.trimStart();
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trimEnd());
  }
  return lines;
}

export async function renderWisdomCardBlob(
  wisdom: DailyWisdomData,
  variant: 'ivory' | 'indigo' = 'ivory'
): Promise<Blob> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font loading wait errors
    }
  }

  const width = 1200;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('ไม่สามารถสร้าง Canvas สำหรับการ์ดข้อคิดได้');
  }

  const isDark = variant === 'indigo';
  const bgTop = isDark ? '#141B2D' : '#FAF8F3';
  const bgBottom = isDark ? '#0D1321' : '#F2ECE0';
  const borderColor = isDark ? '#B45309' : '#D6CEBE';
  const accentGold = isDark ? '#FBBF24' : '#92400E';
  const primaryBlue = isDark ? '#93C5FD' : '#1E3A8A';
  const textMain = isDark ? '#F3F0E6' : '#1C1917';
  const textMuted = isDark ? '#A8A29E' : '#57534E';

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, bgTop);
  grad.addColorStop(1, bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative border frames
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, width - 72, height - 72);
  ctx.strokeStyle = isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(146, 64, 14, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Subtle Bodhi crest watermark on top-right
  ctx.save();
  ctx.translate(width - 140, 128);
  ctx.fillStyle = isDark ? 'rgba(251, 191, 36, 0.14)' : 'rgba(146, 64, 14, 0.08)';
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.bezierCurveTo(36, -18, 48, 12, 34, 38);
  ctx.bezierCurveTo(22, 56, 4, 58, 0, 58);
  ctx.bezierCurveTo(-4, 58, -22, 56, -34, 38);
  ctx.bezierCurveTo(-48, 12, -36, -18, 0, -52);
  ctx.fill();
  ctx.restore();

  const left = 92;
  const maxWidth = width - 184;

  // Header metadata
  ctx.fillStyle = accentGold;
  ctx.font = '600 22px "Noto Sans Thai", sans-serif';
  ctx.fillText(
    `ศาลาชาดก · ข้อคิดชาดกประจำวัน · ลำดับที่ ${String(wisdom.jatakaNumber).padStart(3, '0')} / 547`,
    left,
    108
  );

  ctx.fillStyle = primaryBlue;
  ctx.font = '700 34px "Noto Serif Thai", Georgia, serif';
  ctx.fillText(`${wisdom.thaiTitle} (${wisdom.paliTitle})`, left, 162);

  ctx.fillStyle = textMuted;
  ctx.font = '500 21px "Noto Sans Thai", sans-serif';
  ctx.fillText(`${wisdom.nipataName} · ${wisdom.barami}`, left, 200);

  // Divider line
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(28,25,23,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(left, 226);
  ctx.lineTo(width - left, 226);
  ctx.stroke();

  // Main Quote
  ctx.fillStyle = textMain;
  ctx.font = '600 38px "Noto Serif Thai", Georgia, serif';
  const quoteLines = wrapTextThai(ctx, `“${wisdom.quote}”`, maxWidth).slice(0, 4);
  let y = 296;
  for (const line of quoteLines) {
    ctx.fillText(line, left, y);
    y += 54;
  }

  // Moral Summary Box
  y += 22;
  ctx.fillStyle = accentGold;
  ctx.font = '700 22px "Noto Sans Thai", sans-serif';
  ctx.fillText('คติธรรมเตือนใจ:', left, y);
  y += 36;

  ctx.fillStyle = isDark ? '#E7E5E4' : '#292524';
  ctx.font = '400 25px "Noto Sans Thai", sans-serif';
  const moralLines = wrapTextThai(ctx, wisdom.moral, maxWidth).slice(0, 3);
  for (const line of moralLines) {
    ctx.fillText(line, left, y);
    y += 38;
  }

  // Footer Pali verse & Tipitaka citation
  const footerY = height - 122;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(28,25,23,0.12)';
  ctx.beginPath();
  ctx.moveTo(left, footerY - 28);
  ctx.lineTo(width - left, footerY - 28);
  ctx.stroke();

  if (wisdom.paliVerse) {
    ctx.fillStyle = textMuted;
    ctx.font = 'italic 20px "Noto Serif Thai", serif';
    ctx.fillText(`พระคาถา: ${wisdom.paliVerse}`, left, footerY);
  }

  ctx.fillStyle = textMuted;
  ctx.font = '400 19px "Noto Sans Thai", sans-serif';
  ctx.fillText(
    `ที่มา: ${wisdom.sourceCitation || `พระสุตตันตปิฎก ขุททกนิกาย ชาดก ลำดับที่ ${wisdom.jatakaNumber}`}`,
    left,
    footerY + 36
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('ไม่สามารถสร้างไฟล์ภาพ PNG ได้'));
    }, 'image/png');
  });
}

export async function downloadWisdomCard(
  wisdom: DailyWisdomData,
  variant: 'ivory' | 'indigo' = 'ivory'
) {
  const blob = await renderWisdomCardBlob(wisdom, variant);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sala-jataka-${String(wisdom.jatakaNumber).padStart(3, '0')}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
