# ArrExtension Setup Tab Full-Width Design

**Date:** 2026-05-08

## Context
The setup page exists as an extension tab (`setup.html`), but it still visually feels like a popup-sized panel. This spec defines a full-tab layout using the existing visual system and components, without introducing a new UI system.

## Goals
- Make the setup page feel like a full browser tab, not a popup-sized card.
- Keep the existing visual system, typography, and component styles.
- Close the setup tab immediately when the user clicks Done.
- Preserve existing app management behavior and data flows.

## Non-Goals
- New visual theme, fonts, or color palette.
- New windowing or multi-window system.
- Changes to the storage model or permission logic.

## Surface and Navigation
- The setup experience stays in the existing `setup.html` tab opened by the current helper.
- The page uses the full viewport with a layout that scales across wide and narrow windows.
- The Done action closes the tab immediately on click.

## Layout and Information Architecture
- Two-region layout for desktop widths:
  - Left column: app list and status actions.
  - Right column: add or edit form.
- On narrow widths, the layout stacks with the list first and the form second.
- The Add app action is anchored to the list area and always visible.
- App list rows show status inline, including Permission required and Ready, with a visible Grant permission action.
- The form stays focused on the current app with no additional side panels.

## Visual Style and Messaging
- Reuse the current visual system and typography from the popup styles.
- Scale spacing and layout to the tab context (more breathing room, full-width shell).
- Provide a single, consistent message region near the top of the form area for success and error feedback.
- Emphasize permission states through clear copy first, not color alone.

## Component and Styling Notes
- Continue using `AppSettingsPanel` and related components without new component families.
- Extend setup-specific layout styles in `entrypoints/setup/style.css`.
- Ensure the page fills the viewport height to remove the popup-sized feel.

## Data Flow and Behavior
- No new data flow or storage changes.
- Permission checking and grant actions remain as implemented in `SetupPage`.
- Done closes the tab immediately via `window.close()`.

## Error Handling and States
- Keep existing error messages returned from connection tests.
- Show permission-denied states inline with explicit guidance to grant permission.
- Ensure message banner styling works at full width and does not look cramped.

## Testing
- Manual validation: open `setup.html` in a tab and confirm full-width layout.
- Confirm the Done action closes the tab.
- Confirm permission-required rows show the Grant permission action and the message region updates as expected.
- Confirm layout stacks cleanly on narrow widths.

## Success Criteria
- The setup page fills the tab and no longer feels constrained to popup size.
- The layout supports multiple apps with clear statuses and actions.
- Done closes the tab reliably.
- Visual changes reuse the existing system without introducing a new theme.
