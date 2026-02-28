# Habit Tracker v1 PRD

## Summary
A simple browser-based habit tracker that shows habits as rows and dates as columns (14 days starting today). Users click cells to cycle blank → yes → no. A progress bar shows overall completion percentage based on rules below. Habits can be added/removed. Data persists via localStorage.

## Users
Single user running the app locally (no login).

## Core user stories
1. View a grid of habits (rows) x dates (columns) for the next 14 days.
2. Click a cell to cycle: blank → yes → no → blank.
3. Add a new habit via an input field.
4. Remove a habit from the list.
5. See a progress bar update instantly showing completion percent.
6. Refreshing the page keeps my data.

## Dates
- Render 14 days starting from "today" in the user’s local time.
- Use ISO date keys (YYYY-MM-DD) for storage.
- Header can display friendly labels (e.g., Fri 2/27).

## Cell states
- blank: no explicit status
- yes: completed
- no: not completed

## Progress calculation rules
- A date is considered "active" if at least one cell in that date is yes or no.
- Only active dates contribute to progress.
- For an active date, all habits are counted for that date:
  - yes counts as completed
  - no counts as not completed
  - blank counts as not completed (implicit no)
- Completion percent = total_yes / (active_dates_count * habits_count) * 100
- If there are zero active dates or zero habits, show 0%.

## UI requirements
- Grid with sticky habit column on the left and sticky date header on top (nice-to-have).
- Each cell shows:
  - blank: empty
  - yes: ✓
  - no: ✕
- Progress bar + percent label.
- Buttons:
  - Reset all data
  - Clear one date (nice-to-have; optional)
- Add habit input + button.

## Persistence
Use localStorage key: "habitTracker:v1"
Store:
- habits: array of {id, name}
- entries: { [habitId]: { [dateISO]: "yes"|"no"|"" } }

## Non-functional
- Static site: index.html, styles.css, script.js
- No backend
- Works in modern browsers