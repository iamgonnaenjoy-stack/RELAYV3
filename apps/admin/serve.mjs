import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const distDir = join(__dirname, 'dist')
const indexPath = join(distDir, 'index.html')
const port = Number(process.env.PORT || 4174)
const host = '0.0.0.0'

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
}

function isWithinDist(filePath) {
  const relative = filePath.slice(distDir.length)
  return filePath === distDir || relative.startsWith('\\') || relative.startsWith('/')
}

async function resolveFile(pathname) {
  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const candidate = normalize(join(distDir, requestedPath))

  if (!isWithinDist(candidate)) {
    return { type: 'forbidden' }
  }

  try {
    const fileStats = await stat(candidate)
    if (fileStats.isFile()) {
      return { type: 'file', path: candidate }
    }

    if (fileStats.isDirectory()) {
      const nestedIndex = join(candidate, 'index.html')
      await access(nestedIndex)
      return { type: 'file', path: nestedIndex }
    }
  } catch {
    if (extname(candidate)) {
      return { type: 'missing' }
    }
  }

  return { type: 'file', path: indexPath }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const resolved = await resolveFile(url.pathname)

    if (resolved.type === 'forbidden') {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Forbidden')
      return
    }

    if (resolved.type === 'missing') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    const extension = extname(resolved.path)
    const contentType = MIME_TYPES[extension] || 'application/octet-stream'

    res.writeHead(200, {
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      'Content-Type': contentType,
    })

    createReadStream(resolved.path).pipe(res)
  } catch (error) {
    console.error('[admin] failed to serve request', error)
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Internal server error')
  }
})

server.listen(port, host, () => {
  console.log(`Relay admin app serving dist on http://${host}:${port}`)
})
