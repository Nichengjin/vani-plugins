import { PDFDataRangeTransport } from '../vendor/pdf.mjs'

export const RANGE_CHUNK = 256 * 1024
const MAX_READ = 512 * 1024

// The bundled PDF.js transport splits coalesced ranges into at most two
// RANGE_CHUNKs before allocating them. Every reply satisfies exactly one range.
export class ActiveFileRange extends PDFDataRangeTransport {
  #bridge
  #failed
  #closed = false
  #queue = Promise.resolve()
  #lastRead = -Infinity

  constructor(size, bridge, failed) {
    super(size, null, true)
    this.#bridge = bridge
    this.#failed = failed
  }

  abort() { this.#closed = true }

  requestDataRange(begin, end) {
    // Single flight, with headroom below the host's 64 messages/second budget.
    this.#queue = this.#queue.then(async () => {
      if (this.#closed) return
      const length = end - begin
      if (!Number.isSafeInteger(begin) || !Number.isSafeInteger(end) || begin < 0 || length <= 0 || length > MAX_READ || end > this.length) {
        throw new RangeError('Invalid PDF range')
      }
      const delay = 22 - (performance.now() - this.#lastRead)
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
      if (this.#closed) return
      this.#lastRead = performance.now()
      const bytes = await this.#bridge.readActiveBytes(begin, length)
      if (this.#closed) return
      if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== length) throw new Error('Incomplete PDF range')
      this.onDataRange(begin, new Uint8Array(bytes))
    }).catch(() => {
      if (!this.#closed) {
        this.abort()
        this.#failed()
      }
    })
  }
}
