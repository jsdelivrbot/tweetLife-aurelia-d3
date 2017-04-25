import { inject, customElement, bindable } from 'aurelia-framework';
import moment from 'moment';
import * as d3 from 'd3';
import { event as currentEvent } from 'd3';
import $ from 'jquery';
import { CbkitDialogService } from 'pg/cbkit';
import { EventAggregator } from 'aurelia-event-aggregator';

const treeContainerWidth = 800;
const treeContainerHeight = 600;

@customElement('tl-expandable-tree')
@inject(CbkitDialogService, EventAggregator)
export class TlExpandableTree {
  @bindable data;
  @bindable loading;
  @bindable defaultView;

  _attached;
  transX = 0;
  transY = 0;
  treeSize = {};

  constructor(CbkitDialogService, EventAggregator) {
    this.CbkitDialogService = CbkitDialogService;
    this.timeline = '';
    this.showPause = false;
    this.timelineData = [];
    this.playPoint = 0;
    this.allowedPlay = false;
    this.eventAggregator = EventAggregator;

    this.startColor = d3.rgb(182, 208, 255);
    this.endColor = d3.rgb(0, 44, 123);
    this.computeColor = d3.interpolate(this.startColor, this.endColor);
  }

  attached() {
    this._attached = true;
    this.mouseDown = false;
    this.startPoint = {x: 0, y: 0};
    this.endPoint = {x: 0, y: 0};

    this.drag = d3.behavior.drag()
        .on("dragstart", () => {
            this.startPoint.x = currentEvent.sourceEvent.layerX;
            this.startPoint.y = currentEvent.sourceEvent.layerY;
        })
        .on("drag", () => {
            this.dragmove()
        });
        
    d3.select(this.svgContainer).call(this.drag);

    this.treeSvg = d3.select(".svgTree")
    this.svgTreeGroup = this.treeSvg.append("svg:g").attr("class", "innerGroup")
    this.svgLinkGroup = this.treeSvg.append("svg:g").attr("class", "links").attr("transform", 'translate(100, 0)');
    this.svgCircleGroup = this.treeSvg.append("svg:g").attr("class", "node").attr("transform", 'translate(100, 0)');

    this.diagonal = d3.svg.diagonal()
      .projection((d) => { return [d.y, d.x]; });
    this.durationTime = currentEvent && currentEvent.altKey ? 5000 : 500;

    this.init();
  }

  detached() {
    this._attached = false;
  }

  dataChanged() {
    this.init();
  }

