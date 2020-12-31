import { Painting, vertexKey, Vertex, Edge, Plane } from "./core"
import * as P5 from 'p5'

export class Sketcher {
  // painting coordinates of the mouse, represents the closest vertex to the mouse.
  closestVertexToMouse: VertexSketcher
  projection: CoordinateProjection
  vertexSketchers: { [key: string]: VertexSketcher } = {}
  edgeSketchers: { [key: string]: EdgeSketcher } = {}
  draggingFromKey: string | undefined //

  constructor(
    private readonly canvas: Canvas,
    private readonly painting: Painting,
  ){
    this.projection = new CoordinateProjection(
      { width: this.canvas.width, height: this.canvas.height },
      { width: this.painting.columns, height: this.painting.rows }
    )
    Object.entries(this.painting.vertices).forEach(
      ([k, v]) => this.vertexSketchers[k] = new VertexSketcher(this.projection, v)
    )
  }

  listen(s: P5, c: P5.Renderer) {
    c.mouseMoved(() => { if(!this.draggingFromKey) s.redraw() })

    s.mousePressed = e => {
      const [x, y] = this.projection.map(s.mouseX, s.mouseY)
      this.draggingFromKey = vertexKey(x, y)
      s.redraw()
    }

    s.mouseReleased = e => {
      const closestKey = this.closestVertexKey(s)
      if(this.draggingFromKey) {
        this.painting.activate(this.draggingFromKey)
        const edge = this.painting.newEdge(this.draggingFromKey, closestKey)
        this.edgeSketchers[edge.key] = new EdgeSketcher(this.projection, edge)
      }
      this.draggingFromKey = undefined
      this.painting.activate(closestKey)
      s.redraw()
    }

    s.mouseDragged = () => s.redraw()
  }

  getVertexSketcher(key: string): VertexSketcher {
    return this.vertexSketchers[key]
  }

  closestVertexKey(s: P5): string {
    const [x, y] = this.projection.map(s.mouseX, s.mouseY)
    return vertexKey(x,y)
  }

  closestVertexSketcher(s: P5): VertexSketcher {
    return this.getVertexSketcher(this.closestVertexKey(s))
  }

  sketch(s: P5) {
    const closest = this.closestVertexSketcher(s)
    if(!closest) return
    closest.sketchHover(s)
    Object.values(this.vertexSketchers).forEach(vs => vs.sketch(s))
    Object.values(this.edgeSketchers).forEach(es => es.sketch(s))
    if(this.draggingFromKey){
      const from = this.getVertexSketcher(this.draggingFromKey)
      this.hoverEdge(s, from, closest)
    }
  }

  private hoverEdge(s: P5, from: VertexSketcher, to: VertexSketcher) {
    s.stroke(255, 255 ,255)
    s.line(
      from.sketchAtX,
      from.sketchAtY,
      to.sketchAtX,
      to.sketchAtY
    )
    s.stroke(...BackgroundColor)
  }
}

export class Canvas {
  constructor (
    public readonly width: number,
    public readonly height: number,
  ) {}

  create(s: P5){
    return s.createCanvas(this.width, this.height)
  }
}


type Color = [number, number, number]
export class VertexSketcher {
  static StateAttributes(state: Vertex['state'] | 'hover'): { radius: number, color: Color }{
    switch(state){
      case 'active': return   { radius: 5, color:  [255, 255, 255] }
      case 'inactive': return { radius: 2, color:  [60, 60 ,60] }
      case 'hover': return    { radius: 10, color: [100, 100, 100] }
    }
  }

  public readonly sketchAtX : number
  public readonly sketchAtY : number
  constructor(private readonly projection: CoordinateProjection, private readonly v: Vertex) {
    const [sketchAtX, sketchAtY] = this.projection.invmap(this.v.x, this.v.y)
    this.sketchAtX = sketchAtX
    this.sketchAtY = sketchAtY
  }

  sketch(s: P5) {
    s.fill(...BackgroundColor)
    const { radius, color } = VertexSketcher.StateAttributes(this.v.state)
    s.fill(...color)
    s.circle(this.sketchAtX, this.sketchAtY, radius)
    s.fill(...BackgroundColor)
  }

  sketchHover(s: P5) {
    s.fill(...BackgroundColor)
    const { radius, color } = VertexSketcher.StateAttributes('hover')
    s.fill(...color)
    s.circle(this.sketchAtX, this.sketchAtY, radius)
    s.fill(...BackgroundColor)
  }
}

export class EdgeSketcher {
  static StateAttributes(): { color: Color }{
    return { color: [255, 255, 255] }
  }

  sketchFrom : [number, number]
  sketchTo : [number, number]
  constructor(private readonly projection: CoordinateProjection, private readonly e: Edge) {
    this.sketchFrom = this.projection.invmap(e.v1.x, e.v1.y)
    this.sketchTo = this.projection.invmap(e.v2.x, e.v2.y)
  }

  sketch(s: P5) {
    s.stroke(...BackgroundColor)
    const { color } = EdgeSketcher.StateAttributes()
    s.stroke(...color)
    s.line(this.sketchFrom[0], this.sketchFrom[1], this.sketchTo[0], this.sketchTo[1])
    s.stroke(...BackgroundColor)
  }
}

export class CoordinateProjection {
  tgtHeightInSrc: number
  tgtWidthInSrc: number

  constructor(private readonly src: Plane, private readonly tgt: Plane){
    this.tgtHeightInSrc = src.height / tgt.height
    this.tgtWidthInSrc = src.width / tgt.width
  }

  // composing these two is generally lossy unless one plane is strictly smaller in both dimensions than the other, small -> big -> small is id.
  map(x: number, y: number): [number, number] {
    // console.log('wtf')
    const newX = Math.round((x - Math.round(this.tgtWidthInSrc / 2)) * this.tgt.width / this.src.width)
    const newY = Math.round((y - Math.round(this.tgtHeightInSrc / 2)) * this.tgt.height / this.src.height)
    return [newX, newY]
  }
  invmap(x: number, y: number): [number, number] {
    const newX = Math.round(x * this.src.width / this.tgt.width) + Math.round(this.tgtWidthInSrc / 2)
    const newY = Math.round(y * this.src.height / this.tgt.height) + Math.round(this.tgtHeightInSrc / 2)
    return [newX, newY]
  }
}

const BackgroundColor: [number ,number ,number] = [0,0,0]
