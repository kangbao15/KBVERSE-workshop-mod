# KB Workshop

Standalone website for the KBVERSE creator community.

## Frontend

- Discover
- Mods
- Shaders
- Assets
- Tools
- My Uploads
- Publish
- Mod details and package download

The frontend displays only data returned by the Workshop API. It does not ship with fake mod listings.

## Run

From the repository root:

```powershell
npm run dev --workspace @kbverse/workshop
```

The default development port is `5180`.

## API configuration

Create `.env.local` in this app:

```env
VITE_WORKSHOP_API_URL=/api/v1
```

Set the value to the real API base URL when the backend is hosted separately. Do not put private API secrets in VITE variables.

## API contract

See `docs/WORKSHOP-API.md`.
