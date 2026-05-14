export class RelativeMovements {
  constructor(
    public x: boolean,
    public y: boolean,
    public z: boolean,
    public yRot: boolean,
    public xRot: boolean,
    public deltaX: boolean,
    public deltaY: boolean,
    public deltaZ: boolean,
    public rotateDelta: boolean,
  ) {}

  pack(): number {
    let flags = 0
    if (this.x) flags |= 0x01
    if (this.y) flags |= 0x02
    if (this.z) flags |= 0x04
    if (this.yRot) flags |= 0x08
    if (this.xRot) flags |= 0x10
    if (this.deltaX) flags |= 0x20
    if (this.deltaY) flags |= 0x40
    if (this.deltaZ) flags |= 0x80
    if (this.rotateDelta) flags |= 0x100
    return flags
  }

  static unpack(flags: number): RelativeMovements {
    return new RelativeMovements(
      (flags & 0x01) !== 0,
      (flags & 0x02) !== 0,
      (flags & 0x04) !== 0,
      (flags & 0x08) !== 0,
      (flags & 0x10) !== 0,
      (flags & 0x20) !== 0,
      (flags & 0x40) !== 0,
      (flags & 0x80) !== 0,
      (flags & 0x100) !== 0,
    )
  }
}
