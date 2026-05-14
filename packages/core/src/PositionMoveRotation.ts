import type { Vec3 } from "vec3"

export class PositionMoveRotation {
  constructor(
    public position: Vec3,
    public deltaMovement: Vec3,
    public yaw: number,
    public pitch: number,
  ) {}
}
