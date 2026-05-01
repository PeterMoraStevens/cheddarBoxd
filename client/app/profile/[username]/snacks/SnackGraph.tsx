'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'

export interface SnackData {
  barcode: string
  name: string
  brand: string | null
  imageUrl: string | null
  rating: number | null
}

interface SnackGraphProps {
  snacks: SnackData[]
}

// ── Tier definitions (high → low so tiers render left → right) ──────────────

interface Tier {
  id: string
  label: string
  stars: string
  color: string
  test: (r: number | null) => boolean
}

const TIERS: Tier[] = [
  { id: 'tier-5', label: '5 Stars', stars: '★★★★★', color: '#3DEB78', test: (r) => r != null && r >= 4.5 },
  { id: 'tier-4', label: '4 Stars', stars: '★★★★',  color: '#8BC34A', test: (r) => r != null && r >= 3.5 && r < 4.5 },
  { id: 'tier-3', label: '3 Stars', stars: '★★★',   color: '#FFD700', test: (r) => r != null && r >= 2.5 && r < 3.5 },
  { id: 'tier-2', label: '2 Stars', stars: '★★',    color: '#FF9F40', test: (r) => r != null && r >= 1.5 && r < 2.5 },
  { id: 'tier-1', label: '1 Star',  stars: '★',     color: '#FF6B6B', test: (r) => r != null && r > 0 && r < 1.5 },
  { id: 'tier-0', label: 'Unrated', stars: '—',     color: '#888880', test: (r) => r == null || r === 0 },
]

// ── Custom node: rating tier hub ─────────────────────────────────────────────

function TierNode({ data }: { data: Record<string, unknown> }) {
  const { stars, color } = data as { stars: string; label: string; color: string }
  return (
    <div
      style={{
        background: color,
        border: '2px solid #0D0D0D',
        padding: '7px 14px',
        fontWeight: 900,
        fontSize: 13,
        letterSpacing: 1,
        boxShadow: '4px 4px 0 #0D0D0D',
        cursor: 'default',
        textAlign: 'center',
        color: '#0D0D0D',
        fontFamily: 'inherit',
        minWidth: 90,
        userSelect: 'none',
      }}
    >
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      {stars}
    </div>
  )
}

// ── Custom node: snack ────────────────────────────────────────────────────────

function SnackNode({ data }: { data: Record<string, unknown> }) {
  const { name, imageUrl, brand } = data as unknown as SnackData
  return (
    <div
      style={{
        background: 'var(--surface, #fff)',
        border: '2px solid #0D0D0D',
        padding: '5px 7px',
        boxShadow: '3px 3px 0 #0D0D0D',
        cursor: 'pointer',
        width: 148,
        fontFamily: 'inherit',
      }}
    >
      <Handle type="target" position={Position.Top}  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Right} id="brand-target" style={{ opacity: 0, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {imageUrl && (
          <div style={{
            width: 28, height: 28, flexShrink: 0,
            border: '1px solid #0D0D0D', overflow: 'hidden',
            background: '#F5F3EC', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          {brand && (
            <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888880', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {brand}
            </div>
          )}
          <div style={{
            fontSize: 10, fontWeight: 700, lineHeight: 1.3,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            color: '#0D0D0D',
          }}>
            {name}
          </div>
        </div>
      </div>
    </div>
  )
}

const NODE_TYPES: NodeTypes = { tier: TierNode, snack: SnackNode }

// ── Layout ────────────────────────────────────────────────────────────────────

const TIER_X_GAP = 230   // horizontal distance between tier centres
const SNACK_Y_START = 90 // y of first snack row below tier node
const SNACK_ROW_H = 90   // vertical gap between snack rows
const SNACK_COL_W = 165  // horizontal gap between snack columns within a tier
const MAX_COLS = 2        // max snacks per row per tier

function buildGraph(snacks: SnackData[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Assign each snack to a tier
  const tierBuckets: Record<string, SnackData[]> = {}
  for (const snack of snacks) {
    for (const tier of TIERS) {
      if (tier.test(snack.rating)) {
        tierBuckets[tier.id] = tierBuckets[tier.id] ?? []
        tierBuckets[tier.id].push(snack)
        break
      }
    }
  }

  const activeTiers = TIERS.filter((t) => (tierBuckets[t.id]?.length ?? 0) > 0)
  if (activeTiers.length === 0) return { nodes, edges }

  // Centre the whole graph horizontally
  const totalWidth = (activeTiers.length - 1) * TIER_X_GAP
  const startX = -totalWidth / 2

  activeTiers.forEach((tier, ti) => {
    const cx = startX + ti * TIER_X_GAP

    // Tier hub node
    nodes.push({
      id: tier.id,
      type: 'tier',
      position: { x: cx - 45, y: 0 },
      data: { label: tier.label, stars: tier.stars, color: tier.color },
      draggable: false,
    })

    const snackList = tierBuckets[tier.id]
    const cols = Math.min(MAX_COLS, snackList.length)
    const colsWidth = (cols - 1) * SNACK_COL_W
    const colStartX = cx - colsWidth / 2

    snackList.forEach((snack, si) => {
      const col = si % cols
      const row = Math.floor(si / cols)
      const nx = colStartX + col * SNACK_COL_W - 74 // 74 = half node width
      const ny = SNACK_Y_START + row * SNACK_ROW_H

      nodes.push({
        id: snack.barcode,
        type: 'snack',
        position: { x: nx, y: ny },
        data: snack as unknown as Record<string, unknown>,
        draggable: true,
      })

      // Edge: tier → snack
      edges.push({
        id: `tier-${snack.barcode}`,
        source: tier.id,
        target: snack.barcode,
        style: { stroke: tier.color, strokeWidth: 1.5, opacity: 0.5 },
      })
    })
  })

  // Brand edges: chain snacks that share the same brand with a dashed line
  const brandMap: Record<string, string[]> = {}
  for (const snack of snacks) {
    if (!snack.brand) continue
    const key = snack.brand.toLowerCase().trim().split(',')[0].trim()
    if (!key) continue
    brandMap[key] = brandMap[key] ?? []
    brandMap[key].push(snack.barcode)
  }

  for (const barcodes of Object.values(brandMap)) {
    if (barcodes.length < 2) continue
    for (let i = 0; i < barcodes.length - 1; i++) {
      edges.push({
        id: `brand-${barcodes[i]}-${barcodes[i + 1]}`,
        source: barcodes[i],
        target: barcodes[i + 1],
        sourceHandle: 'brand-target',
        style: { stroke: '#888880', strokeWidth: 1, opacity: 0.35, strokeDasharray: '5 4' },
        type: 'straight',
      })
    }
  }

  return { nodes, edges }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SnackGraph({ snacks }: SnackGraphProps) {
  const router = useRouter()

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(snacks),
    [snacks],
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'snack') router.push(`/snack/${node.id}`)
    },
    [router],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="var(--border, #0D0D0D)"
        style={{ opacity: 0.12 }}
      />
      <Controls
        style={{ border: '2px solid var(--border)', borderRadius: 0, boxShadow: '3px 3px 0 var(--border)' }}
      />
    </ReactFlow>
  )
}
