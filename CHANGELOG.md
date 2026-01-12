# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-01-12

### Added
- **Docker**: Implemented full build system attestations (provenance, SBOM) and OCI labels for enhanced supply chain security.
- **Docker**: Added `scripts/build_docker.sh` for automated builds with attestations.

## [0.1.0] - 2026-01-12

### Changed
- **Security**: Upgraded Docker base image from Node 20-alpine to Node 24-alpine (latest LTS) to further reduce image size and vulnerabilities.
- **Authentication**: Refactored session management to be Edge-compatible, fixing `net::ERR_EMPTY_RESPONSE` in production.
- **Auth Flow**: Improved email confirmation flow with a dedicated "Email Confirmed" page and auto-login Support.
- **UX**: Added automatic redirect from `/login` for authenticated users.

### Fixed
- Fixed missing client-side Supabase environment variables in Docker builds using build-args.
- Improved error handling in the authentication callback to show specific "Browser Mismatch" or "Link Expired" messages.
- Created missing `/auth/auth-code-error` page to prevent 404s during failed login attempts.

## [0.0.1] - 2026-01-08

### Added
- Initial Release

[unreleased]: https://github.com/Dhia-Bechattaoui/app-destiny/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Dhia-Bechattaoui/app-destiny/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Dhia-Bechattaoui/app-destiny/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/Dhia-Bechattaoui/app-destiny/releases/tag/v0.0.1
