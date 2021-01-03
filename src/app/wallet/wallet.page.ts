import { Component, OnInit } from '@angular/core';
import { Asset } from '../types';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.page.html',
  styleUrls: ['./wallet.page.scss'],
})
export class WalletPage implements OnInit {
  wallets = []
  constructor() { }
  ngOnInit() {}
}

export type Wallet = {
  asset: Asset
  amount: number
}
