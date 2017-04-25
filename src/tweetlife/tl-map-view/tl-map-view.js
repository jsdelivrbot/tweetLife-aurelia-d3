import { inject, customElement, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { CbkitDialogService } from 'pg/cbkit';
import * as d3 from 'd3';
import _ from 'lodash';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import worldMapData from './world-countries.json!';
import countryCapitalLocation from './countryCapitalLocation.json!';


const DAY_TIMESPAN = 24 * 60 * 60 * 1000;
const HOUR_TIMESPAN = 60 * 60 * 1000;
const DEBOUNC_TIME = 300;

@customElement('tl-map-view')
@inject(Element, EventAggregator, CbkitDialogService)
export class TlMapView {
  @bindable data;
  @bindable loading;
  @bindable defaultView;
  element;
  ea;
  cbkitDialogService;

  fetchSubscription;

  totalBrushTime = 10000;
  timelineStepTime = 300;
  allowedPlay = true;
  allowHeatmap = false;
  showHeatmap = false;

  originTweet;
  timelineData;
  spreadMap;
  timelinePlayData = [];
  currentEvent;
  currentEntity;
  _debounceResize = _.debounce(this._reRender, DEBOUNC_TIME);
  _attached = false;
  resizing;
  reseted;

  constructor(element, eventAggregator, CbkitDialogService) {
    this.element = element;
    this.ea = eventAggregator;
    this.cbkitDialogService = CbkitDialogService;
    this.fetchSubscription = this.ea.subscribe('triggerFetch', () => {
      this.timeline && this.timeline.resetTimeline();
      this.timelinePlayData = [];
      this.showPause = false;
      this.allowedPlay = true
      this.reseted = true;
      this.allowHeatmap = false;
      this.showHeatmap = false;
    });
  }

  attached() {
    this._attached = true;
    this.mapContainer = d3.select(this.svgContainer).select('#tl-worldmap-countries');
    this.linesContaner = d3.select(this.svgContainer).select('#tl-worldmap-lines');
    this._renderMap();
    new ResizeSensor(this.element, () => {
      if (this.loading) {
        return;
      }
      this.resizing = true;
      this._debounceResize(this);
    });
    this._init();
  }

  detached() {
    this._attached = false;
    if (this.fetchSubscription) {
      this.fetchSubscription.dispose();
    }
  }

  dataChanged() {
    setTimeout(() => {
      this._init();
    });
  }
  _init() {

    if (!this._attached || !this.data) {
      return;
    }
    this.originTweet = this.data.originTweet;
    if (this.originTweet) {// just for demo to be deleted
      this.originTweet.attributes.country_code_enrich = ['us'];
    }
    this.timelineData = [];
    this.spreadMap = this.data.spreadMap;
    if (this.data.timelineData && this.data.timelineData.length) {
      const lastTimeDiff = this.data.timelineData[this.data.timelineData.length - 1].key;
      const lastHourDiff = Math.ceil(lastTimeDiff / HOUR_TIMESPAN);
      for (let i = 0; i <= lastHourDiff; i++) {
        this.timelineData.push({ key: i + 'h', value: 0 });
      }
      this.data.timelineData.forEach(tlData => {
        const hour = Math.ceil(tlData.key / HOUR_TIMESPAN);
        let mappingHour = this.timelineData.find(d => {
          return hour + 'h' == d.key;
        })
        if (mappingHour) {
          mappingHour.value = mappingHour.value + tlData.value;
        }
      });

      this.totalBrushTime = this._caculateBrushTime(lastHourDiff);
      this._clearMap();
      this._renderMap();
      this._clearOriginLine();
      this._clearSpreadLines();

      setTimeout(() => {
        this._renderOriginLine();
      }, 500);
    }
  }
  _reRender(self) {
    this.resizing = false;
    this._clearMap();
    this._clearOriginLine();
    this._clearSpreadLines();
    this._renderMap();
    if (!this.showHeatmap) {
      this._renderOriginLine();
      this.timelinePlayData.forEach((d, idx) => {
        this._renderHourLines(idx, d.key);
      });
    } else {
      this._renderHeatmap();
    }
  }

  // render function
  _renderMap() {
    const $svgContainer = $(this.svgContainer);
    let [width, height] = [$svgContainer.width(), $svgContainer.width() / 1.92];
    $svgContainer.attr('height', height);
    // width=1200;
    // height=800;

    /* Antarctica will not shown on the map */
    var features = _.filter(worldMapData.features, function (value, key) {
      return value.properties.name != 'Antarctica';
    });

    var projection = d3.geo.mercator();
    var oldScala = projection.scale();
    var oldTranslate = projection.translate();

    this.xy = projection
      .scale(oldScala * (width / oldTranslate[0] / 2))
      // .scale(oldScala*2)
      .translate([width / 2, height * 0.66]);

    let path = d3.geo.path().projection(this.xy);

    this.mapContainer.attr('width', width).attr('height', height);
    this.mapContainer.selectAll('path').data(features).enter().append('svg:path')
      .attr('country-code', data => data.CountryCode)
      .attr('d', path)
      .append('title')
      .text((d) => d.CountryCode);
  }
  _renderOriginLine() {
    if (!this._attached) {
      return;
    }
    if (!(this.timelineData && this.timelineData.length)) {
      return;
    }
    let tweet = this.originTweet;
    const lineBaseTop = -20;
    // get echart instance
    let chart = this.timeline.echart.getChart();
    // caculate the date`s postion(left) at the timeline
    let lineBaseLeft = chart.convertToPixel({ xAxisIndex: 0 }, 0);
    let startPosition = [lineBaseLeft, lineBaseTop];

    let originTweetGeo = this._getTweetGeo(tweet);
    if (originTweetGeo) {
      let endPosition = this.xy(originTweetGeo);
      const line = d3.svg.line().interpolate("linear")
        .x(data => data[0])
        .y(data => data[1]);

      this.linesContaner.append('svg:path')
        .attr('d', line([startPosition, [startPosition[0], endPosition[1]], endPosition]))
        .attr('class', 'origin')
        .attr("marker-start", "url(#marker_arrow)")
        .attr("marker-end", "url(#arrow)");

      this._renderLocationPoint(tweet, endPosition, { r: 6, class: 'origin' });

      this.linesContaner.append('svg:text')
        .text("Tweeted")
        .attr('class', 'origin')
        .attr('transform', 'translate(' + startPosition[0] + ', ' + (endPosition[1] + 18) + ')');
    }

  }
  _renderHourLines(index, endTime, animate) {
    if (!(this.timelineData && this.timelineData.length)) {
      return;
    }
    const lineBaseTop = -46;
    // get echart instance
    const chart = this.timeline.echart.getChart();
    // caculate the date`s postion(left) at the timeline
    const lineBaseLeft = chart.convertToPixel({ xAxisIndex: 0 }, index);
    const startPosition = [lineBaseLeft, lineBaseTop];

    let spreadTweets = [];
    this.spreadMap.forEach(tw => {
      let time = (new Date(tw.event_time || tw.eventTime)).getTime();
      let originTweetTime = (new Date(this.originTweet.event_time || tw.eventTime)).getTime();
      let hour = Math.ceil((time - originTweetTime) / HOUR_TIMESPAN) + 'h';
      if (hour == endTime) {
        let location = this._getTweetGeo(tw);
        if (location) {
          spreadTweets.push({
            tweet: tw,
            hour: hour,
            location: this._getTweetGeo(tw)
          });
        }
      }
    });

    spreadTweets.forEach(tw => {
      this._renderLine(startPosition, tw, animate)
    });

  }
  _renderLine(startPosition, twInfo, animate) {
    const line = d3.svg.line().interpolate("basis")
      .x(data => data[0])
      .y(data => data[1]);
    const endPosition = this.xy(twInfo.location);
    let speadLine = this.linesContaner.append('svg:path')
      .attr('d', line([startPosition, ...this._getSmoothPoint(startPosition, endPosition), endPosition]))
      .attr('id', 'speadline-' + twInfo.tweet.id)
      .attr('class', 'spread');
    if (animate) {
      let duration = speadLine.transition()
        .duration(1000)
        .attrTween("stroke-dasharray", function () {
          var len = this.getTotalLength();
          return function (t) { return (d3.interpolateString("0," + len, len + ",0"))(t) };
        });
      if (!this.resizing) {
        duration.each('end', () => {
          if (this.reseted) {
            return;
          }
          this._renderLocationPoint(twInfo.tweet, endPosition);
        });
      }

    } else {
      this._renderLocationPoint(twInfo.tweet, endPosition);
    }

  }
  _renderLocationPoint(tweet, position, options) {
    options = _.assignIn({ r: 8, class: 'spread' }, options);
    let circle = this.linesContaner
      .append('circle')
      .datum(tweet)
      .attr('r', options.r)
      .attr('id', 'speadcircle-' + tweet.id)
      .attr('class', options.class)
      .on('mouseover', () => {
        this.linesContaner.select('#speadline-' + tweet.id).classed('active', true);
        this.linesContaner.select('#speadcircle-' + tweet.id).classed('active', true);
        this.currentEvent = tweet;
        this.currentEntity = tweet.entities.from;
        this._showEntityCard(position);
      })
      .on('mouseout', () => {
        this.linesContaner.select('#speadline-' + tweet.id).classed('active', false);
        this.linesContaner.select('#speadcircle-' + tweet.id).classed('active', false);
        this._hideEntityCard();
      })
      .on('click', (tweet) => {
        this.cbkitDialogService.openRecordDetail(tweet);
      })
      .attr('fill', 'rgba(73,144,226,0.6)')
      .attr('transform', 'translate(' + position[0] + ', ' + position[1] + ')');
    if (tweet.attributes.country_code_enrich && tweet.attributes.country_code_enrich[0]) {
      let countryCode = tweet.attributes.country_code_enrich[0].toUpperCase();
      let spreadCountryPath = this.mapContainer.select('[country-code="' + countryCode + '"]');
      spreadCountryPath.classed(options.class, true)
    }
  }
  _renderHeatmap() {
    if (this.data.eventsByCountryCode) {
      let compute = d3.interpolate(d3.rgb('#83a8d8'), d3.rgb('#9ec5dd'));
      let scaleDomain = this.data.eventsByCountryCode.map(d => d.value);
      scaleDomain = _.sortedUniq(scaleDomain);
      let colorRange = d3.scale.linear()
        .domain([202, 1])
        .range([0, 1]);
      this.data.eventsByCountryCode.forEach(d => {
        this.mapContainer.select('[country-code="' + d.key.toUpperCase() + '"]')
          .style('fill', compute(colorRange(d.value)))

          .select('title')
          .text(d.key.toUpperCase() + '\n' + d.value);
      });
    }
  }
  _clearMap() {
    this.mapContainer.selectAll('path').remove();
  }
  _clearOriginLine() {
    this.linesContaner.selectAll('.origin').remove();
  }
  _clearSpreadLines() {
    this.linesContaner.selectAll('.spread').remove();
    this.mapContainer.selectAll('.spread').classed('spread', false);
  }
  _showEntityCard(position) {
    let cardContainer = $(this.element).find('#tl-worldmap-entitycard');
    let offsetParent = cardContainer.parent();
    let left = position[0] + parseInt(offsetParent.css('paddingLeft'));
    let top = position[1] + parseInt(offsetParent.css('paddingTop')) + 20;
    const $svgContainer = $(this.svgContainer);
    left = Math.min(left, $svgContainer.width() - 250);
    cardContainer.removeClass('hide')
      .css({ left: left, top: top });
  }
  _hideEntityCard() {
    $(this.element).find('#tl-worldmap-entitycard').addClass('hide');
  }
  // private method
  _getTweetGeo(tweet) {
    let geo;
    if (tweet.attributes.geo) {
      geo = tweet.attributes.geo;
    } else {
      if (tweet.attributes.country_code_enrich && tweet.attributes.country_code_enrich[0]) {
        let capitalInfo = countryCapitalLocation.find(cap => {
          return cap.CountryCode == tweet.attributes.country_code_enrich[0].toUpperCase();
        });
        if (capitalInfo) {
          geo = [capitalInfo.CapitalLongitude, capitalInfo.CapitalLatitude];
        }
      }
    }
    return geo;
  }
  _getSmoothPoint(startPoint, endPoint) {
    const [x1, y1] = startPoint;
    const [x2, y2] = endPoint;
    return [
      [x1 + (x2 - x1) / 12, y1 + (y2 - y1) * 5 / 12],
      [x1 + (x2 - x1) * 4 / 12, y1 + (y2 - y1) * 9 / 12],
      [x1 + (x2 - x1) * 8 / 12, y1 + (y2 - y1) * 11 / 12],
    ];
  }
  _caculateBrushTime(count) {
    const minTime = 1000;
    return minTime + count * this.timelineStepTime;
  }

  // events
  __toggleHeatmap() {
    this._reRender();
  }
  __playBtnClicked() {
    this.timeline.playTimeline();
    this.showPause = true;
    this.reseted = false;
    this.allowHeatmap = false;
  }
  __pauseBtnClicked() {
    this.timeline.pauseTimeline();
    this.showPause = false;
  }
  __resetBtnClicked() {
    this.timeline.resetTimeline();
    this.timelinePlayData = [];
    this.showPause = false;
    this.allowedPlay = true
    this.reseted = true;
    this.allowHeatmap = false;
    this.showHeatmap = false;
    this._reRender();
  }
  __timelineBrush(d) {
    this.timelinePlayData.push(d.endItem);
    this._renderHourLines(d.endIndex, d.endItem.key, true);
  }
  __playDone(params) {
    this.showPause = false;
    this.allowedPlay = false;
    this.allowHeatmap = true;
  }

}
