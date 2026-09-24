const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = 'D:\\당선지침서_20250923\\out';
const OUT_BASE = path.join(__dirname, '..', 'public', 'book_pages');
const OUT_HIGH = path.join(OUT_BASE, 'high');
const OUT_THUMB = path.join(OUT_BASE, 'thumb');

// Ensure output directories exist
fs.mkdirSync(OUT_HIGH, { recursive: true });
fs.mkdirSync(OUT_THUMB, { recursive: true });

async function run() {
  console.log('🔍 원본 디렉토리 확인 중: ' + SOURCE_DIR);
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ 원본 디렉토리를 찾을 수 없습니다: ' + SOURCE_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(SOURCE_DIR)
    .filter(f => f.toLowerCase().endsWith('.tif') || f.toLowerCase().endsWith('.tiff'))
    .sort((a, b) => {
      // Natural sort: 0001_1L, 0001_2R, etc.
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

  console.log(`📚 총 ${files.length}개 페이지 발견.`);

  const manifest = [];
  const CONCURRENCY = 6;
  let completed = 0;
  const startTime = Date.now();

  async function processFile(file, index) {
    const pageNum = index + 1;
    const pageId = String(pageNum).padStart(4, '0');
    const highFile = `${pageId}.webp`;
    const thumbFile = `${pageId}.webp`;
    const highPath = path.join(OUT_HIGH, highFile);
    const thumbPath = path.join(OUT_THUMB, thumbFile);
    const srcPath = path.join(SOURCE_DIR, file);

    const highExists = fs.existsSync(highPath);
    const thumbExists = fs.existsSync(thumbPath);

    let width = 0;
    let height = 0;

    if (!highExists || !thumbExists) {
      const img = sharp(srcPath);
      const meta = await img.metadata();
      width = meta.width;
      height = meta.height;

      // High-res (max width 1800px for crisp text while keeping file ~150KB)
      const targetWidth = Math.min(meta.width, 1800);
      await sharp(srcPath)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 82, effort: 3 })
        .toFile(highPath);

      // Thumbnail (width 260px)
      await sharp(srcPath)
        .resize({ width: 260, withoutEnlargement: true })
        .webp({ quality: 70, effort: 2 })
        .toFile(thumbPath);
    } else {
      // Fast metadata read if already exists
      const meta = await sharp(highPath).metadata();
      width = meta.width;
      height = meta.height;
    }

    manifest.push({
      pageIndex: index,
      pageNum: pageNum,
      srcFileName: file,
      side: file.includes('_1L') ? 'left' : 'right',
      high: `/book_pages/high/${highFile}`,
      thumb: `/book_pages/thumb/${thumbFile}`,
      width,
      height,
      aspectRatio: width && height ? (width / height).toFixed(4) : '0.6858'
    });

    completed++;
    if (completed % 10 === 0 || completed === files.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const percent = ((completed / files.length) * 100).toFixed(1);
      process.stdout.write(`\r🚀 변환 진행률: [${completed}/${files.length}] (${percent}%) - ${elapsed}초 경과`);
    }
  }

  // Run in chunks with concurrency
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const slice = files.slice(i, i + CONCURRENCY);
    await Promise.all(slice.map((f, idx) => processFile(f, i + idx)));
  }

  // Sort manifest by pageNum
  manifest.sort((a, b) => a.pageNum - b.pageNum);

  const manifestPath = path.join(OUT_BASE, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('\n\n✅ 모든 페이지 변환 및 메타데이터 생성 완료!');
  console.log(`📁 매니페스트 저장: ${manifestPath}`);
  console.log(`⏱️ 총 소요 시간: ${((Date.now() - startTime) / 1000).toFixed(1)}초`);
}

run().catch(err => {
  console.error('\n❌ 변환 중 오류 발생:', err);
  process.exit(1);
});
