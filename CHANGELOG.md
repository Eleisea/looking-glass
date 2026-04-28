# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-28

### Added
- New "LookingGlass" brand identity.
- Settings Drawer Tab with renderer location selection (Floating Window or Profile Panel).
- Profile Panel Injection: Notes are now rendered directly into the character profile sidebar.
- Support for `charCreatorNotes` and `creatorNotes` custom extension fields.
- Custom SVG icon for the drawer tab.
- Changelog and version tracking.

### Changed
- Renamed extension from `creators_notes_renderer` to `LookingGlass`.
- Tab short name changed to "LookGlass".
- Refactored frontend to use a settings-driven architecture.
- Improved backend data retrieval to prioritize custom extension fields (more robust search).

### Fixed
- Issue where multiple empty drawer tabs were spawned during hot-reloads or re-registrations.
- Permission issues by adding `app_manipulation` and `ui_panels` requirements.
- Bug where profile panel injection failed due to strict CSS module selectors.
- Bug where creator notes were not found in certain character card formats (added `creatorNotes` support).

