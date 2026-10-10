# General **most important **

- Naming must be explicit. Avoid generic naming. Long naming is fine for clear and readable naming.
  - e.g use `isProfileCompeleted` instead of `isCompleted`
  - e.g use `sourceActivityList` instead of `sourceList`
- Avoid naming that can conflicts with other naming. Be specific when necessary.
  - e.g use `ShortFormTranscript` and avoid `ShortForm` or `Transcript` if there is `ShortFormScene` and `ShortFormTranscript`.

## Split logic / concern / flow / responsibility

- For complex logic, split flow as soon as possible to make logic flow simple.
  - e.g when you need to handle returning user and new user, first check user type and split flow.
  - then handle each case separately. Duplicate logic could be a modularizing and shared in both flows.
  - So split concern, domain, and responsibility earlier. unless it is better to handle together.
- When you create fronend code it should be same. Design component structure first with splitting concerns and implement.
- This is to have better code structure and readability. So we can maintain code easily.
- More files are better than one file with long line

## Refactor and reuse

- When create new component/widget, service based on existing one, refactor first and reuse it. So we can share code and reduce redundant works unless it is not worth to do it.

## Platform-specific logic

- When platform behavior differs (iOS vs Android, web vs native, etc.), branch out clearly and modularize the platform-specific path. Keep shared logic above and below the branch like a sandwich.

  ```
  shared logic
    ↓
  platform-specific path  (one named function per platform — e.g. _doX_ios, _doX_android)
    ↓
  shared logic
  ```

- Don't intersperse `Platform.is*` checks throughout the body. Decide once where to branch, name the branched functions explicitly, and let the reader see the platform's role at a glance.

- Document the platform difference at the branch — explain *why* the platforms diverge, not just that they do. Future readers shouldn't have to dig through plugin source to understand the split.

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
- don't use for loop unless there is other method.s
  - use Promise.all , BPromise.map, BPromise.map series
  - use array methods like forEach, map, filter, reduce, every, some and et

  ```typescript
  /**
   * instead of
   * for (const a of b) {}
   **/

  b.forEach(() => {});
  b.filter(() => {});
  b.map(() => {});

  BPromise.map(b, async (item) => {});
  BPromise.mapSeries(b, async (item) => {});
  ```

- use switch cae instead of if else statement
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
