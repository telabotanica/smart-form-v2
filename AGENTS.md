# AGENTS.md - Coding Guidelines for smart-form-v2

## Project Overview

Angular v20 application using:
- **Framework**: Angular with standalone components (no NgModules)
- **Language**: TypeScript 5.9 with strict mode
- **Styling**: Tailwind CSS v4
- **Testing**: Karma + Jasmine
- **Linting**: ESLint with Angular/TypeScript rules
- **Locale**: French (fr-FR)

## Build / Lint / Test Commands

```bash
# Development
npm start                    # Start dev server
npm run watch               # Build with file watching

# Building
npm run build               # Production build
npm run build -- --configuration=development
npm run build -- --configuration=beta

# Testing
npm run test                # Run all tests
npm run test -- --include='**/app.spec.ts'     # Single test file
npm run test -- --include='**/feature/**/*.spec.ts'

# Linting
npm run lint                # Lint all files
npm run lint -- --fix       # Auto-fix issues
```

## TypeScript Guidelines

- **Strict mode**: Avoid `any`, use `unknown` when uncertain
- **Return types**: Explicitly declare all function returns
- **Types over interfaces**: Use `type` for object definitions
- **No public modifier**: It's default, use `private`/`protected` only
- **Naming**:
  - Variables/functions: `camelCase`
  - Classes/Types: `PascalCase`
  - Constants: `UPPER_CASE`

## Angular Components

- **Standalone**: Always use standalone (don't add `standalone: true`, it's default)
- **Selectors**: `app-` prefix with `kebab-case` (e.g., `app-header`)
- **Naming**: Class names without "Component" suffix (e.g., `Header`, `UserProfile`)
- **Files**: Lowercase with hyphens (e.g., `header.ts`, `user-profile.ts`)
- **Change detection**: Always `changeDetection: ChangeDetectionStrategy.OnPush`
- **State**: Use `signal()` for local state, `computed()` for derived
- **Inputs/Outputs**: Use `input()` and `output()` functions, not decorators
- **Injection**: Use `inject()` function, not constructor
- **Host bindings**: Use `host` property in decorator, NOT `@HostBinding`/`@HostListener`

## Templates

- Use native control flow: `@if`, `@for`, `@switch` (NOT `*ngIf`, `*ngFor`)
- Use `class` bindings instead of `ngClass`
- Use `style` bindings instead of `ngStyle`
- **No arrow functions in templates** (not supported)
- **Don't assume globals** like `new Date()` are available
- Keep templates simple - avoid complex logic
- Prefer inline templates for small components

## Services

- Single responsibility principle
- Use `providedIn: 'root'` for singletons
- Use `inject()` for dependencies

## Forms

- Prefer Reactive forms over Template-driven

## Images

- Use `NgOptimizedImage` for static images (not for inline base64)

## Imports

- Group: Angular core, Angular modules, third-party, local
- Sort alphabetically within groups
- Use single quotes

## File Organization

```
src/
  app/
    core/           # Singleton services, guards, interceptors, models
    features/       # Feature modules (fiche, sentier, taxon, occurrence)
    shared/         # Shared components, services, pipes, models
    pages/          # Page-level components
  environments/     # Environment configs
```

## ESLint Rules (Key)

- Max line length: 120 (code), 160 (comments)
- Max lines per file: 400
- Max complexity: 20
- Strict equality (`===`) required
- No `console` restrictions
- Prefer arrow functions

## Prettier Configuration

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "parser": "angular"  // for *.html files
}
```

## Workflow Guidelines

1. **Plan First**: Enter plan mode for non-trivial tasks (3+ steps)
2. **Use Subagents**: Offload research/exploration to keep context clean
3. **Self-Improvement**: Update lessons.md after any correction
4. **Verify Before Done**: Never mark complete without proving it works
5. **Demand Elegance**: Ask "Is there a more elegant way?" for non-trivial changes
6. **Autonomous Bug Fixing**: Fix bugs directly without hand-holding

## Error Handling

- Always include error handling
- After writing/modifying code: identify 3 potential bugs/edge cases
- Rewrite to address those issues

## References

Additional rules in:
- `.aiassistant/rules/instructions.md`
- `.aiassistant/rules/aiassistant.md`
- `.aiassistant/rules/workflow.md`

Do not run commands without asking first.
