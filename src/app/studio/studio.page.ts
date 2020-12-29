import { Component, OnInit } from '@angular/core';
import * as P5 from 'p5'

@Component({
  selector: 'app-studio',
  templateUrl: './studio.page.html',
  styleUrls: ['./studio.page.scss'],
})
export class StudioPage implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  ionViewDidEnter() {
    const [rows, columns] = [50, 50]
    const div = document.getElementById('canvas')
    const canvas = new Canvas(500, 500)
    const painting = new Painting(rows, columns)
    const sketcher = new Sketcher(canvas, painting)
    const sketch = (s : P5) => {
      s.preload = () => {}
      s.setup = () => { 
        canvas.create(s)
      }
      s.draw = () => {
        s.background(0)
        sketcher.update(s)
        sketcher.sketch(s)
      };
    }

    // const div = document.getElementById('canvas')
    let c = new P5(sketch, div);
  }

}

const BackgroundColor: [number ,number ,number] = [0,0,0]



export class Sketcher {
  // painting coordinates of the mouse, represents the closest vertex to the mouse.
  closestVertexToMouse: VertexSketcher
  projection: CoordinateProjection
  vertexSketchers: { [paintingCoordinate: string]: VertexSketcher }

  constructor(
    private readonly canvas: Canvas,
    private readonly painting: Painting,
  ){
    this.projection = new CoordinateProjection(
      { width: this.canvas.width, height: this.canvas.height },
      { width: this.painting.columns, height: this.painting.rows }
    )
    this.vertexSketchers = {}
    Object.entries(this.painting.vertices).forEach(
      ([k, v]) => this.vertexSketchers[k] = new VertexSketcher(this.projection, v)
    )
  }

  update(s: P5) {
    const [x, y] = this.projection.map(s.mouseX, s.mouseY)
    // console.log(this.vertexSketchers)
    this.closestVertexToMouse = this.vertexSketchers[coordinateKey(x, y)]

    s.mouseClicked = e => {
      console.log('clicked')
    }

    s.mouseDragged = e => {
      console.log('dragged')  
    }
  }

  sketch(s: P5) {
    Object.values(this.vertexSketchers).forEach(vs => vs.sketch(s))
    if(this.closestVertexToMouse) this.closestVertexToMouse.sketchHover(s)
  }
}

export class Canvas {
  constructor (
    public readonly width: number,
    public readonly height: number,
  ) {}

  create(s: P5){
    s.createCanvas(this.width, this.height)
  }
}

export class Painting {
  vertices: { [key: string]: Vertex } = {}
  // edges: { [key: string]: Vertex }

  constructor(public readonly rows: number, public readonly columns: number) {
    for(let x = 0; x < columns; x ++){
      for(let y = 0; y < rows; y++){
        this.vertices[coordinateKey(x,y)] = new Vertex(x, y)
      }
    }
  }

  updateOnClick(mx: number, mY: number) {}
  updateOnDragged(mx: number, mY: number) {}
  updateOnReleased(mx: number, mY: number) {}
}

export class Vertex {
  state: 'active' | 'inactive' = 'inactive'

  readonly key: string
  constructor(public readonly x: number, public readonly y: number){
    this.key = coordinateKey(x, y)
  }
}

type Color = [number, number, number]
export class VertexSketcher {
  static StateAttributes(state: Vertex['state'] | 'hover'): { radius: number, color: Color }{
    switch(state){
      case 'active': return { radius: 2, color: [255, 0, 0] }
      case 'inactive': return { radius: 2, color: [255, 255, 255] }
      case 'hover': return { radius: 10, color: [0, 255, 0] }
    }
  }

  sketchAtX : number
  sketchAtY : number
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

export class CoordinateProjection {
  constructor(private readonly src: Plane, private readonly tgt: Plane){}

  // composing these two is generally lossy unless one plane is strictly smaller in both dimensions than the other, small -> big -> small is id.
  map(x: number, y: number): [number, number] {
    const newX = Math.round(x * this.tgt.width / this.src.width)
    const newY = Math.round(y * this.tgt.height / this.src.height)
    return [newX, newY]
  }
  invmap(x: number, y: number): [number, number] {
    const newX = Math.round(x * this.src.width / this.tgt.width)
    const newY = Math.round(y * this.src.height / this.tgt.height)
    return [newX, newY]
  }
}

export interface Plane {
  width: number, // columns
  height: number, // rows
}

// projectTo :: forall n1 m1 n2 m2. Plane m2 n2 -> SCoordinate m1 n1 -> SCoordinate m2 n2
// projectTo cNew@P2 c =
//   fromJust $ mkSafeCoordinate P2 $ C xScaled yScaled
//   where
//     x' = getX c
//     y' = getY c
//     (xNew, yNew) = dimensions cNew
//     (xOld, yOld) = (getXDim &&& getYDim) c
//     xScaled = (x' * xNew) `div` xOld
//     yScaled = (y' * yNew) `div` yOld


function coordinateKey(x: number, y: number): string {
  return `(${x}, ${y})`
}