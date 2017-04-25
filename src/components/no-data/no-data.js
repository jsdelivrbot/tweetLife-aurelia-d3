import { inject, bindable, containerless } from 'aurelia-framework';

@containerless
export class NoData {
    @bindable data;
}
