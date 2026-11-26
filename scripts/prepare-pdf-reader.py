"""Recreate pdf-reader/vendor from the pinned npm distribution; no install or build hooks.

Run: python3 scripts/prepare-pdf-reader.py [pdfjs-dist-6.5.438.tgz]
"""

import base64
import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile
from urllib.request import urlopen


VERSION = '6.5.438'
URL = f'https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-{VERSION}.tgz'
SHA512 = 'vg8Pw1x+AFKy4AMDvhuWl5cOYV8d698UoEANoFFhc79hqXDnZQqnOXoxw3HG907WHOg1JYOvLhP756boddFxpA=='
DEST = Path(__file__).resolve().parent.parent / 'pdf-reader/vendor'


def prepare(data):
    if hashlib.sha512(data).digest() != base64.b64decode(SHA512):
        raise ValueError(f'Not the pinned pdfjs-dist@{VERSION} archive')
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        def read(name):
            return archive.extractfile('package/' + name).read()

        files = {'pdf.mjs': read('build/pdf.min.mjs')}
        codecs = ('jbig2_nowasm_fallback.js', 'openjpeg_nowasm_fallback.js')
        for name in codecs:
            files[name] = read('wasm/' + name)
        # PDF.js normally resolves its JS image decoders by URL. Make these two
        # imports statically resolvable so the unchanged plugin compiler inlines
        # both; no arbitrary module URL, worker, Wasm, or network is needed.
        worker = read('build/pdf.worker.mjs').decode()
        dynamic = 'import(\n    /*webpackIgnore: true*/\n    /*@vite-ignore*/\n    `${WasmImage.#wasmUrl}${this._noWasmFilename}`)'
        local = f'(this._noWasmFilename==="{codecs[0]}"?import("./{codecs[0]}"):import("./{codecs[1]}"))'
        # A rejected range while parsing requires destroying the loading task.
        # Upstream's detached rejection handler otherwise throws again *after*
        # termination, reporting an ordinary file read failure as a plugin crash.
        rejection = 'loadDocument(false).then(onSuccess, function (reason) {\n          ensureNotTerminated();'
        cancelled = rejection.replace('ensureNotTerminated();', 'if (terminated) return;')
        # This transport receives one ArrayBuffer per logical PDF.js range.
        # Split before opening a range reader, not after: a coalesced 100 MiB
        # image must not allocate a second 100 MiB staging buffer in the bridge.
        reader = '    const rangeReader = this.pdfStream.getRangeReader(begin, end);'
        bounded = '''    const limit = 2 * this.chunkSize;
    if (end - begin > limit) {
      for (let offset = begin; offset < end && !this.#abortReason; offset += limit) {
        await this.sendRequest(offset, Math.min(end, offset + limit));
      }
      return;
    }
''' + reader
        for old, new in [(dynamic, local), (rejection, cancelled), (reader, bounded)]:
            if worker.count(old) != 1:
                raise ValueError('Unexpected PDF.js worker source; review before upgrading')
            worker = worker.replace(old, new)
        files['pdf.worker.mjs'] = ('/* Modified: local JS decoders, bounded reads and cancelled range handling. */\n' + worker).encode()

        resources = {}
        for name in sorted(m.name.removeprefix('package/') for m in archive.getmembers() if m.isfile()):
            path = Path(name)
            if path.name.startswith('LICENSE'):
                files['licenses/' + '-'.join(path.parts) + '.txt'] = read(name)
            elif ((path.parent.name == 'cmaps' and path.suffix == '.bcmap') or
                  (path.parent.name == 'standard_fonts' and path.suffix in {'.ttf', '.pfb'})):
                resources[name] = base64.b64encode(read(name)).decode('ascii')
        files['resources.json'] = (json.dumps(resources, sort_keys=True, indent=2) + '\n').encode()
        # Only the selectable-text styles and page rotation transforms, not the
        # full upstream viewer, annotations, icons, or document scripting.
        css = read('web/pdf_viewer.css').decode()
        text = css[css.index('.textLayer {'):css.index('.textLayerImages {')]
        rotation = css[css.index('\n[data-main-rotation="90"] {'):css.index('\n.pdfViewer {', css.index('\n[data-main-rotation="90"] {'))]
        files['text-layer.css'] = (css[:css.index('*/') + 2] + '\n' + text + rotation).encode()

    for name, value in files.items():
        dest = DEST / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(value)
    print(f'Prepared pdfjs-dist {VERSION}: {len(files)} files, {len(resources)} CMaps and fonts.')


if __name__ == '__main__':
    if sys.argv[1:]:
        prepare(Path(sys.argv[1]).read_bytes())
    else:
        with urlopen(URL, timeout=120) as response:
            prepare(response.read())
