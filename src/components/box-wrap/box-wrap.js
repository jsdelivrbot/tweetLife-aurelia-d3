import { inject, bindable, containerless } from 'aurelia-framework';

@inject(Element)
export class BoxWrap {
    @bindable class;
    @bindable title;
    @bindable list;
    @bindable isShowSelection;
    @bindable activeTab;

    getClassNames() {
        const classes = ['box-wrap'];
        if (this.class) {
            classes.push(this.class);
        }
        return classes.join(' ');
    }

    changeView(item) {
        const oldTab = this.activeTab;
        this.activeTab = item;
        if (oldTab !== item) {
            this.element.dispatchEvent(new CustomEvent('activetabchange', {
                detail: {
                    activeTab: this.activeTab
                }, bubbles: true
            })
            );
        }

    }

    constructor(element) {
        this.element = element;
    }

    attached() {
        this.activeTab = this.isShowSelection ? this.list[0] : null;
    }
    listChanged() {
        if (this.list) {
            this.activeTab = this.list[0];
        }
    }
}
