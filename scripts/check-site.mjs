import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { resolve, sep, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const html = readFileSync('index.html', 'utf8');
assert.ok(Buffer.byteLength(html) < 500_000, 'Keep index.html below 500 KB; upload images to BOS');
assert.ok(!html.includes('data:image/'), 'Use BOS image URLs instead of embedded images');
const manifest = JSON.parse(readFileSync('image-manifest.json', 'utf8'));
const base = 'https://wenchanyuan-travel.bj.bcebos.com/';
assert.equal(manifest.baseUrl, base, 'Keep the BOS HTTPS endpoint');
const dataMatch = html.match(/const DATA=([\s\S]*?);const MAP_POIS=/);
assert.ok(dataMatch, 'Missing travel data');
const data = JSON.parse(dataMatch[1]);
assert.ok(data.assets.length > 0, 'Missing travel images');
for (const day of data.days) {
  for (const index of [day[5], ...day[12]]) {
    assert.ok(Number.isInteger(index) && data.assets[index], 'Day references a missing photo');
  }
}
for (const asset of data.assets.filter(asset => asset.reference)) {
  assert.ok(asset.credit && asset.source && asset.license, 'New reference photos need attribution and a license');
  assert.match(asset.source, /^https:\/\//);
  assert.match(asset.license, /^https:\/\//);
}
const guideData = JSON.parse(readFileSync('assets/guide-data.json', 'utf8'));
const placeIds = new Set(data.places.map(place => place.id));
assert.equal(placeIds.size, data.places.length, 'Duplicate place ID');
for (const place of data.places) {
  assert.ok(place.zh && place.ja && /[A-Za-z]/.test(place.latin), 'Missing Chinese, Japanese or Latin place name');
  assert.equal(typeof place.same, 'boolean', 'Specify whether near-identical names share a line');
  assert.ok(Array.isArray(place.aliases) && place.aliases.length, 'Missing place aliases');
  assert.match(place.source, /^https:\/\//, 'Place name needs an official source');
}
for (const guide of guideData.guides) assert.ok(placeIds.has(guide.placeId), 'Guide needs a shared place name');
const covered = guideData.guides.flatMap(guide => guide.assetIndices).sort((a,b) => a-b);
const landscape = data.assets.flatMap((asset,index) => asset.group === '票据' ? [] : [index]);
assert.deepEqual(covered, landscape, 'Every landscape photo needs exactly one guide card');
assert.equal(new Set(guideData.guides.map(guide => guide.id)).size, guideData.guides.length, 'Duplicate guide ID');
for (const guide of guideData.guides) {
  assert.ok(guide.title && guide.intro.length >= 2 && guide.sections.length >= 2 && guide.observe.length >= 2, 'Incomplete guide card');
  assert.deepEqual(guide.images.map(image => image.assetIndex), guide.assetIndices, 'Guide photos do not match covered indices');
  for (const image of guide.images) assert.equal(image.url, data.assets[image.assetIndex].src, 'Keep guide images on BOS');
  for (const section of guide.sections) {
    assert.ok(section.text && section.sources.length, 'Guide history needs a source');
    for (const id of section.sources) assert.match(guideData.sources[id]?.url || '', /^https:\/\//, 'Missing HTTPS guide source');
  }
}
assert.equal(manifest.images.filter(image => Number.isInteger(image.assetIndex)).length, data.assets.length, 'Update the image manifest when adding photos');
for (const image of manifest.images) {
  assert.match(image.file, /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-f0-9]{8}\.(?:webp|jpg|png|svg|gif)$/, 'Use descriptive English image filenames with a content hash');
  assert.equal(image.url, base + image.file, 'Image URL does not match its BOS filename');
  assert.ok(image.file.includes(image.sha256.slice(0, 8)), 'Image filename hash is inconsistent');
  assert.ok(html.includes(image.url), `Unused image in manifest: ${image.file}`);
  if (Number.isInteger(image.assetIndex)) assert.equal(data.assets[image.assetIndex]?.src, image.url, 'Photo URL does not match the manifest');
}
assert.match(html, /<!doctype\s+html\s*>/i, 'index.html needs an HTML doctype');
assert.match(html, /<html\b/i, 'Missing HTML root');
assert.match(html, /<title>\s*[^<]+<\/title>/i, 'Missing page title');
assert.match(html, /<\/html>\s*$/i, 'HTML appears incomplete');
assert.equal(readFileSync('CNAME', 'utf8').trim(), 'japan2026.wenchanyuan.com', 'Keep the travel subdomain unchanged');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
assert.equal(scripts.length, (html.match(/<script\b/gi) || []).length, 'Unclosed script element');
const temp = mkdtempSync(join(tmpdir(), 'travel-site-'));
let checked = 0;
try {
  for (const [i, match] of scripts.entries()) {
    const type = match[1].match(/\btype\s*=\s*["']([^"']*)["']/i)?.[1] || '';
    if (type && !/^(module|(?:text|application)\/(?:java|ecma)script)$/i.test(type)) continue;
    if (/\bsrc\s*=/i.test(match[1])) continue;
    const file = join(temp, `${i}.${type === 'module' ? 'mjs' : 'js'}`);
    writeFileSync(file, match[2]);
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(result.status, 0, `Script ${i + 1}: ${result.stderr}`);
    checked++;
  }
  const checkAssets = directory => {
    for (const entry of readdirSync(directory, { withFileTypes:true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) checkAssets(file);
      else if (/\.m?js$/i.test(entry.name)) {
        const result = spawnSync(process.execPath, ['--check', file], { encoding:'utf8' });
        assert.equal(result.status, 0, `${file}: ${result.stderr}`);
      }
    }
  };
  if (existsSync('assets')) checkAssets('assets');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
for (const [, value] of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value) || value.includes('${')) continue;
  const path = resolve(root, decodeURIComponent(value.split(/[?#]/)[0]).replace(/^\//, ''));
  assert.ok(path === root || path.startsWith(root + sep), `Reference outside site: ${value}`);
  assert.ok(existsSync(path), `Missing local file: ${value}`);
  assert.ok(path === resolve(root, 'index.html') || path.startsWith(resolve(root, 'assets') + sep), `Put supporting files in assets/: ${value}`);
}
console.log(`Site checks passed; ${checked} inline scripts checked.`);
