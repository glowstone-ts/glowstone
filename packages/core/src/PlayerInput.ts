export class PlayerInput {
  constructor(
    public forward: boolean,
    public backward: boolean,
    public left: boolean,
    public right: boolean,
    public jump: boolean,
    public shift: boolean,
    public sprint: boolean,
  ) {}

  packFlags(): number {
    let flags = 0
    if (this.forward) flags |= 0x01
    if (this.backward) flags |= 0x02
    if (this.left) flags |= 0x04
    if (this.right) flags |= 0x08
    if (this.jump) flags |= 0x10
    if (this.shift) flags |= 0x20
    if (this.sprint) flags |= 0x40
    return flags
  }

  static unpackFlags(flags: number): PlayerInput {
    return new PlayerInput(
      (flags & 0x01) !== 0,
      (flags & 0x02) !== 0,
      (flags & 0x04) !== 0,
      (flags & 0x08) !== 0,
      (flags & 0x10) !== 0,
      (flags & 0x20) !== 0,
      (flags & 0x40) !== 0,
    )
  }
}
