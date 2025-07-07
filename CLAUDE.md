# Quranic Recitation Analysis PWA

## Project Architecture
- **Frontend**: React 18+ with TypeScript, Zustand for state management
- **Audio Processing**: WebAssembly modules for DTW/HMM algorithms
- **PWA**: Service Workers with offline-first architecture
- **UI Framework**: Material UI 3 with custom audio components
- **Backend**: Node.js with Express, WebSocket for real-time processing
- **Deployment**: AWS/Vercel with CloudFront CDN

## Core Conventions
- Use functional components with React hooks
- TypeScript strict mode enabled
- Audio processing in separate WebAssembly modules
- Offline-first PWA architecture
- Mobile-first responsive design
- WCAG 2.2 AA compliance for accessibility
- Component-driven development with Storybook
- Test-driven development with Jest/React Testing Library

## Audio Processing Pipeline
1. Input: Web Audio API → AudioWorklet
2. Feature Extraction: MFCC using Meyda.js
3. Classical Processing: DTW/HMM in WebAssembly
4. Tajweed Analysis: Rule-based pattern matching
5. Output: Real-time visualization and feedback

## Key Commands
- `npm run dev` - Start development server
- `npm run test` - Run test suite
- `npm run build:wasm` - Compile WebAssembly modules
- `npm run storybook` - Component development
- `npm run analyze` - Bundle size analysis
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

## Project Structure
```
src/
├── components/
│   ├── audio/           # Audio recording and playback
│   ├── analysis/        # Tajweed analysis components
│   └── common/          # Shared UI components
├── services/            # Business logic and API calls
├── algorithms/          # Signal processing algorithms
├── wasm/               # WebAssembly modules
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── store/              # Zustand state management
```

## Development Workflow
1. Create feature branch from main
2. Implement component with tests
3. Add Storybook stories for UI components
4. Run lint and typecheck before commit
5. Create PR with comprehensive description
6. Deploy to staging for testing
7. Merge to main after review

## Testing Strategy
- Unit tests for algorithms and services
- Component tests with React Testing Library
- Integration tests for audio pipeline
- E2E tests with Playwright
- Performance tests for WebAssembly modules
- Accessibility tests with axe-core

## Performance Requirements
- First Paint < 1.5s
- Time to Interactive < 3s
- Audio latency < 100ms
- Memory usage < 100MB
- Bundle size < 2MB
- 95+ Lighthouse score

## Accessibility Guidelines
- WCAG 2.2 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Touch targets ≥ 44px
- Focus indicators visible
- Audio transcripts available

## Security Considerations
- CSP headers configured
- XSS protection enabled
- HTTPS enforced
- Secure audio processing
- No sensitive data in localStorage
- Privacy-first design