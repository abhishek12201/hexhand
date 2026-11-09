# Decisions

- P0 uses the outer `hexhand` repository as the deployment root and keeps the IWSDK scaffold in `app/`. The project Pages build uses `/hexhand/`; local development uses `/`.
- Keep generated MCP and agent skill files as optional tooling only. MCP configs use absolute pre-relocation paths, and host support for the skills is not verified, so P0 does not rely on them.

## P1 scaffold inventory

No files were deleted or replaced. The following files are present in `app/public/`; the `AGENTS.md` files are scaffold guidance, not runtime assets.

| File | Size | Provenance |
|---|---:|---|
| `app/public/audio/chime.mp3` | 3,987 bytes | Scaffold-provided sample; not authored by the project author; license/provenance not verified |
| `app/public/scenes/AGENTS.md` | 3,514 bytes | Scaffold-generated guidance |
| `app/public/scenes/main.iwsdk.scene.json` | 11,932 bytes | Scaffold starter scene, not authored by the project author |
| `app/public/ui/AGENTS.md` | 2,804 bytes | Scaffold-generated guidance |
| `app/public/ui/label-grab.uikitml` | 1,038 bytes | Scaffold starter UI, not authored by the project author |
| `app/public/ui/label-select.uikitml` | 1,044 bytes | Scaffold starter UI, not authored by the project author |
| `app/public/ui/label-spin.uikitml` | 1,038 bytes | Scaffold starter UI, not authored by the project author |
| `app/public/ui/welcome.uikitml` | 1,686 bytes | Scaffold starter UI, not authored by the project author |

The starter scene also loads the following non-authored media:

| Asset | Size | Provenance |
|---|---:|---|
| `https://cdn.jsdelivr.net/npm/@iwsdk/example-assets@0.4.2/assets/robot/robot.gltf` | 179,600 bytes | IWSDK example asset; not authored by the project author |
| `82f7622c553a011ccb45883b167253b8.png` (robot screen 1) | 32,869 bytes | Referenced by the remote glTF; not authored by the project author |
| `288d754a3fb5199c07278aa1e889259c.png` (robot screen 2) | 46,973 bytes | Referenced by the remote glTF; not authored by the project author |
| `cf3bcdd483ef6bf07dc1fba58d988ef6.png` (robot emissive) | 14,142 bytes | Referenced by the remote glTF; not authored by the project author |
| `86677bb00f5b899e5b8123e68b1e4d7b.png` (robot ORM) | 639,670 bytes | Referenced by the remote glTF; not authored by the project author |
| `c6378ca88952228817e344695bd6ec8c.png` (robot color) | 107,798 bytes | Referenced by the remote glTF; not authored by the project author |
| `app/public/audio/chime.mp3` | 3,987 bytes | Referenced by the starter scene; not authored by the project author; license/provenance not verified |

The robot glTF embeds its geometry buffers in the 179,600-byte JSON payload. Scene models and textures from `studio.scene-asset.ts` (7,830 bytes) and `decor.scene-asset.ts` (21,078 bytes) are generated procedurally at runtime; they have no separate asset-file sizes and were scaffold-authored, not project-authored. No HDR file or HDR scene reference was found.

`app/iwsdk.config.json` does **not** disable locomotion: `world.features.locomotion` is an object with `useWorker: true`, and the SDK config type treats a feature object as enabled. This was recorded, not changed, because the request asked for confirmation rather than a config change.

- P1 hand tracking reads WebXR joint poses from each `XRInputSource.hand` during IWSDK's per-frame callback; the details and source references are in `docs/API_NOTES.md`.