/**
 * Bulk-upload public/images/* to Shopify Files via Admin API.
 * Outputs a JSON map: { "images/hero.jpg": "https://cdn.shopify.com/..." }
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const OUTPUT_FILE = path.join(ROOT, '_archive', 'image-cdn-map.json');

// Load env
const envFile = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const STORE = env.PUBLIC_STORE_DOMAIN.replace('.myshopify.com', '');
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API = `https://${STORE}.myshopify.com/admin/api/2024-10/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
  }
  return json;
}

function getAllImages(dir, base = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllImages(path.join(dir, entry.name), rel));
    } else if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(entry.name)) {
      files.push(rel);
    }
  }
  return files;
}

async function stagedUpload(filename, mimeType, fileSize) {
  const { data } = await gql(`
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }
  `, {
    input: [{
      filename,
      mimeType,
      resource: 'FILE',
      fileSize: String(fileSize),
      httpMethod: 'POST',
    }],
  });

  const target = data?.stagedUploadsCreate?.stagedTargets?.[0];
  const errors = data?.stagedUploadsCreate?.userErrors;
  if (errors?.length) console.error('Staged upload errors:', errors);
  return target;
}

async function uploadToStaged(target, filePath) {
  const form = new FormData();
  for (const param of target.parameters) {
    form.append(param.name, param.value);
  }
  const fileBuffer = fs.readFileSync(filePath);
  form.append('file', new Blob([fileBuffer]), path.basename(filePath));

  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Upload failed (${res.status}):`, text.slice(0, 200));
    return false;
  }
  return true;
}

async function createFile(resourceUrl, filename) {
  const { data } = await gql(`
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { id }
        userErrors { field message }
      }
    }
  `, {
    files: [{
      originalSource: resourceUrl,
      filename,
      contentType: 'IMAGE',
    }],
  });

  const errors = data?.fileCreate?.userErrors;
  if (errors?.length) console.error('fileCreate errors:', errors);
  return data?.fileCreate?.files?.[0]?.id;
}

function getMimeType(ext) {
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp',
    '.gif': 'image/gif', '.svg': 'image/svg+xml',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

async function waitForFileReady(fileId, maxWait = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const { data } = await gql(`
      query getFile($id: ID!) {
        node(id: $id) {
          ... on MediaImage {
            id
            fileStatus
            image { url }
          }
        }
      }
    `, { id: fileId });

    const node = data?.node;
    if (node?.fileStatus === 'READY' && node?.image?.url) {
      return node.image.url;
    }
    if (node?.fileStatus === 'FAILED') {
      console.error(`File ${fileId} failed processing`);
      return null;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.error(`Timeout waiting for ${fileId}`);
  return null;
}

async function main() {
  const images = getAllImages(IMAGES_DIR);
  console.log(`Found ${images.length} images to upload.\n`);

  // Load existing map to resume
  let cdnMap = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    cdnMap = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    console.log(`Resuming — ${Object.keys(cdnMap).length} already uploaded.\n`);
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const relPath of images) {
    const key = `images/${relPath}`;
    if (cdnMap[key]) {
      skipped++;
      continue;
    }

    const absPath = path.join(IMAGES_DIR, relPath);
    const stat = fs.statSync(absPath);
    const ext = path.extname(relPath);
    const mime = getMimeType(ext);
    // Use a prefixed filename to keep things organized
    const shopifyFilename = `styx-${relPath.replace(/\//g, '-')}`;

    console.log(`[${uploaded + skipped + failed + 1}/${images.length}] Uploading ${relPath} (${(stat.size / 1024 / 1024).toFixed(1)}MB)...`);

    try {
      // Step 1: Get staged upload URL
      const target = await stagedUpload(shopifyFilename, mime, stat.size);
      if (!target) { failed++; continue; }

      // Step 2: Upload file
      const ok = await uploadToStaged(target, absPath);
      if (!ok) { failed++; continue; }

      // Step 3: Create file record
      const fileId = await createFile(target.resourceUrl, shopifyFilename);
      if (!fileId) { failed++; continue; }

      // Step 4: Wait for processing
      const cdnUrl = await waitForFileReady(fileId);
      if (!cdnUrl) { failed++; continue; }

      cdnMap[key] = cdnUrl;
      uploaded++;
      console.log(`  ✓ ${cdnUrl}\n`);

      // Save progress after each upload
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cdnMap, null, 2));

      // Rate limit: small delay between uploads
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`CDN map saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
