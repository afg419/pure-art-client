import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class AppConfig {
  server = `localhost:3000`
  wsVersion = 0
}