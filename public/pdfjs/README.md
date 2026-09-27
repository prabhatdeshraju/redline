# pdf.js worker

`pdf.worker.min.mjs` is a byte copy of
`node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs`, served from here so the
browser can start pdf.js's worker from the site's own origin.

It is committed rather than bundled because the worker is loaded by URL at
runtime, not imported, so no bundler sees the reference.

**It has to match the installed `pdfjs-dist` version.** When that dependency
changes, copy the file again:

    cp node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs public/pdfjs/

`tests/pdf-worker-matches-the-dependency.test.ts` fails if the two ever drift.
