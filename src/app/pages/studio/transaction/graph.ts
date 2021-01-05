export interface Eq<T> {
  eq: (t: T) => boolean
}

export type OneCell<T extends Eq<T>> = {
  src: T,
  tgt: T
}

export function edgeVertices<T extends Eq<T>>(e: OneCell<T>): [T, T] {
  return [e.src, e.tgt]
}

export function inEdge<T extends Eq<T>>(e: OneCell<T>, t: T): boolean {
  return [e.src, e.tgt].includes(t)
}

export type Star<T extends Eq<T>> = {
  src: T,
  rays: OneCell<T>[]
}

export function starLeaves<T extends Eq<T>>(s: Star<T>): T[] {
  return flat(s.rays.map(r => edgeVertices(r) as T[])).filter(t => !t.eq(s.src))
}

export type Graph<T extends Eq<T>> = {
  edges: OneCell<T>[]
}

export function starInGraph<T extends Eq<T>>(g: Graph<T>, src: T): Star<T> {
  const rays = g.edges.filter(e => e.src.eq(src) || e.tgt.eq(src))
  return { src, rays }
}

export type StarTree<T> = {
  src: T,
  tree: StarTree<T>[]
}

export function findInTree<T extends Eq<T>>(star: StarTree<T>, v: T): StarTree<T> | undefined {
  if(star.src.eq(v)) return star
  return star.tree.find(t => !!findInTree(t, v))
}

export function appendToTree<T extends Eq<T>>(star: StarTree<T>, e: OneCell<T>): { newTreeLayer: boolean, success: boolean, newTree: StarTree<T> } {
  const srcInStar = findInTree(star, e.src)
  if(srcInStar){
    const newTreeLayer = srcInStar.tree.length === 0
    srcInStar.tree.push({ src: e.tgt, tree: [] })
    return { newTreeLayer, success: true, newTree: star }
  }

  const tgtInStar = findInTree(star, e.tgt)
  if(tgtInStar){
    const newTreeLayer = tgtInStar.tree.length === 0
    tgtInStar.tree.push({ src: e.src, tree: [] })
    return { newTreeLayer, success: true, newTree: star }
  }

  return { success: false, newTreeLayer: false, newTree: star }
}

export function countTrees<T extends Eq<T>> (star: StarTree<T>): number {
  if(star.tree.length === 0) return 1
  return star.tree.reduce((acc, next) => acc + countTrees(next), 0)
}

export function connectedComponents<T extends Eq<T>>(g: Graph<T>): Graph<T>[] {
  if(g.edges.length === 0) return []
  const toReturn = []
  let remainingEdges = g.edges
  while(remainingEdges.length){
    const nextComponent = componentFor({edges: remainingEdges}, remainingEdges[0].src)
    toReturn.push(nextComponent)
    remainingEdges = setDifference(remainingEdges, nextComponent.edges)
  }
  return toReturn
}

export function componentFor<T extends Eq<T>>(g: Graph<T>, t: T): Graph<T> {
  const nextStar = starInGraph(g, t)
  const nextVertices = starLeaves(nextStar)
  if(nextVertices.length === 0) {
    return { edges: [] }
  } else {
    const usedEdges = nextStar.rays
    return nextVertices.reduce((acc, next) => {
      const remainingEdges = setDifference(g.edges, acc.edges)
      const { edges: nextEdges } = componentFor({edges: remainingEdges}, next)
      return { edges: nextEdges.concat(acc.edges) }
    }, { edges: usedEdges })
  }
}

// a disconnected graph will only return star tree for component containing t
export function spanningTree<T extends Eq<T>>(g: Graph<T>, t: T): { usedEdges: OneCell<T>[], treeRes: StarTree<T>} {
  const nextStar = starInGraph(g, t)
  const nextVertices = starLeaves(nextStar)
  if(nextVertices.length === 0){
    return { usedEdges: [], treeRes: { src: t, tree: [] } }
  } else {
    let usedEdges = nextStar.rays
    const tree = nextVertices.map(v => {
      let { usedEdges : nextUsedEdges, treeRes } = spanningTree({ edges: setDifference(g.edges, usedEdges) }, v)
      usedEdges = usedEdges.concat(nextUsedEdges)
      return treeRes
    })
    return { usedEdges, treeRes: { src: t, tree } }
  }
}

export const flat = (arr: any[]) => arr.reduce((acc, val) => acc.concat(val), []);

export function setDifference<A>(as: A[], bs: A[]): A[] {
  return as.filter(a => !bs.includes(a))
}


// for testings
export class Num implements Eq<Num> {
  constructor(readonly n: number) {}
  eq(t: Num){
    return t.n === this.n
  }
}
function n(n: number): Num {
  return new Num(n)
}
