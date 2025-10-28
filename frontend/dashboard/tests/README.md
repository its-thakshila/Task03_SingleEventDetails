# Frontend Test Suite

## Running the tests

```powershell
Set-Location -Path "d:\MY ACA\SEM 4\CO227\Task03_SingleEventDetails\frontend\dashboard"
npm run test
```

## Notes

- The suite currently targets the Single Event Detail page only (integration tests under `pages/`) and exports a small utility unit test under `unit/`.
- Shared mocks and globals live in `tests/setup.js` and are wired via `vitest.config.js`.
