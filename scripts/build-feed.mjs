#!/usr/bin/env node
/**
 * Standalone, zero-dependency feed builder for Vani extension repositories.
 *
 * Scans plugin directories containing `manifest.json`, validates v1 constraints,
 * builds deterministic ZIP archives compatible with Vani's `plugin-zip.ts`,
 * computes SHA-256 digests, and emits a schema-valid `feed.json`.
 *
 * Usage:
 *   node scripts/build-feed.mjs --check
 *   node scripts/build-feed.mjs --out-dir dist/feed --repo Nichengjin/vani-plugins --preserve-existing feed.json
 *   node scripts/build-feed.mjs --out-dir dist/feed --write-root-feed
 */
import { createHash } from 'node:crypto'
import { lstat, mkdir, opendir, readFile, realpath, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { crc32, deflateRawSync } from 'node:zlib'

const MAX_FILES = 500
const MAX_BYTES = 32 * 1024 * 1024
const MAX_ARCHIVE_BYTES = 40 * 1024 * 1024
const MAX_FEED_PLUGINS = 200

const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db'])
const IGNORED_ROOT_DIRS = new Set(['.git', '.github', 'scripts', 'dist', 'node_modules'])

const ID_REGEX = /^(?!(?:con|prn|aux|nul|com[0-9]|lpt[0-9]|constructor|prototype|builtin|vani)$)[a-z0-9][a-z0-9-]{0,63}$/u
const SEGMENT = String.raw`(?!\.{1,2}(?:/|$))[^/\\:\x00-\x1f\x7f-\x9f]+`
const PATH_REGEX = new RegExp(`^${SEGMENT}(?:/${SEGMENT})*$`, 'u')
const NUM = '(?:0|[1-9][0-9]*)'
const PRE = `(?:${NUM}|[0-9]*[A-Za-z-][0-9A-Za-z-]*)`
const SEMVER_MINOR_PATCH = `${NUM}\\.${NUM}(?:-${PRE}(?:\\.${PRE})*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?`
const SEMVER_REGEX = new RegExp(`^${NUM}\\.${SEMVER_MINOR_PATCH}$`, 'u')
const VANI_API_REGEX = new RegExp(
  `^(?:${NUM}|${NUM}\\.[xX*]|${NUM}\\.${NUM}\\.[xX*]|(?:\\^|~)?${NUM}\\.${SEMVER_MINOR_PATCH})$`,
  'u'
)
const VALID_RUNTIMES = new Set(['data', 'ui', 'host'])

function isSafeHttpsUrl(raw, { allowQuery = false } = {}) {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) return false
    if (!allowQuery && url.search) return false
    const host = url.hostname.toLowerCase()
    if (/^(?:.*\.)?(?:localhost|local|internal|localdomain|test|invalid|home\.arpa)$/u.test(host)) return false
    return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(host)
  } catch {
    return false
  }
}

function validateManifestBasic(manifest, dirName) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`${dirName}: manifest.json must be a JSON object`)
  }
  if (manifest.schemaVersion !== 1) throw new Error(`${dirName}: schemaVersion must be 1`)
  if (typeof manifest.id !== 'string' || !ID_REGEX.test(manifest.id)) {
    throw new Error(`${dirName}: invalid manifest.id "${manifest.id}"`)
  }
  if (manifest.id !== dirName) {
    throw new Error(`${dirName}: directory name must match manifest.id "${manifest.id}"`)
  }
  if (typeof manifest.name !== 'string' || !manifest.name.trim() || manifest.name.length > 120) {
    throw new Error(`${dirName}: invalid manifest.name`)
  }
  if (typeof manifest.version !== 'string' || !SEMVER_REGEX.test(manifest.version)) {
    throw new Error(`${dirName}: invalid SemVer manifest.version "${manifest.version}"`)
  }
  if (typeof manifest.vaniApiVersion !== 'string' || !VANI_API_REGEX.test(manifest.vaniApiVersion)) {
    throw new Error(`${dirName}: invalid manifest.vaniApiVersion "${manifest.vaniApiVersion}"`)
  }
  if (!VALID_RUNTIMES.has(manifest.runtime)) {
    throw new Error(`${dirName}: invalid manifest.runtime "${manifest.runtime}"`)
  }
  if (typeof manifest.entry !== 'string' || !PATH_REGEX.test(manifest.entry)) {
    throw new Error(`${dirName}: invalid manifest.entry "${manifest.entry}"`)
  }
  if (manifest.homepage !== undefined && !isSafeHttpsUrl(manifest.homepage, { allowQuery: true })) {
    throw new Error(`${dirName}: invalid manifest.homepage "${manifest.homepage}"`)
  }
}

