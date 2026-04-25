---
title: Campaign Wizard Path Selection Screen
date: 2026-04-24
status: approved
---

## Problem

The Campaign Wizard at `/dashboard/campaigns/new` drops the user directly into Q1. There is no way to reach the CSV import flow from this entry point. Users who already have a lead list must navigate separately.

## Goal

Add a choice screen before Step 1 that lets users pick their path: guided wizard or CSV import.

## Approved Approach

Inline embed (Option A): `new/page.tsx` owns a `path` state variable. When null, it renders a choice screen. Selecting a path renders the appropriate content without a route change, so the back button can reset `path` to null and return the user to the choice screen.

`import/page.tsx` remains as a standalone route (no changes).

## Component Structure

```
NewCampaignPage                   (state: path = null | 'wizard' | 'csv')
  SharedHeader                    (Back link + close X, always visible)
  ChoiceScreen                    (rendered when path === null)
  WizardContent                   (rendered when path === 'wizard', existing Suspense wrapper kept)
  CsvImportContent                (rendered when path === 'csv', extracted from import/page.tsx)
```

## Choice Screen

Two cards, side by side, centered vertically on screen.

**Start from scratch**
- Subtitle: "Answer 5 questions, we'll find the right audience"
- onClick: setPath('wizard')

**Import CSV**
- Subtitle: "Upload your existing lead list"
- onClick: setPath('csv')

Styled consistently with existing wizard dark theme (bg #060606, orange accent #FF5200).

## CsvImportContent

Extract the body of `ImportCSVPage` (everything below the header) into a `CsvImportContent` component. The shared `NewCampaignPage` header replaces the import page's header. The "Back" button in the shared header resets `path` to null when `path === 'csv'`.

The existing `import/page.tsx` file is left untouched - it still works as a standalone route.

## Back Navigation

| Current path | Back button behavior |
|---|---|
| null (choice screen) | Link to /dashboard (existing behavior) |
| 'wizard' | resets path to null |
| 'csv' | resets path to null |

## Debug Checklist

- Choice screen shows before Step 1: path starts null, WizardContent never mounts until path === 'wizard'
- Buttons route to correct components: setPath calls trigger conditional render
- User can go back and change path: back button resets path to null from both sub-views
