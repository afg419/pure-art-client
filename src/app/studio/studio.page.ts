import { Component, OnInit } from '@angular/core';
import * as P5 from 'p5'
import { WsService } from '../services/ws.service';
import { Asset } from '../types';
import { PaintingApproximator } from './painting/approximate';
import { Painting } from './painting/core';
import { Canvas, Sketcher } from './painting/sketch';

@Component({
  selector: 'app-studio',
  templateUrl: './studio.page.html',
  styleUrls: ['./studio.page.scss'],
})
export class StudioPage implements OnInit {
  p5: P5
  approximator: PaintingApproximator
  constructor(private readonly ws: WsService) { }

  ngOnInit(): void {}

  ionViewDidEnter() {
    const [rows, columns] = [80, 80]
    const div = document.getElementById('canvas')
    const canvas = new Canvas(500, 500)
    const painting = new Painting(rows, columns)
    const sketcher = new Sketcher(canvas, painting)

    const asset: Asset = Asset.DOGE
    const xpub = "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz"
    this.approximator = new PaintingApproximator(this.ws, { asset, xpub } , painting, )

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

