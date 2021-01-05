import { Component, OnInit } from '@angular/core';
import * as P5 from 'p5'
import { WsService } from '../../services/ws.service';
import { Asset } from '../../types';
import { PaintingApproximator } from './painting/approximate';
import { Painting } from './painting/core';
import { Canvas, Sketcher } from './painting/sketch';
import { componentFor, connectedComponents, spanningTree } from './transaction/graph';

@Component({
  selector: 'app-studio',
  templateUrl: './studio.page.html',
  styleUrls: ['./studio.page.scss'],
})
export class StudioPage implements OnInit {
  p5: P5
  approximator: PaintingApproximator
  painting: Painting
  constructor(private readonly ws: WsService) { }

  ngOnInit(): void {
    window['spanningTree']        = spanningTree
    window['componentFor']        = componentFor
    window['connectedComponents'] = connectedComponents
  }

  ionViewDidEnter() {
    const [rows, columns] = [10, 10]
    const div = document.getElementById('canvas')
    const canvas = new Canvas(500, 500)
    this.painting = new Painting(rows, columns)
    window['painting'] = this.painting
    const sketcher = new Sketcher(canvas, this.painting)
    this.approximator = new PaintingApproximator(this.ws, this.painting)

    const sketch = (s : P5) => {
      s.preload = () => {}
      s.setup = () => {
        s.noCursor()
        const c = canvas.create(s)
        sketcher.listen(s, c)
        s.noLoop()
      }
      s.draw = () => {
        s.background(0)
        sketcher.sketch(s)
      }
    }

    // const div = document.getElementById('canvas')
    this.p5 = new P5(sketch, div);
  }
}