  init() {
    if (!this._attached || !this.data) {
      return;
    }
    this.timelineData = this.data.timelineData.map(tld => {
      return { value: tld.value, key: moment(tld.key).format('ddd, hA'), time: tld.key };
    });

    this.timelinePlaytime = this.timelineData.length * 300;
    this.renderTimeline();

    this.tweetTreeData = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree));
    
    // to be deleted just for demo data 
    // this.tweetTreeData.children = this.tweetTreeData.children.slice(0, 30)

    this.cardModel = this.tweetTreeData.entity;

    let mockChild1 = this.tweetTreeData.children[2];
    mockChild1.children = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree)).children.slice(2, 5);
    mockChild1.children.forEach(d => {
      d.time = mockChild1.time + Math.random() * 1000 * 60 * 60 * 40;
    });
    let mockChild2 = this.tweetTreeData.children[6];
    mockChild2.children = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree)).children.slice(6, 9);
    mockChild2.children.forEach(d => {
      d.time = mockChild2.time + Math.random() * 1000 * 60 * 60 * 40
    });

    let mockChild22 = mockChild2.children[0];
    mockChild22.children = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree)).children.slice(0, 1);
    mockChild22.children.forEach(d => {
      d.time = mockChild22.time + Math.random() * 1000 * 60 * 60 * 40;
    });

    let mockChild3 = this.tweetTreeData.children[0];
    mockChild3.children = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree)).children.slice(10, 11);
    mockChild3.children.forEach(d => {
      d.time = mockChild3.time + Math.random() * 1000 * 60 * 60 * 40;
    });
    this.tweetTreeData.maxDepth = 3;


    this.treeSize.height = Math.max(this.tweetTreeData.children.length * 5, treeContainerHeight)
    this.treeSize.width = Math.min(this.tweetTreeData.maxDepth * 200, treeContainerWidth);
    this.configTree(this.treeSize.height, this.treeSize.width);

    // config color range
    let minTime = this.svgNodesData[0].time;
    let maxTime = 0;
    let treeDepth = 0;
    this.svgNodesData.forEach((data) => {
      if (data.time > maxTime) {
        maxTime = data.time;
      }
    })

    this.scale = d3.scale.linear().domain([minTime, maxTime]).range([0, 1]);

    this.defaultView = false;
    this.loading = false;
    this.allowedPlay = true;
    this.renderBaseTree();
  }

  configTree(height, width) {
    this.tree = d3.layout.tree().size([height, width]);
    this.svgNodesData = this.tree.nodes(this.tweetTreeData);

    this.treeSvg.attr({ width: width+220, height: height+20 })
    this.transX = 0;
    this.transY = -height/2 + 300;
    $('.svgTree').parent().css("transform", "translate(" + this.transX + "px, " + this.transY + "px)")
  }

  dragmove() {
      this.transX += (currentEvent.x - this.startPoint.x);
      this.transY += (currentEvent.y - this.startPoint.y);
      this.startPoint.x = currentEvent.x;
      this.startPoint.y = currentEvent.y;
      $('.svgTree').parent().css("transform", "translate(" + this.transX + "px, " + this.transY + "px)")
  }

  renderTimeline() {
    this.eventAggregator.publish('renderTimeline', this.timelineData)
  }

  // check the node collapsed
  isCollapse(node) {
    let collapse;
    if (!node) {
      collapse = false;
    }
    else if (!(node.children && node.children.length)) {
      collapse = false;
    }
    else if (node.collapse) {
      collapse = true;
    } else {
      if (node.parent) {
        collapse = this.isCollapse(node.parent);
      }
    }
    return collapse;
  }

  isRendering(node) {
    let rendering;
    if (node) {
      rendering = false
    }
    else if (node.rendering) {
      rendering = true;
    } else {
      if (node.parent) {
        rendering = this.isRendering(node.parent);
      }
    }
    return rendering;
  }

  // render a node (link and circle)
  renderNode(nodeData, animate) {
    let svgCircleGroup = this.svgCircleGroup;
    let linkNode, circleNode;
    if(nodeData.unRender){
      return;
    }
    if (nodeData.parent) {
      nodeData.rendering = true;
      // if the node`s parent is rendering, push the node  to waiting render queue
      // let parent render it until parent  self render complete
      if (this.isRendering(nodeData.parent)) {
        nodeData.parent.preRenderChild = nodeData.parent.preRenderChild || [];
        nodeData.parent.preRenderChild.push(nodeData);
      }
      else {
        linkNode = this.svgLinkGroup.append('svg:path').datum(nodeData)
          .attr('class', 'link')
          .attr("d", (d) => {
            return this.diagonal({ source: d.parent, target: d });
          })
          .style('stroke', (d) => {
            return d.unselected ? '#dce2ea' : '#54BDC8';
          })
          .style('display', d => {
            return this.isCollapse(d.parent) ? 'none' : ''
          })
          .transition()
          .duration(animate ? this.durationTime : 0)
          .attrTween("stroke-dasharray", function () {
            var len = this.getTotalLength();
            return function (t) { return (d3.interpolateString("0," + len, len + ",0"))(t) };
          }).each('end', (d) => {
            svgCircleGroup.append('svg:circle').datum(nodeData)
              .on('click', d => {
                this.toggleCollapse(d);
              })
              .on("mouseover", (d) => { this.showCard(d); })
              .on("mouseout", (d) => { this.hideCard(d); })
              .style('display', d => {
                return this.isCollapse(d.parent) ? 'none' : ''
              })
              .style("fill", (d) => {
                let time = this.scale(d.time);
                let color = this.computeColor(time)
                return color;
              })
              .style("stroke-width", d => {
                let strokeWidth = '1px';
                if (d.collapse && d.children && d.children.length) {
                  strokeWidth = '2px';
                }
                return strokeWidth;
              })
              .attr("r", 4.5)
              .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });
            nodeData.rendering = false;
            // if there were some child node wait for rendering complete to render.
            // render the waiting queue
            if (nodeData.preRenderChild) {
              nodeData.preRenderChild.forEach(child => {
                this.renderNode(child, animate);
              });
              nodeData.preRenderChild = [];
            }
          });
      }

    }
    else {
      svgCircleGroup.append('svg:circle').datum(nodeData)
        .on('click', d => {
          this.toggleCollapse(d);
        })
        .on("mouseover", (d) => { this.showCard(d); })
        .on("mouseout", (d) => { this.hideCard(d); })
        .style("stroke-width", d => {
          let strokeWidth = '1px';
          if (d.collapse && d.children && d.children.length) {
            strokeWidth = '2px';
          }
          return strokeWidth;
        })
        .attr("r", 4.5)
        .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });
    }
  }

  // update the selected 
  updateSelectNode() {
    this.svgLinkGroup.selectAll('path')
      .style('stroke', d => {
        return d.unselected ? '#dce2ea' : '#54BDC8';
      });
  }

  toggleCollapse(nodeData) {
    if (nodeData.children && nodeData.children.length) {
      nodeData.collapse = !nodeData.collapse;
      nodeData.children.forEach(d => d.collapse = true);
      this.updateCollapseNode();
    }
  }

  updateCollapseNode() {
    this.svgLinkGroup.selectAll('path')
      .style('display', d => {
        return this.isCollapse(d.parent) ? 'none' : ''
      });
    this.svgCircleGroup.selectAll('circle')
      .style('display', d => {
        return this.isCollapse(d.parent) ? 'none' : ''
      })
      .style("stroke-width", d => {
        let strokeWidth = '1px';
        if (d.collapse && d.children && d.children.length) {
          strokeWidth = '2px';
        }
        return strokeWidth;
      })
  }

  renderBaseTree() {
    this.svgNodesData.forEach(d => {
      d.unRender = false;
      d.unselected = false;
      d.collapse = false;
    });
    this.tweetTreeData.children.forEach(d => { d.collapse = true; });
    this.renderAll();
  }

  renderAll() {
    this.svgNodesData.forEach(d => {
      this.renderNode(d, false);
    });
  }

  playTree(lastTime, endTime) {
    let currentData = this.svgNodesData.filter(d => {
      return d.time >= lastTime && d.time <= endTime;
    });
    currentData.forEach(d => {
      d.unRender = false;
      d.collapse = false;
      d.unselected = false;
      this.renderNode(d, true);
    });
  }

  /** the databrush event handler: @params {startIndex,endIndex,startValue,endValue}  */
  dataBrush(params) {
    if (params.endIndex > 0) {
      let lastItem = this.timelineData[params.endIndex - 1];
      this.playTree(lastItem.time, params.endItem.time);
    }
  }

  /** the datazoomRange change event handler: @params {startIndex,endIndex,startValue,endValue}   */
  dataRangeChange(params) {
    // this.markTree(params);
    // this.updateTree(this.rootData, true);
    let startTime = this.timelineData[params.startIndex].time;
    let endTime = this.timelineData[params.endIndex].time;
    this.svgNodesData.forEach(d => {
      if (d.time >= startTime && d.time <= endTime) {
        d.unselected = false;
      } else {
        d.unselected = true;
      }
    });
    this.updateSelectNode();
  }

  /*  actions  */
  showCardTimeout;
  hideCardTimeout;

  showCard(d) {
    $(".cardHoverView").addClass('hide')
    let event = currentEvent;
    this.showCardTimeout = setTimeout(() => {
      $(".cardHoverView").css({ top: event.layerY + 10, left: event.layerX + 10 }).removeClass('hide');
      this.cardModel = d.entity
    }, 500)
  }

  hideCard(d) {
    clearTimeout(this.showCardTimeout);
    this.hideCardTimeout = setTimeout(() => {
      $(".cardHoverView").addClass('hide')
    }, 200)
  }

  hoverCard = () => {
    clearTimeout(this.hideCardTimeout);
  }

  outCard = () => {
    this.hideCardTimeout = setTimeout(() => {
      $(".cardHoverView").addClass('hide')
    }, 200)
  }

  clickTreeNode = (model) => {
    this.CbkitDialogService.openRecordDetail(model);
  }

  playDone(params) {
    this.showPause = false;
    this.allowedPlay = false;
  }


  /*
  ** operation btn
  */
  playBtnClicked() {
    if (this.allowedPlay) {
      $('.svgTree > g').empty();
      this.svgNodesData.forEach(d => {
        d.unRender = true;
        d.collapse = false;
        d.unselected = false;
      });
      this.timeline.playTimeline();
      this.showPause = true;
    }
  }

  pauseBtnClicked() {
    this.timeline.pauseTimeline();
    this.showPause = false;
  }
  expendBtnClicked() {
    if (this.svgNodesData && this.svgNodesData.length) {
      let currentExpandNodeDepth = -1;
      this.svgNodesData.forEach(d => {
        if (d.children && d.children.length) {
          if (!this.isCollapse(d) && d.depth > currentExpandNodeDepth) {
            currentExpandNodeDepth = d.depth;
          }
        }
      });
      currentExpandNodeDepth++;
      this.svgNodesData.forEach(d => {
        if (currentExpandNodeDepth >= d.depth) {
          d.collapse = false;
        } else {
          d.collapse = true;
        }
      });
      this.updateCollapseNode();
    }
  }
  resetBtnClicked() {
    this.timeline.resetTimeline();
    this.allowedPlay = true;
    this.showPause = false;
    $('.svgTree > g').empty();
    this.renderBaseTree();
  }

  zoomIn() {
    this.treeSize.height *= 1.5
    this.treeSize.width *= 1.5;
    let tempX = this.transX * 1.5;
    let tempY = this.transY * 1.5;

    this.configTree(this.treeSize.height, this.treeSize.width);
    $('.svgTree > g').empty();
    this.renderAll();
    this.transX = tempX;
    this.transY = tempY;
    $('.svgTree').parent().css("transform", "translate(" + this.transX + "px, " + this.transY + "px)")

  }

  zoomOut() {
    this.treeSize.height /= 1.5
    this.treeSize.width /= 1.5;
    let tempX = this.transX / 1.5;
    let tempY = this.transY / 1.5;

    this.configTree(this.treeSize.height, this.treeSize.width);
    $('.svgTree > g').empty();
    this.renderAll();
    this.transX = tempX;
    this.transY = tempY;
    $('.svgTree').parent().css("transform", "translate(" + this.transX + "px, " + this.transY + "px)");
  }

}
