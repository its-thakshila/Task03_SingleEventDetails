# Backend Test Suite

## Running the tests

```powershell
Set-Location -Path "d:\MY ACA\SEM 4\CO227\Task03_SingleEventDetails\backend"
npm run test
```

## Notes

- The integration suite exercises only the Single Event Detail endpoints (event payload, status, and interested flows).
- The unit suite covers the status computation helper used by the page (`computeEventStatus`).
- Shared Supabase calls are mocked; no real database credentials are required for the current tests.
