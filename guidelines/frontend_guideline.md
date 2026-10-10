# Frontend Development Guidelines

## Build Primitive UI and use them

- We are stacking logics from primitive ui components to complex components.
- Primitive ui components should be reusable and shareable.
- This re usable pattern with splitting concerns and responsibilities are crucial for maintainability and scalability.

## Consider to split heavy logics from UI

- Some logics are heavy and this case we should split them from UI and use hooks or custom hooks.

## Copmonent structure

- Encourage refactoring into smaller components to have better code structure and readability.
  - Like if one domain has different types, then this could be good place to create components for each type and container render them based on type.
  - If one component has multiple steps, this should be good place to create components for each step and container render them based on step.
  - If a component has loading logic, this loading component should be separated from main component.