export function createDeterministicZip(files) {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))
  const localParts = []
  const centralParts = []
  const time = 0
  const date = 0x0021 // 1980-01-01 00:00:00
  let offset = 0

  for (const file of sorted) {
    if (!PATH_REGEX.test(file.path)) throw new Error(`Invalid package path: ${file.path}`)
    const nameBytes = Buffer.from(file.path, 'utf8')
    const raw = Buffer.isBuffer(file.bytes) ? file.bytes : Buffer.from(file.bytes)
    const deflated = deflateRawSync(raw, { level: 9 })
    const useDeflate = deflated.length < raw.length
    const method = useDeflate ? 8 : 0
    const body = useDeflate ? deflated : raw
    const checksum = crc32(raw) >>> 0
    const flags = 0x0800 // UTF-8 filename

    const local = Buffer.alloc(30 + nameBytes.length)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(flags, 6)
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(date, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    local.writeUInt16LE(0, 28)
    nameBytes.copy(local, 30)

    const central = Buffer.alloc(46 + nameBytes.length)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE((3 << 8) | 20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(flags, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt16LE(time, 12)
    central.writeUInt16LE(date, 14)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(body.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38)
    central.writeUInt32LE(offset, 42)
    nameBytes.copy(central, 46)

    localParts.push(local, body)
    centralParts.push(central)
    offset += local.length + body.length
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(sorted.length, 8)
  end.writeUInt16LE(sorted.length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, ...centralParts, end])
}

async function collectPluginFiles(rootDir) {
  const canonicalRoot = await realpath(rootDir)
  const files = []
  let totalBytes = 0

  async function walk(rel) {
    const dir = join(canonicalRoot, rel)
    if (await realpath(dir) !== dir) throw new Error(`Symlink directory rejected: ${dir}`)
    for await (const entry of await opendir(dir)) {
      if (IGNORED_FILES.has(entry.name)) continue
      const nextRel = rel ? `${rel}/${entry.name}` : entry.name
      if (!PATH_REGEX.test(nextRel)) throw new Error(`Unsafe path in plugin: ${nextRel}`)
      const abs = join(canonicalRoot, nextRel)
      const info = await lstat(abs)
      if (await realpath(abs) !== abs) throw new Error(`Symlink rejected: ${nextRel}`)
      if (info.isDirectory()) {
        await walk(nextRel)
        continue
      }
      if (!info.isFile() || info.nlink !== 1) throw new Error(`Unsupported file entry (hardlink/special): ${nextRel}`)
      if (files.length + 1 > MAX_FILES) throw new Error(`${canonicalRoot}: exceeds ${MAX_FILES} files limit`)
      const bytes = await readFile(abs)
      totalBytes += bytes.length
      if (totalBytes > MAX_BYTES) throw new Error(`${canonicalRoot}: exceeds ${MAX_BYTES} bytes limit`)
      files.push({ path: nextRel, bytes })
    }
  }

  await walk('')
  return files
}

async function readOptionalText(filePath) {
  try {
    const text = (await readFile(filePath, 'utf8')).trim()
    return text ? text.slice(0, 4000) : undefined
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    throw error
  }
}

async function discoverPluginDirs(pluginsRoot) {
  const dirs = []
  for await (const entry of await opendir(pluginsRoot)) {
    if (entry.name.startsWith('.') || IGNORED_ROOT_DIRS.has(entry.name)) continue
    const abs = join(pluginsRoot, entry.name)
    const info = await lstat(abs)
    if (!info.isDirectory()) continue
    try {
      const manifestInfo = await lstat(join(abs, 'manifest.json'))
      if (manifestInfo.isFile()) dirs.push({ name: entry.name, dir: abs })
    } catch {
      // Skip non-plugin top-level directories
    }
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name))
  return dirs
}

function parseCliArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token?.startsWith('--')) continue
    const key = token.slice(2)
    if (key === 'check' || key === 'write-root-feed') {
      args[key] = true
      continue
    }
    const value = argv[++i]
    if (value === undefined) throw new Error(`Missing value for --${key}`)
    args[key] = value
  }
  return args
}

