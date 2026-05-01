

export interface OFFSearchProduct {
  code: string
  product_name: string
  brands?: string
  image_front_small_url?: string
  image_front_url?: string
  nutriscore_grade?: string
  nova_group?: number
  quantity?: string
}

const KNOWN_GRADES = new Set(['a', 'b', 'c', 'd', 'e'])

export function getNutriScoreLabel(grade?: string | null): string {
  const g = grade?.toLowerCase() ?? ''
  return KNOWN_GRADES.has(g) ? g.toUpperCase() : '?'
}

export function getNutriScoreColor(grade?: string | null): string {
  const colors: Record<string, string> = {
    a: 'bg-green-500',
    b: 'bg-lime-400',
    c: 'bg-yellow-400',
    d: 'bg-orange-400',
    e: 'bg-red-500',
  }
  return colors[grade?.toLowerCase() ?? ''] ?? 'bg-gray-400'
}
