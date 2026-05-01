'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'

interface UserNode {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface NetworkGraphProps {
  nodes: UserNode[]
  edges: { source: string; target: string }[]
  centerId: string
}

function layoutNodes(users: UserNode[], centerId: string): Node[] {
  const center = users.find((u) => u.id === centerId)
  const others = users.filter((u) => u.id !== centerId)
  const radius = Math.max(200, others.length * 40)

  return users.map((user, i) => {
    if (user.id === centerId) {
      return {
        id: user.id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: user.display_name || user.username, username: user.username, isCenter: true },
        style: {
          background: '#3DEB78',
          border: '2px solid #0D0D0D',
          borderRadius: 0,
          padding: '8px 12px',
          fontWeight: 800,
          fontSize: 13,
          boxShadow: '4px 4px 0 #0D0D0D',
          color: '#0D0D0D',
        },
      }
    }

    const otherIndex = others.indexOf(user)
    const angle = (otherIndex / others.length) * 2 * Math.PI
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    return {
      id: user.id,
      type: 'default',
      position: { x, y },
      data: { label: user.display_name || user.username, username: user.username, isCenter: false },
      style: {
        background: 'var(--surface, #fff)',
        border: '2px solid #0D0D0D',
        borderRadius: 0,
        padding: '6px 10px',
        fontWeight: 600,
        fontSize: 12,
        boxShadow: '3px 3px 0 #0D0D0D',
      },
    }
  })
}

export function NetworkGraph({ nodes: userNodes, edges: rawEdges, centerId }: NetworkGraphProps) {
  const router = useRouter()

  // Detect mutual follows
  const edgeSet = new Set(rawEdges.map((e) => `${e.source}->${e.target}`))

  const initialNodes = useMemo(() => layoutNodes(userNodes, centerId), [userNodes, centerId])

  const initialEdges: Edge[] = useMemo(() => {
    const seen = new Set<string>()
    return rawEdges.flatMap((e) => {
      const key = [e.source, e.target].sort().join('--')
      const isMutual = edgeSet.has(`${e.target}->${e.source}`)
      if (isMutual && seen.has(key)) return []
      if (isMutual) seen.add(key)

      return [{
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        animated: isMutual,
        style: {
          stroke: isMutual ? '#3DEB78' : '#888880',
          strokeWidth: isMutual ? 2 : 1,
          strokeDasharray: isMutual ? undefined : '4 3',
        },
        markerEnd: isMutual ? undefined : {
          type: MarkerType.ArrowClosed,
          color: '#888880',
          width: 15,
          height: 15,
        },
      }]
    })
  }, [rawEdges, edgeSet])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const username = (node.data as { username: string }).username
    if (username) router.push(`/profile/${username}`)
  }, [router])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
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
        style={{ opacity: 0.15 }}
      />
      <Controls
        style={{
          border: '2px solid var(--border)',
          borderRadius: 0,
          boxShadow: '3px 3px 0 var(--border)',
        }}
      />
      <MiniMap
        style={{
          border: '2px solid var(--border)',
          borderRadius: 0,
        }}
        nodeColor={(n) => (n.data as { isCenter?: boolean }).isCenter ? '#3DEB78' : '#fff'}
      />
    </ReactFlow>
  )
}
