# Frontend Development Guidelines

## Build Primitive UI and use them

- Build complex components up from primitive UI components (`components/primitives/`).
- Primitive UI components should be reusable and shareable.
- This reusable pattern, with concerns and responsibilities split, is crucial for maintainability and scalability.

## Split heavy logic from UI

- When logic is heavy, move it out of the component into a custom hook (`hooks/`).

## Component structure

- Encourage refactoring into smaller components to have better code structure and readability.
  - If a domain has different types, create a component per type and let a container render the right one.
  - If a component has multiple steps, create a component per step and let a container render the current one.
  - If a component has a loading state, put the loading UI in its own component.
