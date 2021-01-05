import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Asset } from 'src/app/types';
import * as bip39 from '../../../../lib/bip39.browser.js'

@Component({
  selector: 'app-new-wallet',
  templateUrl: './new-wallet.component.html',
  styleUrls: ['./new-wallet.component.scss'],
})
export class NewWalletComponent implements OnInit {
  asset: Asset = Asset.BTC
  segment: 'restore' | 'generate' = 'generate'
  mnemonic: string[]

  constructor(private readonly modalCtrl: ModalController) { }
  ngOnInit() {
    this.refresh()
  }

  async dismiss(){
    await this.modalCtrl.dismiss()
  }

  async refresh() {
    this.mnemonic = bip39.generateMnemonic().split()
  }
}
