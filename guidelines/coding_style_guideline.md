# General **most important **

- Naming must be explicit. Avoid generic naming. Long names are fine when they make code clear and readable.
  - e.g. use `isOnboardingCompleted` instead of `isCompleted`
  - e.g. use `hotdogClassificationList` instead of `list`
- Avoid names that can conflict with other names. Be specific when necessary.
  - e.g. use `HotdogImageUploadSession` rather than `UploadSession` when other upload concepts exist.

## Split logic / concern / flow / responsibility

- For complex logic, split flow as soon as possible to make logic flow simple.
  - e.g when you need to handle returning user and new user, first check user type and split flow.
  - then handle each case separately. Duplicate logic could be a modularizing and shared in both flows.
  - So split concern, domain, and responsibility earlier. unless it is better to handle together.
- Frontend code follows the same rule. Design component structure first with splitting concerns and implement.
- This is to have better code structure and readability. So we can maintain code easily.
- Prefer several focused files over one long file — but don't add a layer that doesn't earn its place (see CLAUDE.md rule 7).

## Refactor and reuse

- When create new component/widget, service based on existing one, refactor first and reuse it. So we can share code and reduce redundant works unless it is not worth to do it.

## Branching by context

- When behavior differs by context (e.g. server vs browser, guest vs saved visitor), branch out clearly and modularize each path. Keep shared logic above and below the branch like a sandwich.

  ```
  shared logic
    ↓
  context-specific path  (one named function per context — e.g. _classifyForGuest, _classifyForSavedVisitor)
    ↓
  shared logic
  ```

- Don't scatter context checks throughout the body. Decide once where to branch, name the branched functions explicitly, and let the reader see each context's role at a glance.

- Document the difference at the branch — explain *why* the paths diverge, not just that they do.

## User facing text

- User facing text must be user friendly and easy to understand.
  - e.g "We are having trouble, please try later" instead of "Problem, try again"
- Any user-facing text must be considered in i18n. Add key and value in i18n files.
  - It should be natural and contextually appropriate for the position of the text at user aspect
- Create code considering readability, scalability, maintainability, and performance. Prioritize in that order.

# typescript

- avoid 'else' statement. use another if statements to clarify

  ```typescript
  // must be empty line before
  if (statement) {
    return;
  }
  if (!statement) {
    // instead of else
  }
  ```

- use early return
- don't use one line if state and return
  - should do always
  ```typescript
  // must be empty line before
  if (statement) {
    return;
  }
  ```
- don't use for loops unless there is no other way
  - use array methods like forEach, map, filter, reduce, every, some, etc.
  - async: `Promise.all` for independent work; when steps must run in order or share state, chain them with `reduce`

  ```typescript
  /**
   * instead of
   * for (const a of b) {}
   **/

  b.forEach(() => {});
  b.filter(() => {});
  b.map(() => {});

  await Promise.all(b.map(async (item) => {}));
  await b.reduce(async (previous, item) => {
    await previous;
    // runs one item at a time
  }, Promise.resolve());
  ```

- use switch/case instead of if/else chains
  ```typescript
  switch (type) {
    case A:
    case B:
    case C:
    default:
  }
  ```

# React

- don't define component inside of a component. component function must be in file scope level.
