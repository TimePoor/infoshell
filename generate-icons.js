/**
 * SVG -> PNG/ICO 아이콘 변환 스크립트
 */
const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'assets/icons/icon.svg');
const outputDir = path.join(__dirname, 'assets/icons');

const sizes = [16, 32, 48, 64, 128, 256, 512];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  // PNG 생성
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
  
  // 기본 아이콘 (256px)
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(outputDir, 'icon.png'));
  console.log('Generated icon.png');
  
  // ICO 생성 (Windows용)
  const icoPngs = [16, 32, 48, 256].map(size => 
    fs.readFileSync(path.join(outputDir, `icon-${size}.png`))
  );
  
  const icoBuffer = await toIco(icoPngs);
  fs.writeFileSync(path.join(outputDir, 'icon.ico'), icoBuffer);
  console.log('Generated icon.ico');
  
  console.log('Done!');
}

generateIcons().catch(console.error);
