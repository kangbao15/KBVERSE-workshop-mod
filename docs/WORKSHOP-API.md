# KB Workshop API Contract

Base path: `/api/v1`

All endpoints returning private user content require an authenticated session.
The website sends cookies with `credentials: include`.

## Health

`GET /health`

Response:
```json
{ "status": "ok" }
```

## Catalog

`GET /mods?query=&category=&sort=popular&page=1&limit=24`

Response:
```json
{
  "items": [
    {
      "id": "stable-mod-id",
      "name": "Example mod",
      "category": "mod",
      "author": { "name": "Creator" },
      "description": "Description",
      "coverUrl": "https://...",
      "latestVersion": "1.0.0",
      "compatibility": "2.0.x",
      "downloads": 0,
      "rating": null,
      "status": "published"
    }
  ],
  "total": 0,
  "page": 1
}
```

`GET /mods/:id` returns one published listing and its current metadata.

`GET /mods/:id/download` returns the package file or a short-lived download redirect.

## Upload and creator dashboard

`POST /mods`

Content-Type: `multipart/form-data`

Fields:
- `name`
- `category` (`mod`, `shader`, `asset`, `tool`)
- `description`
- `compatibility`
- `hardware`
- `changelog`
- `package` (required)
- `cover` (optional image)

The server must authenticate the creator, validate the package, scan it, store it outside the executable web root, and submit it for review. A successful response should return the new listing with a moderation status.

`GET /me/uploads` returns the authenticated creator's listings and moderation status.

`PATCH /mods/:id` updates an owned draft listing.

`POST /mods/:id/versions` submits a new version for review.

## Accounts and moderation

The backend must provide an authentication/session flow before uploads can be published.

Recommended additional endpoints:
- `GET /auth/session`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /mods/:id/report`
- `GET /admin/review-queue`
- `POST /admin/mods/:id/approve`
- `POST /admin/mods/:id/reject`
- `POST /admin/mods/:id/revoke`

## Security requirements

- Enforce ownership checks on every creator operation.
- Limit package and image sizes.
- Validate file type by content, not filename alone.
- Scan uploaded packages for known malware.
- Keep untrusted packages outside the executable web root.
- Use versioned immutable package artifacts and calculate SHA-256 digests.
- Verify signatures when a trusted signing workflow is established.
- Review packages before public release.
- Provide reporting and version revocation.
- Never execute an uploaded mod on the Workshop server.
- Do not treat malware scanning as a guarantee of safety.

The current KB Loader API v1 accepts JSON `.kbmod.json` packages for code mods. Other package types require corresponding loader support before they can be installed by the editor.
