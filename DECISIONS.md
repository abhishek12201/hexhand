# Decisions

- P0 uses the outer `hexhand` repository as the deployment root and keeps the IWSDK scaffold in `app/`. The project Pages build uses `/hexhand/`; local development uses `/`.
- Keep generated MCP and agent skill files as optional tooling only. MCP configs use absolute pre-relocation paths, and host support for the skills is not verified, so P0 does not rely on them.