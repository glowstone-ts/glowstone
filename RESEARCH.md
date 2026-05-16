# PrismarineJS parity (26.1 / 775)

| Prismarine | Dripleaf | Status |
|------------|----------|--------|
| node-minecraft-protocol | @dripleaf/protocol | High — full packet registry |
| prismarine-nbt | @dripleaf/nbt | High — tested round-trip |
| prismarine-chat | @dripleaf/chat | Medium — MessageBuilder |
| prismarine-window | @dripleaf/inventory | Medium — click API, windows |
| prismarine-block | @dripleaf/block | Medium — embedded block states |
| prismarine-chunk | @dripleaf/chunk | Medium — collision-safe chunk identity, dimension-aware sections, palettes, heightmaps |
| prismarine-world | @dripleaf/world | Medium — loaded chunks, getBlock/getBiome/getHeight, findBlocks, cache invalidation |
| prismarine-entity | @dripleaf/entity | Medium — metadata codec |
| prismarine-registry | @dripleaf/registry | Medium — runtime RegistryData |
| mineflayer | dripleaf | WIP — Client + plugins |

## Azalea crate map

| Azalea | Dripleaf |
|--------|----------|
| azalea-protocol | @dripleaf/protocol |
| azalea-registry | @dripleaf/registry |
| azaleaf-world | @dripleaf/world |
| azalea-client | dripleaf Client |

Reference clone: `references/` (optional) for API comparison only.
`azalea/` is also optional local reference material and must stay ignored/untracked.

## World/chunk boundary

`@dripleaf/chunk` owns chunk identity, section bounds, palette-backed chunk sections, and heightmap primitives. `@dripleaf/world` owns loaded-world queries, chunk lifecycle, and cached block-state invalidation; it re-exports chunk primitives for compatibility.
