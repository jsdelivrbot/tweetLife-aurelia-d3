import moment from 'moment';

export class DateFormatValueConverter {
  toView(value, format) {
    return moment(value).hours() + ' hr ' + moment(value).minutes() + ' min';
  }
}