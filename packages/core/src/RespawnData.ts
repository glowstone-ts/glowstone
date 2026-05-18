import { GlobalPos } from "./GlobalPos"

export class RespawnData {
  constructor(
    public globalPos: GlobalPos,
    public yaw: number,
    public pitch: number,
  ) {}
}
