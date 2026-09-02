# Extension UI preview

This checked-in harness renders extension UI against predictable mock browser
and device state. Use it for visual development and screenshots instead of
creating one-off harnesses outside the repository.

Run it from `web-extension`:

```sh
pnpm preview:ui
```

Then open <http://127.0.0.1:4174>. The default scenario can also be selected
explicitly at <http://127.0.0.1:4174/?scenario=autofill-controls>.

To cover a new user-visible feature:

1. Add a preview component under `scenarios/` that imports the production UI.
2. Register it in `main.tsx` with a stable scenario name.
3. Extend the checked-in browser or device-state mocks when the component needs
   another capability.
4. Run `pnpm preview:ui:check` and capture the rendered scenario into
   `docs/screenshots/`.

Run the isolated Playwright suite for preview interactions with:

```sh
pnpm playwright:ui-preview
```

Keep reusable preview code and fixtures in this directory. Do not place them in
`/tmp`.
