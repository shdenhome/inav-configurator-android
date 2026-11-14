// Regenerate checked-in launcher assets. Requires Playwright and Chromium.
// The mark is the upstream INAV white logo, used under the project's GPL-3.0 license.
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const background = '#31A9D8';
const mark = fs.readFileSync(path.join(root, 'assets/app-icon-mark.svg'), 'utf8');
const content = mark.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const vb = '-1167.6 39 121.8 124';
function svg(size, shape) {
  const legacy = shape !== 'foreground';
  const height = legacy ? size * 124 / 169 : size * (72 / 108) * 124 / 169;
  const width = height * 121.8 / 124;
  const bg = shape === 'round' ? `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${background}"/>`
    : shape === 'square' ? `<rect width="${size}" height="${size}" rx="${size*23/169}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}<svg x="${(size-width)/2}" y="${(size-height)/2}" width="${width}" height="${height}" viewBox="${vb}">${content}</svg></svg>`;
}
(async () => {
  fs.writeFileSync(path.join(root, 'assets/app-icon.svg'), svg(169, 'square')+'\n');
  const executablePath = process.env.CHROMIUM_EXECUTABLE || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({executablePath,args:['--no-sandbox']});
  try {
    const page = await browser.newPage();
    const res = path.join(root,'android/app/src/main/res');
    for (const [density, scale] of [['mdpi',1],['hdpi',1.5],['xhdpi',2],['xxhdpi',3],['xxxhdpi',4]]) {
      for (const [name,size,shape] of [['ic_launcher',48*scale,'square'],['ic_launcher_round',48*scale,'round'],['ic_launcher_foreground',108*scale,'foreground']]) {
        const data = await page.evaluate(async ({markup,size}) => {
          const image = new Image(); image.src = 'data:image/svg+xml;base64,'+btoa(markup); await image.decode();
          const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;canvas.getContext('2d').drawImage(image,0,0);
          return canvas.toDataURL('image/png').split(',')[1];
        }, {markup:svg(size,shape),size});
        fs.writeFileSync(path.join(res,`mipmap-${density}`,name+'.png'),Buffer.from(data,'base64'));
      }
    }
    const scale = (72*124/169)/124;
    const paths = [...content.matchAll(/d="([^"]+)"/g)].map(m=>`        <path android:fillColor="#FFFFFF" android:pathData="${m[1].replace(/\s+/g,' ')}"/>`).join('\n');
    fs.writeFileSync(path.join(res,'drawable-v24/ic_launcher_foreground.xml'),
      `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">\n    <group android:translateX="54" android:translateY="54">\n      <group android:scaleX="${scale}" android:scaleY="${scale}">\n       <group android:translateX="1106.7" android:translateY="-101">\n${paths}\n       </group>\n      </group>\n    </group>\n</vector>\n`);
    fs.writeFileSync(path.join(res,'values/ic_launcher_background.xml'),`<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">${background}</color></resources>\n`);
    fs.writeFileSync(path.join(res,'drawable/ic_launcher_background.xml'),`<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="${background}" android:pathData="M0,0h108v108H0z"/></vector>\n`);
    for (const name of ['ic_launcher.xml','ic_launcher_round.xml']) {
      const file=path.join(res,'mipmap-anydpi-v26',name);
      fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('@mipmap/ic_launcher_foreground','@drawable/ic_launcher_foreground'));
    }
    await page.setViewportSize({width:169,height:169});await page.setContent(svg(169,'square'));
    await page.locator('svg').first().screenshot({path:path.join(root,'assets/app-icon.png'),omitBackground:true});
  } finally { await browser.close(); }
  console.log('Generated launcher icons for five densities and adaptive vector resources.');
})().catch(e=>{console.error(e);process.exitCode=1;});
