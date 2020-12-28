import { Component, OnInit } from '@angular/core';
import * as p5 from 'p5';
// import "p5/lib/addons/p5.sound";
// import "p5/lib/addons/p5.dom";

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    const dimensions = [100, 100]
    const div = document.getElementById('canvas')
    const sketch = (s) => {

      s.preload = () => {
        // preload code
      }

      s.setup = () => {
        console.log("HEY", div.offsetWidth)
        s.createCanvas(div.offsetWidth, div.offsetHeight);
      };

      s.draw = () => {
        const columns = dimensions[0]
        const columnWidth = div.offsetWidth / columns
        for(let i = 0; i < dimensions[0]; i ++){
          s.line(i * columnWidth, 0, i * columnWidth, div.offsetHeight)
          s.stroke(126)
        }
        // s.background(200);
        s.rect(100, 100, 100, 100);
      };
    }

    // const div = document.getElementById('canvas')
    let canvas = new p5(sketch, div);
  }

}
