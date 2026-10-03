import { z } from 'zod'

import type { ResumeDocument } from '#/models/resume'

const manifestSchema = z.object({
  format: z.literal('resume-source-package'),
  packageVersion: z.literal(1),
  name: z.string().trim().min(1),
})

type ZipEntry = {
  name: string
  data: Uint8Array
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function concatBytes(parts: Uint8Array[]) {
  const result = new Uint8Array(
    parts.reduce((total, part) => total + part.length, 0),
  )
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function writeU16(value: number) {
  const bytes = new Uint8Array(2)
  new DataView(bytes.buffer).setUint16(0, value, true)
  return bytes
}

function writeU32(value: number) {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true)
  return bytes
}

function readU16(view: DataView, offset: number) {
  return view.getUint16(offset, true)
}

function readU32(view: DataView, offset: number) {
  return view.getUint32(offset, true)
}

let crcTable: Uint32Array | undefined

function getCrcTable() {
  if (crcTable) return crcTable
  crcTable = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1)
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    crcTable[index] = value >>> 0
  }
  return crcTable
}

function crc32(data: Uint8Array) {
  let value = 0xffffffff
  const table = getCrcTable()
  for (const byte of data) value = table[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

function createZip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const checksum = crc32(entry.data)
    const local = concatBytes([
      writeU32(0x04034b50),
      writeU16(20),
      writeU16(0),
      writeU16(0),
      writeU16(0),
      writeU16(0),
      writeU32(checksum),
      writeU32(entry.data.length),
      writeU32(entry.data.length),
      writeU16(name.length),
      writeU16(0),
      name,
      entry.data,
    ])
    localParts.push(local)

    centralParts.push(
      concatBytes([
        writeU32(0x02014b50),
        writeU16(20),
        writeU16(20),
        writeU16(0),
        writeU16(0),
        writeU16(0),
        writeU16(0),
        writeU32(checksum),
        writeU32(entry.data.length),
        writeU32(entry.data.length),
        writeU16(name.length),
        writeU16(0),
        writeU16(0),
        writeU16(0),
        writeU16(0),
        writeU32(0),
        writeU32(offset),
        name,
      ]),
    )
    offset += local.length
  }

  const centralDirectory = concatBytes(centralParts)
  const localDirectory = concatBytes(localParts)
  const end = concatBytes([
    writeU32(0x06054b50),
    writeU16(0),
    writeU16(0),
    writeU16(entries.length),
    writeU16(entries.length),
    writeU32(centralDirectory.length),
    writeU32(localDirectory.length),
    writeU16(0),
  ])
  return concatBytes([localDirectory, centralDirectory, end])
}

function findEndOfCentralDirectory(bytes: Uint8Array) {
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
        offset,
        true,
      ) === 0x06054b50
    )
      return offset
  }
  throw new Error('The source package is not a valid ZIP file.')
}

function readZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const endOffset = findEndOfCentralDirectory(bytes)
  const count = readU16(view, endOffset + 10)
  const directorySize = readU32(view, endOffset + 12)
  const directoryOffset = readU32(view, endOffset + 16)
  const entries = new Map<string, Uint8Array>()
  let offset = directoryOffset

  for (let index = 0; index < count; index += 1) {
    if (readU32(view, offset) !== 0x02014b50)
      throw new Error('The source package has an invalid directory.')
    const method = readU16(view, offset + 10)
    const compressedSize = readU32(view, offset + 20)
    const nameLength = readU16(view, offset + 28)
    const extraLength = readU16(view, offset + 30)
    const commentLength = readU16(view, offset + 32)
    const localOffset = readU32(view, offset + 42)
    const name = decoder.decode(
      bytes.slice(offset + 46, offset + 46 + nameLength),
    )
    if (method !== 0)
      throw new Error('Only uncompressed source packages are supported.')
    if (readU32(view, localOffset) !== 0x04034b50)
      throw new Error('The source package has an invalid file entry.')
    const localNameLength = readU16(view, localOffset + 26)
    const localExtraLength = readU16(view, localOffset + 28)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength
    entries.set(name, bytes.slice(dataStart, dataStart + compressedSize))
    offset += 46 + nameLength + extraLength + commentLength
  }

  if (offset !== directoryOffset + directorySize)
    throw new Error('The source package directory is incomplete.')
  return entries
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], {
    type: 'application/zip',
  })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function createResumePackage(document: ResumeDocument) {
  const manifest = JSON.stringify(
    {
      format: 'resume-source-package',
      packageVersion: 1,
      name: document.name,
    },
    null,
    2,
  )
  return createZip([
    { name: 'resume.html', data: encoder.encode(document.html) },
    { name: 'resume.css', data: encoder.encode(document.css) },
    { name: 'manifest.json', data: encoder.encode(manifest) },
  ])
}

export function readResumePackage(bytes: Uint8Array) {
  return readZip(bytes)
}

export function exportResumePackage(document: ResumeDocument) {
  const bytes = createResumePackage(document)
  const filename =
    document.name.trim().replace(/\s+/g, '-').toLowerCase() || 'resume'
  downloadBytes(bytes, `${filename}.zip`)
}

export async function importResumePackage(file: File) {
  const entries = readResumePackage(new Uint8Array(await file.arrayBuffer()))
  const manifestBytes = entries.get('manifest.json')
  const htmlBytes = entries.get('resume.html')
  const cssBytes = entries.get('resume.css')
  if (!manifestBytes || !htmlBytes || !cssBytes)
    throw new Error(
      'The package must contain manifest.json, resume.html, and resume.css.',
    )
  const manifest = manifestSchema.parse(
    JSON.parse(decoder.decode(manifestBytes)),
  )
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: `${manifest.name} (imported)`,
    html: decoder.decode(htmlBytes),
    css: decoder.decode(cssBytes),
    createdAt: now,
    updatedAt: now,
  } satisfies ResumeDocument
}
