import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { BlockType } from "@dripleaf/registry"

export { BlockType }

export type BlockState = number

export type BlockPropertyValue = string | boolean | number

export type BlockProperties = Record<string, BlockPropertyValue>

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const BLOCKS_JSON_PATH = resolve(__dirname, "../../../generated/reports/blocks.json")

function parsePropertyValue(value: string): BlockPropertyValue {
  if (value === "true") return true
  if (value === "false") return false
  const num = Number(value)
  if (!Number.isNaN(num) && value !== "") return num
  return value
}

interface BlockReportDefinition {
  type: string
  [key: string]: unknown
}

interface BlockReportState {
  id: number
  properties: Record<string, string>
}

interface BlockReportEntry {
  definition: BlockReportDefinition
  properties: Record<string, string[]>
  states: BlockReportState[]
}

interface StateMapEntry {
  type: BlockType
  properties: BlockProperties
}

function buildBlockTypeLookup(): Record<string, BlockType> {
  const lookup: Record<string, BlockType> = {}
  for (const value of Object.values(BlockType)) {
    lookup[value as string] = value as BlockType
  }
  return lookup
}

function loadBlocks(): Record<string, BlockReportEntry> {
  return JSON.parse(readFileSync(BLOCKS_JSON_PATH, "utf-8"))
}

function buildStateMap(blocks: Record<string, BlockReportEntry>): Map<number, StateMapEntry> {
  const map = new Map<number, StateMapEntry>()
  const typeLookup = buildBlockTypeLookup()

  for (const [key, entry] of Object.entries(blocks)) {
    const blockName = key.startsWith("minecraft:") ? key.slice(10) : key
    const blockType = typeLookup[blockName]
    if (blockType === undefined) continue

    for (const state of entry.states) {
      const properties: BlockProperties = {}
      for (const [propKey, propValue] of Object.entries(state.properties)) {
        properties[propKey] = parsePropertyValue(propValue)
      }
      map.set(state.id, { type: blockType, properties })
    }
  }
  return map
}

export class BlockData {
  constructor(
    public readonly type: BlockType,
    public readonly properties: BlockProperties,
    public readonly stateId: number,
  ) {}
}

export class BlockRegistry {
  static #instance: BlockRegistry | undefined
  #blocks: Record<string, BlockReportEntry> | undefined
  #stateMap: Map<number, StateMapEntry> | undefined
  #blockTypes: BlockType[] | undefined
  #typeLookup: Record<string, BlockType> | undefined

  private constructor() {}

  static getInstance(): BlockRegistry {
    if (!BlockRegistry.#instance) {
      BlockRegistry.#instance = new BlockRegistry()
    }
    return BlockRegistry.#instance
  }

  #getTypeLookup(): Record<string, BlockType> {
    if (!this.#typeLookup) {
      this.#typeLookup = buildBlockTypeLookup()
    }
    return this.#typeLookup
  }

  #getBlocks(): Record<string, BlockReportEntry> {
    if (!this.#blocks) {
      this.#blocks = loadBlocks()
    }
    return this.#blocks
  }

  #getStateMap(): Map<number, StateMapEntry> {
    if (!this.#stateMap) {
      this.#stateMap = buildStateMap(this.#getBlocks())
    }
    return this.#stateMap
  }

  getBlock(stateId: number): BlockData | undefined {
    const entry = this.#getStateMap().get(stateId)
    if (!entry) return undefined
    return new BlockData(entry.type, entry.properties, stateId)
  }

  getStateId(type: BlockType, properties: BlockProperties = {}): number | undefined {
    const blocks = this.#getBlocks()
    const key = `minecraft:${type as string}`
    const entry = blocks[key]
    if (!entry) return undefined

    const propKeys = Object.keys(properties)

    if (propKeys.length === 0) {
      return entry.states[0]?.id
    }

    for (const state of entry.states) {
      let match = true
      for (const [propKey, propValue] of Object.entries(properties)) {
        const stateValue = state.properties[propKey]
        if (stateValue === undefined) {
          match = false
          break
        }
        const parsed = parsePropertyValue(stateValue)
        if (parsed !== propValue) {
          match = false
          break
        }
      }
      if (match) return state.id
    }
    return undefined
  }

  getBlockTypes(): BlockType[] {
    if (this.#blockTypes) return this.#blockTypes
    const blocks = this.#getBlocks()
    const types: BlockType[] = []
    const typeLookup = this.#getTypeLookup()

    for (const key of Object.keys(blocks)) {
      const blockName = key.startsWith("minecraft:") ? key.slice(10) : key
      const blockType = typeLookup[blockName]
      if (blockType !== undefined) {
        types.push(blockType)
      }
    }
    this.#blockTypes = types
    return types
  }

  getProperties(type: BlockType): Record<string, string[]> {
    const blocks = this.#getBlocks()
    const key = `minecraft:${type as string}`
    const entry = blocks[key]
    if (!entry) return {}
    return { ...entry.properties }
  }
}

export function stateToBlock(stateId: number): BlockData | undefined {
  return BlockRegistry.getInstance().getBlock(stateId)
}

export function blockToState(type: BlockType, properties?: BlockProperties): number {
  const stateId = BlockRegistry.getInstance().getStateId(type, properties ?? {})
  if (stateId === undefined) {
    throw new Error(`No block state found for ${type as string}: ${JSON.stringify(properties)}`)
  }
  return stateId
}

export function blockTypeFromState(state: BlockState): BlockType | undefined {
  return BlockRegistry.getInstance().getBlock(state)?.type
}
