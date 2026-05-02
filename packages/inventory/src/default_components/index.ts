import type { NbtCompound, NbtTag, UnnamedNbtTag } from "@dripleaf/nbt"
import type { 
  Identifier,
  Attribute, 
  BlockType, 
  DataComponentType, 
  Enchantment, 
  EntityType, 
  MobEffect, 
  DamageType as RegistryDamageType, 
  SoundEvent, 
} from "@dripleaf/registry"
import type { ItemKind, ItemStack } from "../ItemStack"

export type CustomData = NbtTag

export type MaxStackSize = number

export type MaxDamage = number

export type Damage = number

export type Unbreakable = boolean;

export type UseEffects = {
  canSprint: boolean
  interactVibrations: boolean
  speedMultiplier: number
}

export type CustomName = UnnamedNbtTag // todo: @dripleaf/chat

export type MinimumAttackCharge = number;

export type DamageType = RegistryDamageType;

export type ItemName = UnnamedNbtTag // todo: @dripleaf/chat

export type ItemModel = Identifier;

export type Lore = UnnamedNbtTag[] // todo: @dripleaf/chat

export enum Rarity {
  Common = "common",
  Uncommon = "uncommon",
  Rare = "rare",
  Epic = "epic",
}

export type Enchantments = Record<Enchantment, number>;

export type BlockStateValueMatcher = {
  value: string
} | {
  min: string | null
  max: string | null
}

// name from azalea/azalea-inventory/src/components/mod.rs - because it is shorter than the mojang one :sob:
export type BlockStatePropertyMatcher = {
  name: string
  value_matcher: BlockStateValueMatcher
}

export type BlockPredicate = {
  blocks?: BlockType[] | null,
  properties?: Record<string, string> | null
}

export type AdventureModePredicate = BlockPredicate[];

export type CanPlaceOn = AdventureModePredicate;

export type CanBreak = AdventureModePredicate;

export enum AttributeModifierOperation {
  AddValue = 0,
  AddMultipledBase = 1,
  AddMultipledTotal = 2,
}

export type AttributeModifier = {
  id: Identifier;
  amount: number;
  operation: AttributeModifierOperation;
}

type AttributeModifierDisplay =
  | { type: "default" }
  | { type: "hidden" }
  | {
    type: "override";
    text: UnnamedNbtTag; // todo: @dripleaf/chat 
  };

export enum EquipmentSlotGroup {
  Any = "any",
  MainHand = "main_hand",
  OffHand = "off_hand",
  Hand = "hand",
  Feet = "feet",
  Legs = "legs",
  Chest = "chest",
  Head = "head",
  Armor = "armor",
  Body = "body",
  Saddle = "saddle",
}

export type AttributeModifiersEntry = {
  attribute: Attribute;
  modifier: AttributeModifier;
  slot: EquipmentSlotGroup;
  display: AttributeModifierDisplay;
}

export type AttributeModifiers = {
  modifiers: AttributeModifiersEntry[];
}

export type CustomModelData = {
  floats: number[];
  flags: boolean[];
  strings: string[];
  colors: number[];
}

export type TooltipDisplay = {
  hideTooltip: boolean;
  hiddenComponents: DataComponentType[];
}

export type RepairCost = number;

export type CreativeSlotLock = unknown; // note: its called unit with nothing in it in mojang source :sob:

export type EnchantmentGlintOverride = boolean;

export type IntangibleProjectile = unknown; // note: its called unit with nothing in it in mojang source :sob:

export type Food = {
  nutrition: number;
  saturation: number;
  canAlwaysEat: boolean;
};

export enum ItemUseAnimation {
  None = "none",
  Eat = "eat",
  Drink = "drink",
  Block = "block",
  Bow = "bow",
  Trident = "trident",
  Crossbow = "crossbow",
  Spyglass = "spyglass",
  TootHorn = "toot_horn",
  Brush = "brush",
  Bundle = "bundle",
  Spear = "spear",
}

export type MobEffectInstance = {
  id: MobEffect;
  duration: number;
  amplifier: number;
  ambient: boolean;
  visible: boolean;
  showIcon: boolean;
}

export type ConsumeEffect =
  | {
    type: "apply_effects",
    effects: MobEffectInstance[],
    probablity: number,
  }
  | {
    type: "remove_effects",
    effects: MobEffect[],
  }
  | {
    type: "clear_all_effects"
  }
  | {
    type: "teleport_randomly",
    diameter: number
  }
  | {
    type: "play_sound",
    sound: SoundEvent
  }

export type Consumable = {
  consumeSeconds: number;
  animation: ItemUseAnimation;
  sound: SoundEvent;
  hasConsumeParticles: boolean;
  onConsumeEffects: ConsumeEffect[];
}

export type UseRemainder = ItemStack;

export type UseCooldown = {
  seconds: number;
  cooldownGroup: Identifier;
}

export type DamageResistant = DamageType[];

export type ToolRule = {
  blocks: BlockType[];
  speed: number | null;
  correctForDrops: boolean | null;
}

export type Tool = {
  rules: ToolRule[];
  defaultMiningSpeed: number;
  damagePerBlock: number;
  canDestroyBlocksInCreative: boolean;
}

export type Weapon = {
  itemDamagePerAttack: number;
  disableBlockingForSeconds: number;
}

export type AttackRange = {
  minReach: number;
  maxReach: number;
  minCreativeReach: number;
  maxCreativeReach: number;
  hitboxMargin: number;
  mobFactor: number;
}

export type Enchantable = number;

enum EquipmentSlot {
  Mainhand,
  Offhand,
  Feet,
  Legs,
  Chest,
  Head,
  Body,
  Saddle,
}

export type Equippable = {
  slot: EquipmentSlot;
  equipSound: SoundEvent;
  assetId: Identifier | null;
  cameraOverlay: Identifier | null;
  allowedEntities: EntityType[] | null;
  dispensable: boolean;
  swappable: boolean;
  damageOnHurt: boolean;
  equipOnInteract: boolean;
  canBeSheared: boolean;
  shearingSound: SoundEvent;
}

export type Repairable = ItemKind[];

export type Glider = unknown; // note: its called unit with nothing in it in mojang source :sob:

export type TooltipStyle = Identifier;

export type DeathProtection = ConsumeEffect[];

export type DamageReduction = {
  horizontalBlockingAngle: number;
  type: DamageType[] | null;
  base: number;
  factor: number;
}

export type ItemDamageFunction = {
  threshold: number;
  base: number;
  factor: number;
}

export type BlocksAttacks = {
  blockDelaySeconds: number;
  disableCooldownScale: number;
  damageReductions: DamageReduction[];
  itemDamage: ItemDamageFunction;
  bypassedBy: DamageType[] | null;
  blockSound: SoundEvent | null;
  disableSound: SoundEvent | null;
}

// stopped at line 205 in net/minecraft/core/component/DataComponents.java, to be continued when i have more energy :sob: