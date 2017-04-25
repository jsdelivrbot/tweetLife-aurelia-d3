import { inject, customElement, bindable } from 'aurelia-framework';
import cardsData from '../../data/cardsDummyData';
import {Record, RecordType, RecordUtils, CbkitService} from 'pg/cbkit';

export class TlCardListCustomElement {
    cardsData = cardsData;

    constructor(RecordUtils, CbkitService) {
      this.recordUtils = RecordUtils;
      this.cbkitService = CbkitService;
    }

    activate() {
      this.click = (model) => {
        this.cbkitService.openRecordDetail(model);
      }
      this.eventCardContextMenu = [{
        title: "Original Link",
        callback: (model) => this.cbkitService.openRecordDetail(model),
        hidden: this.buildProfileMode && this.phase0A,
      }, {
        title: "Export as PNG",
        callback: (model) => this.cbkitService.openRecordDetail(model),
        hidden: this.buildProfileMode && this.phase0A,
      }, {
        title: "Export as PDF",
        callback: (model) => this.cbkitService.openRecordDetail(model),
        hidden: this.buildProfileMode && this.phase0A,
      }, {
        title: "Search this Twitter ID",
        callback: (model) => this.cbkitService.openRecordDetail(model),
        hidden: this.buildProfileMode && this.phase0A,
      }];

      this.entityCardContextMenu = [...this.eventCardContextMenu];
    }
}