import { inject, customElement, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
// import cardsData from '../../data/cardsDummyData';
import {CbkitDialogService} from 'pg/cbkit';

@inject(CbkitDialogService, EventAggregator)
export class TlCardList {
    @bindable data;
    @bindable loading;
    @bindable defaultView;
    @bindable cardNum;

    retweeterList = []

    constructor(CbkitDialogService, EventAggregator) {
        this.defaultView = true;
        this.loading = false;
        this.eventAggregator = EventAggregator;
        this.CbkitDialogService = CbkitDialogService;

       
    }

    attached() {
        // console.log(this.cardNum)
        this.click = (model) => {
            this.CbkitDialogService.openRecordDetail(model);
        }
    }

    dataChanged() {
        if(this.data){
            this.dataBackup = JSON.parse(JSON.stringify(this.data));
            this.retweeterList = (this.data.length > this.cardNum) ? this.dataBackup.splice(0, this.cardNum) : this.data;
        }else{
           this.retweeterList =[];
        }
        
    }
}