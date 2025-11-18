# AI Coding Agent Instructions

## Project Overview
**Risk Chat Application** – A Next.js 16 frontend for querying enterprise risk findings via RAG (Retrieval-Augmented Generation) with Gemini backend integration. The app displays risk metadata for companies queried by users, including risk categories, priority levels, and detailed findings.

## Architecture & Data Flow

### Component Structure
- **`src/app/page.tsx`** – Root page; initializes `RiskChat` with sample high-priority risk data
- **`src/app/components/RiskChat.tsx`** – Main client component; handles user chat messages and backend communication
- **`src/app/layout.tsx`** – Root layout with Geist fonts and metadata

### Backend Integration
- **API Endpoint**: `http://localhost:8080/retrieve` (POST)
- **Request Format**:
  ```json
  { "query": "string", "k": 5 }
  ```
- **Response Format**:
  ```json
  {
    "response": "string",
    "context": [
      {
        "content": "string",
        "metadata": { 
          "company_name", "risk_category", "risk_subcategory", 
          "priority", "doc_type", "source_name", "duns_id", 
          "file_source_tag", "business_id" 
        }
      }
    ]
  }
  ```

### Data Models
- **`ChatMessage`** – `{ role: 'user'|'assistant', content, context?: RiskContextItem[] }`
- **`RiskContextItem`** – Risk finding with markdown content and structured metadata
- **`RiskMetadata`** – Company risk attributes indexed by priority level and category

## Key Patterns & Conventions

### Client-Side State Management
- Use React hooks (`useState`, `useRef`, `useEffect`) – no external state management
- Messages stored in component state as `ChatMessage[]`
- Auto-scroll to latest message via `useRef` and `scrollToBottom()` on message updates
- Example: `useEffect(() => { scrollToBottom(); }, [messages])`

### Styling & UI
- MUI components preferred (`Box`, `Paper`, `Typography`, `Card`, `TextField`, `IconButton`)
- Color scheme: Light backgrounds (`#f3f4f6`), green for user messages (`#DCF8C6`), indigo for assistant (`#E8EAF6`)
- Use `sx` prop for inline styles; avoid CSS modules for dynamic layouts
- Risk cards rendered inside assistant messages show `company_name` as title, followed by category/subcategory/priority, then full markdown content

### Error Handling
- Backend errors caught in try-catch; show generic "Error: Could not connect to backend." message
- No retry logic; assumes backend is running at `localhost:8080`

### Type Safety
- All types defined in `RiskChat.tsx` (keep co-located)
- Strict TypeScript config enabled; no `any` types
- Metadata keys match exact structure from backend response

## Development Workflow

### Setup & Run
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run lint         # Run ESLint (Next.js core + TypeScript rules)
npm run build        # Production build
npm start            # Serve production build
```

### Key Dependencies
- **Next.js 16**: App Router, server/client components
- **React 19**: Latest hooks API
- **MUI 5**: Material Design components and icons
- **axios**: HTTP client for backend calls
- **TypeScript 5.6**: Strict mode enabled

### ESLint Configuration
- Uses `eslint-config-next/core-web-vitals` + TypeScript
- Ignores `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run `npm run lint` before commits

## Common Tasks

### Adding a New Risk Query Feature
1. Extend `ChatMessage` type if new fields needed
2. Update POST request in `sendMessage()` – adjust `k` parameter or add filters
3. Render new metadata in risk card within assistant message loop
4. Test backend response structure matches `RiskContextItem` type

### Modifying UI Layout
- Keep responsive: `width: '90%'`, `maxWidth: 900` for chat container
- Maintain color contrast for accessibility (current: #DCF8C6 user, #E8EAF6 assistant)
- Use MUI `sx` prop for consistency; avoid breaking auto-scroll behavior

### Debugging Backend Communication
- Check `axios` request/response in browser DevTools Network tab
- Backend must return `response` (string) and `context` (array) or endpoint will fail
- Set `API_URL` at top of `RiskChat.tsx` for environment-specific backends

## Path Aliases
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Use for imports: `import RiskChat from '@/app/components/RiskChat'`

---
**Last Updated**: November 2025 | **Tech Stack**: Next.js 16, React 19, MUI 5, TypeScript 5.6
