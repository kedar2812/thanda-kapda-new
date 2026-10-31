// Serves the static export like the production .htaccess does.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = process.argv[2]
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain', '.woff2': 'font/woff2', '.xml': 'application/xml' }

async function file(p) {
  try {
    const s = await stat(p)
    if (s.isDirectory()) return file(join(p, 'index.html'))
    return p
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let f = await file(normalize(join(root, path)))
  if (!f) {
    // __next.<a>.<b>.__PAGE__.txt → __next.<a>/<b>/__PAGE__.txt (as in public/.htaccess)
    const m2 = path.match(/^(.*\/)?__next\.([^./]+)\.([^./]+)\.__PAGE__\.txt$/)
    const m1 = path.match(/^(.*\/)?__next\.([^./]+)\.__PAGE__\.txt$/)
    if (m2) f = await file(join(root, `${m2[1] ?? '/'}__next.${m2[2]}/${m2[3]}/__PAGE__.txt`))
    else if (m1) f = await file(join(root, `${m1[1] ?? '/'}__next.${m1[2]}/__PAGE__.txt`))
  }
  if (!f) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    return res.end(await readFile(join(root, '404.html')))
  }
  res.writeHead(200, { 'Content-Type': types[extname(f)] ?? 'application/octet-stream' })
  res.end(await readFile(f))
}).listen(3000, '127.0.0.1', () => console.log('site on http://127.0.0.1:3000'))
