import { DimensionType, Identifier } from "@dripleaf/registry"
import { GlobalPos } from "./GlobalPos"

export enum GameType {
  Survival = 0,
  Creative = 1,
  Adventure = 2,
  Spectator = 3,
}

export class CommonPlayerSpawnInfo {
  constructor(
    public dimensionType: DimensionType,
    public dimension: Identifier,
    public seed: bigint,
    public gameType: GameType,
    public previousGameType: GameType | null,
    public isDebug: boolean,
    public isFlat: boolean,
    public lastDeathLocation: GlobalPos | null,
    public portalCooldown: number,
    public seaLevel: number,
  ) {}
}
