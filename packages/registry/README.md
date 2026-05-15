# @dripleaf/registry

Replacement for **prismarine-registry**: `Identifier`, `Registry`, generated enums/tags, and `RegistryManager` for runtime `RegistryData` / `UpdateTags` from the configuration phase.

```ts
import { RegistryManager } from "@dripleaf/registry"

const manager = new RegistryManager()
manager.applyRegistryData("minecraft:block", entries)
manager.getTag("minecraft:block", "minecraft:logs")
```
