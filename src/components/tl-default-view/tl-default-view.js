import { customElement, bindable,containerless } from 'aurelia-framework';

@customElement('tl-default-view')
@containerless
export class TlDefaultView {
  @bindable icon;
}
