# OFD Viewer

A pure static OFD preview tool built with Vite and Vue. It parses local `.ofd` files directly in the browser and does not require any backend service.

## Features

- Select local `.ofd` files
- Drag and drop `.ofd` files
- Session-only upload history
- Document preview area
- Previous / next page
- Page number display and page jump
- Zoom in / zoom out / fit width
- Loading state
- Error messages
- Light / dark theme toggle

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The default dev URL is usually:

```text
http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

## Project Structure

```text
.
├── index.html
├── package.json
├── README.md
└── src
    ├── app.js
    ├── main.js
    └── styles.css
```

## Implementation Notes

- OFD rendering is powered by [`@zhuyunjing/file-viewer-ofd`](https://www.npmjs.com/package/@zhuyunjing/file-viewer-ofd).
- The UI is built with Vue 3 and DaisyUI, with both light and dark themes available.
- Uploaded files are stored only in the current browser session. Refreshing the page or leaving the site clears the history.
- The app is fully static. All parsing happens locally in the browser.

## Known Limitations And Compatibility

1. This version focuses on a working baseline preview flow. Rendering compatibility still depends on the third-party OFD library. Some OFD files with complex structure, signatures, or embedded resources may render incorrectly or fail to load.
2. The current fit-width behavior relies on the underlying library's `auto` scale mode. Complex layouts may still require manual zoom adjustment.
3. Chromium-based browsers such as Chrome and Edge are recommended for the best compatibility. Other browsers may behave differently because of Canvas, font, or archive parsing differences.
4. There is no backend conversion service in this project, so OFD to PDF conversion, server-side rendering correction, and batch processing are not supported.

## Possible Next Steps

- Thumbnail sidebar
- Text search
- Document outline
- Annotation and signature details
- Replacing or wrapping the underlying OFD renderer to improve compatibility

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
