# ADR-006 — Code Generation

## Status: ACCEPTED

## Context

The code generator converts the universal schema into a runnable project. It must produce clean, typed, accessible code that follows best practices. The generator is the bridge between visual design and production code.

## Options

| Approach | Pros | Cons |
|----------|------|------|
| Template-based (EJS/Handlebars) | Simple, predictable | Limited logic, verbose |
| AST-based (Babel/jscodegen) | Precise control | Complex, verbose |
| String concatenation | Fast, direct | Error-prone, hard to maintain |
| Hybrid (chosen) | Predictable templates + AST for imports | Slightly more complex |

## Evaluation

**Hybrid approach:**
- Use template strings for component files (predictable, readable)
- Use AST (recast) only for modifying existing files (agent sync)
- Templates are plain TypeScript with embedded expressions
- Each component type has a `.ts` template file

**Why not full AST:**
- Overkill for generating new files
- Harder to read and maintain
- Performance overhead unnecessary

## Decision

**Template-based generation** with string templates. AST (recast) reserved for future agent sync workflows.

## Consequences

- Positive: Readable templates
- Positive: Easy to modify output format
- Positive: Fast generation (< 5s target)
- Negative: Template maintenance burden (mitigated by clear structure)
- Negative: Edge cases in formatting (mitigated by Prettier post-processing)