function sameFeedContent(a, b) {
  const strip = doc => ({ ...doc, generatedAt: undefined })
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b))
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2))
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const configPath = resolve(repoRoot, args.config ?? 'feed.config.json')
  const config = JSON.parse(await readFile(configPath, 'utf8'))

  const repository = args.repo || process.env.GITHUB_REPOSITORY || config.repository
  if (!repository || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9._-]{1,100}$/u.test(repository)) {
    throw new Error(`Invalid repository "${repository}". Expected owner/repo.`)
  }
  const homepage = args.homepage || config.homepage || `https://github.com/${repository}`
  const pluginsRoot = resolve(repoRoot, args['plugins-dir'] ?? config.pluginsDir ?? '.')
  const outDir = resolve(repoRoot, args['out-dir'] ?? 'dist/feed')
  const archivesDir = join(outDir, 'archives')
  const checkOnly = Boolean(args.check)

  const pluginDirs = await discoverPluginDirs(pluginsRoot)
  if (!pluginDirs.length) throw new Error(`No plugin directories found under ${pluginsRoot}`)
  if (pluginDirs.length > MAX_FEED_PLUGINS) throw new Error(`Exceeds ${MAX_FEED_PLUGINS} plugins limit`)

  if (!checkOnly) await mkdir(archivesDir, { recursive: true })

  const plugins = []
  const checksumLines = []
  const seenIds = new Set()

  for (const { name: dirName, dir } of pluginDirs) {
    const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'))
    validateManifestBasic(manifest, dirName)
    if (seenIds.has(manifest.id)) throw new Error(`Duplicate plugin ID: ${manifest.id}`)
    seenIds.add(manifest.id)

    const files = await collectPluginFiles(dir)
    if (!files.some(file => file.path === manifest.entry)) {
      throw new Error(`${dirName}: missing declared entry "${manifest.entry}"`)
    }

    const zip = createDeterministicZip(files)
    if (zip.length > MAX_ARCHIVE_BYTES) {
      throw new Error(`${dirName}: archive exceeds ${MAX_ARCHIVE_BYTES} bytes (${zip.length})`)
    }

    const sha256 = createHash('sha256').update(zip).digest('hex')
    const filename = `${manifest.id}-${manifest.version}.zip`
    const tag = `${manifest.id}-v${manifest.version}`
    const archiveUrl = `https://github.com/${repository}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(filename)}`
    const releaseUrl = `https://github.com/${repository}/releases/tag/${encodeURIComponent(tag)}`

    if (!isSafeHttpsUrl(archiveUrl)) throw new Error(`${dirName}: unsafe archiveUrl "${archiveUrl}"`)

    const releaseNotes = await readOptionalText(join(dir, 'RELEASE_NOTES.md'))
    if (!checkOnly) await writeFile(join(archivesDir, filename), zip)
    checksumLines.push(`${sha256}  ${filename}`)

    plugins.push({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      ...(manifest.description ? { description: manifest.description } : {}),
      ...(manifest.author ? { author: manifest.author } : {}),
      vaniApiVersion: manifest.vaniApiVersion,
      runtime: manifest.runtime,
      archiveUrl,
      sha256,
      size: zip.length,
      ...(releaseNotes ? { releaseNotes } : {}),
      ...(manifest.homepage ? { homepage: manifest.homepage } : {}),
      releaseUrl
    })
  }

  let generatedAt = new Date().toISOString()
  let feed = {
    schemaVersion: 1,
    name: args.name || config.name,
    ...(config.description ? { description: config.description } : {}),
    homepage,
    generatedAt,
    plugins
  }

  if (args['preserve-existing']) {
    try {
      const existing = JSON.parse(await readFile(resolve(repoRoot, args['preserve-existing']), 'utf8'))
      if (existing && typeof existing.generatedAt === 'string' && sameFeedContent(existing, feed)) {
        feed = { ...feed, generatedAt: existing.generatedAt }
      }
    } catch {
      // No existing feed.json yet; keep fresh timestamp.
    }
  }

  if (checkOnly) {
    console.log(`Validated ${plugins.length} plugin(s) for ${repository}: ${plugins.map(p => `${p.id}@${p.version}`).join(', ')}`)
    return
  }

  const json = JSON.stringify(feed, null, 2) + '\n'
  await writeFile(join(outDir, 'feed.json'), json, 'utf8')
  await writeFile(join(outDir, 'SHA256SUMS.txt'), checksumLines.join('\n') + '\n', 'utf8')
  if (args['write-root-feed']) {
    await writeFile(join(repoRoot, 'feed.json'), json, 'utf8')
  }
  console.log(`Built ${plugins.length} plugin(s) -> ${join(outDir, 'feed.json')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
