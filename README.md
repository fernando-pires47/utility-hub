# Utility Hub

Utility Hub is an extensible React SPA with local, browser-only tools for text, images, and SQL. Originally a text formatter, the project now provides independent utility workspaces; Formatter is one tool in the collection rather than the identity of the application.

## Features

### Utilities

- **Formatter**: Format and compare JSON/XML or plain text, restructure relaxed JSON, and validate strict JSON. Native editor undo/redo is preserved when pasting and auto-formatting content.
- **Image ↔ Base64**: Upload PNG, JPEG, GIF, WebP, SVG, BMP, ICO or AVIF images, copy raw Base64 or a data URL, or paste either representation to preview and download the image. The browser validates images before enabling download.
- **Text Case**: Convert editable text to lowercase or uppercase and copy the result.
- **SQL Formatter**: Format Standard SQL, PostgreSQL, MySQL, SQLite, SQL Server or Oracle PL/SQL queries. Queries are formatted, never executed.

### Shared experience

- **Utility sidebar and shareable routes**: Switch tools without losing workspace content or open a utility directly by URL.
- **Local processing**: Text, SQL, and images are processed in the browser, not sent to a server.
- **Copy to clipboard**: Copy text case results, formatted SQL, image Base64/data URLs, and restructured JSON.
- **Responsive themes**: Light/dark themes with a responsive sidebar and workspaces.
- **Extensible registry**: Add independent tools through `src/tools.ts`.

### Formatter comparison

- **Side-by-side differences**: Both upper editors highlight removed/added lines while remaining editable. The lower box provides the structural JSON/XML comparison. Line differences can include whitespace and key ordering even when JSON values are structurally identical.
- **Resizable panels**: Drag the desktop divider or use Hide/Show right panel. Collapsing keeps its content.
- **Optional lower comparison**: Hide/show the bottom differences area to give the editors more space.
- **Saved preferences**: Formatter tabs, panel visibility, and the shared theme retain their existing local storage persistence.

## Technologies Used

- **React 19** with **TypeScript**
- **Vite** for fast development and building
- **React Router** for shareable utility routes
- **Custom CSS utilities** for styling
- **Native JSON.stringify()** for JSON formatting
- **JSON5** for safely parsing relaxed JSON syntax without executing code
- **xml-formatter** for XML formatting
- **sql-formatter** for dialect-aware SQL formatting

## Project Structure

```
src/
├── components/
│   ├── FormatterTool.tsx     # Formatter tabs and comparison workspace
│   ├── TabView.tsx           # Editable highlighted panels and lower comparison
│   ├── ImageTool.tsx         # Image/Base64 conversion and download
│   ├── TextCaseTool.tsx      # Lowercase/uppercase conversion
│   └── SQLTool.tsx           # SQL formatter workspace
├── utils/
│   ├── formatters.ts         # JSON and XML formatting logic
│   ├── clipboard.ts          # Copy to clipboard utility
│   ├── image.ts              # Image decoding and browser validation
│   ├── sql.ts                # Dialect-aware SQL formatting
│   └── textDiff.ts           # Line differences for editable panels
├── tools.ts                  # Extensible sidebar/tool registry
├── App.tsx                   # Main application component
├── main.tsx                  # Application entry point
└── index.css                 # Custom CSS utilities and styles
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Usage

Choose a utility from the sidebar or open its route directly:

| Utility | Route |
| --- | --- |
| Formatter | `/formatter` |
| Image | `/image` |
| Text Case | `/text-case` |
| SQL | `/sql` |

### Formatter

1. Select **Formatter** in the sidebar.
2. Paste JSON or XML into either upper editor; valid pasted content is formatted automatically.
3. Paste the second text to highlight line differences in both editors and structural differences in the lower box.
4. Use the panel controls to hide the right editor or the lower comparison independently.

Each input panel also has **Restructure JSON** and **Validate JSON** buttons. For example, restructuring `{ teste: '123' }` produces `{ "teste": "123" }` with indentation. Validation is strict and rejects the original relaxed syntax. Unsupported JavaScript expressions and non-finite numbers are not converted.

On desktop, drag the divider all the way right to collapse the right panel; drag it back to restore it. The focused divider also supports arrow keys, Home/End, and double-click to reset to equal widths. **Hide right panel** / **Show right panel** works on mobile too.

Use **Hide differences** / **Show differences** to toggle the bottom comparison area. While hidden, the input panels expand into the available space; comparisons remain up to date when shown again.

The bottom comparison is hidden by default. Its visibility and the right panel's collapsed/expanded state are saved in local storage and restored after reloading. Collapsing the right panel via the divider also saves that preference. Clearing Formatter tabs does not reset these layout preferences.

Drag the horizontal divider above the differences to resize their height. It also supports up/down arrow keys, Home/End, and double-click to reset. Hiding and showing differences keeps the selected height.

Use the sidebar to select **Image**, **Text Case** or **SQL**. Tool contents are preserved while switching menus; Formatter tabs also retain their existing local storage persistence. No utility sends content to a server.

Each utility has a shareable URL: `/formatter`, `/image`, `/text-case` and `/sql`. Opening or reloading a link goes directly to that tool; browser back/forward navigation also works. `/` and unknown paths redirect to `/formatter`. Links share the utility, not your text or images.

To add a utility, create its component and register its ID, path, label, icon and component in `src/tools.ts`. Utilities load on first use and remain mounted afterward to preserve their state.

The production Docker image uses `nginx.conf` to serve `index.html` for utility routes. Other static hosts must also rewrite non-file paths to `index.html` for shared links and page reloads to work.

For Docker, run `docker compose up --build utility-hub` for production or `docker compose --profile dev up utility-hub-dev` for development.

Existing local storage keys retain their original `text-formatter` namespace for compatibility, so the rename does not discard saved Formatter tabs, layout preferences, or theme.

Run `npm test` for JSON, SQL, image conversion and editor difference tests.

## Example Inputs

### JSON
```json
{"name":"John","age":30,"city":"New York","hobbies":["reading","swimming"]}
```

### XML
```xml
<root><name>John</name><age>30</age><city>New York</city><hobbies><hobby>reading</hobby><hobby>swimming</hobby></hobbies></root>
```

## How It Works

The application uses a tool registry (`src/tools.ts`) to build the sidebar and workspaces. Formatter uses persistent tabs, native textarea editors with background line highlights, and a structural JSON/XML diff. The other tools keep their state in React while switching menus and load on demand.

Error handling is built-in for invalid syntax and clipboard operations.

## License

MIT License
