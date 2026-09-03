# Security & Data

The rules for keeping data safe and controlling access, for what this site actually is: a static,
public, read-only page built from committed JSON. [architecture.md](architecture.md) owns the
layering; this doc owns the trust boundary.

## Trust model

This is a static site built from JSON files and deployed as HTML. There is no runtime authentication,
no database, and no privileged server routes. All lesson data is **public at build time** and **read
only at browse time**.

**Access rule:** anyone with a browser can read the timetable. There is no write path, no sign-in,
and no per-user views. If the site moves behind auth (e.g., school intranet), apply network-level
controls, not code controls.

## Data ownership

- **JSON source files** are the source of record. They are version-controlled and committed to git.
- **Build output is immutable.** The static HTML is generated once from the JSON and deployed.
  There is no runtime mutation or personalization.
- **No secrets in the codebase.** If the site is deployed to a public host, assume all content is
  public. Never commit API keys, passwords, or private identifiers.

## Input handling

There is no user input at build or browse time. All data comes from JSON files, which are authored by
hand or imported from a trusted source.

If a feature adds user input (e.g., a form that sends data somewhere), that becomes a new path and
requires:

- Input validation and sanitization
- HTTPS for any data leaving the browser
- A threat model for the destination service
- Rewrite this doc to cover the new path

## Scenarios where this changes

- **Adding a contact form or feedback endpoint:** input validation, rate limiting, privacy
  compliance (GDPR, etc.), and secure delivery required.
- **Moving to server rendering or a database:** authentication, authorization, session management,
  secrets management.
- **Personalizing content per user or school:** access control rules, audit logging.

Until then, assume the content is static and public.
