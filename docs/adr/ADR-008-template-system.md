# ADR-008 — Template System

## Status: PROPOSED

## Context

Templates must be first-class. Users create components, sections, pages, flows, design systems, and project starters. Templates need to be portable between installations.

## Decision

**JSON-based template format** matching the universal schema, with variable substitution and dependency declarations.

## Consequences

- Templates are just schema subsets
- Variables are simple `{ "name": "primaryColor", "type": "color", "default": "#3b82f6" }`
- Dependencies declared for npm packages
- Import records source repository and license
- Templates are stored in LibSQL + filesystem
