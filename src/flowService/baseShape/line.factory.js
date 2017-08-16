/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/11
 * $END$
 */

angular.module('wbgAdminApp').factory('BPMLine', function (BPMUtils, BPM_CONSTANT) {
    function BPMLine(startPoint, container, elementMap, options) {
        var _this = this;
        this.id = options.id || BPMUtils.getUID();
        this.type = BPM_CONSTANT.ELEMENT_TYPE.LINE;
        var config = {
            startDirection: BPMLine.DIRCTION.RIGHT,//线的开始方向
            endDirection: null,
            color: '#666666',
            minJointLength: 20, //开始连接点，结束连接最小延伸长度
            maxTurnRadius: 10, //拐点最大拐弯半径
            markArrow: 'ral-arrow'
        };

        this.container = container;
        this.elementMap = elementMap;
        this.config = BPMUtils.assign({}, config, options);

        this.line = container.append('path')
            .classed('wbg-bpm-line', true)
            .attr('id', this.id)
            .attr('tabindex', 0)
            .attr('fill', 'transparent')
            .attr('stroke', this.config.color);

        this.startPoint = startPoint;
        this.endPoint = null;

        this.strokeString = this.addArrowMarker(this.line.style('stroke'));

        this.initEvent();
    }

    BPMLine.convertDiagramInfo = function (diagramInfo, container, elementMap) {
        var bpmLine = new BPMLine({x: diagramInfo.start.x, y: diagramInfo.start.y}, container, elementMap, {
            id: diagramInfo.id,
            color: diagramInfo.color,
            startDirection: diagramInfo.start.direction
        });

        bpmLine.lineTo({x: diagramInfo.end.x, y: diagramInfo.end.y}, diagramInfo.end.direction);
        bpmLine.line.attr('data-link', diagramInfo.link);

        elementMap.set(bpmLine.id, bpmLine);

        var linkIds = diagramInfo.link.split('@');

        if (elementMap.has(linkIds[0])) {//link start
            elementMap.get(linkIds[0]).out.add(linkIds[1]);
        }
        if (elementMap.has(linkIds[1])) {//link end
            elementMap.get(linkIds[1]).in.add(linkIds[0]);
        }

        return bpmLine;
    };

    BPMLine.prototype.getDiagramInfo = function () {
        var diagramInfo = {
            id: this.id,
            start: {
                x: this.startPoint.x,
                y: this.startPoint.y,
                direction: this.config.startDirection
            },
            end: {
                x: this.endPoint.x,
                y: this.endPoint.y,
                direction: this.config.endDirection
            },
            link: this.line.attr('data-link'),
            color: this.config.color,
            type: BPM_CONSTANT.ELEMENT_TYPE.LINE
        };

        return diagramInfo;
    };

    BPMLine.prototype.initEvent = function () {
        var self = this;

        //不能用css设置marker的颜色，只能重新做def一个marker标记替换。
        this.line.on('mouseenter.' + this.id, function () {
            self.changeMarkerColor(self.line.style('stroke'));
        }).on('mouseleave.' + this.id, function () {
            self.changeMarkerColor(self.line.style('stroke'));
        }).on('focus.' + this.id, function () {
            d3.select('.wbg-bpm-node-active').classed('wbg-bpm-node-active', false);
            self.line.classed('wbg-bpm-node-active', true);
            self.changeMarkerColor(self.line.style('stroke'));
        }).on('blur.' + this.id, function () {
            self.line.classed('wbg-bpm-node-active', false);
            self.changeMarkerColor(self.line.style('stroke'));
        });
    };

    BPMLine.prototype.destroyEvent = function () {
        this.line.on('.' + this.id, null);
    };

    BPMLine.prototype.setColor = function (color) {
        this.line.attr('stroke', color);
        this.config.color = color;
        this.changeMarkerColor(color);
    };

    BPMLine.prototype.changeMarkerColor = function (color) {

        this.strokeString = this.addArrowMarker(color);

        if (this.line.attr('marker-start')) {
            this.line.attr('marker-start', 'url(#' + this.config.markArrow + '-adverse-' + this.strokeString + ')');

        } else if (this.line.attr('marker-end')) {
            this.line.attr('marker-end', 'url(#' + this.config.markArrow + '-' + this.strokeString + ')');
        }
    };

    BPMLine.prototype.addArrowMarker = function (color) {
        //箭头marker不能用css改样式，如果换颜色，只能重新造一个
        var container = this.container;

        var defs = container.select('defs').empty() ? container.append('defs') : container.select('defs');
        var d3Rgb = d3.rgb(color);
        var strokeString = '' + Math.round(d3Rgb.r) + Math.round(d3Rgb.g) + Math.round(d3Rgb.b) + Math.round(d3Rgb.opacity * 100);

        if (defs.select('marker#'+ this.config.markArrow + '-' + strokeString).empty()) {
            var arrowMarker = defs.append('marker')
                .attr('id', this.config.markArrow + '-' + strokeString)
                .attr('orient', 'auto')
                .attr('markerHeight', 10)
                .attr('markerWidth', 10)
                .attr('markerUnits', 'userSpaceOnUse')
                .attr('refX', 5)
                .attr('refY', 0)
                .attr('viewBox', '-5 -5 10 10')
                .style('fill', this.line.style('stroke'));
            arrowMarker.append('path').attr('d', 'M 0,0 m -5,-5 L 5,0 L -5, 5 Z');
        }
        //adverse arrow
        if (defs.select('marker#'+ this.config.markArrow + '-adverse-' + strokeString).empty()) {
            var arrowMarkerAdverse = defs.append('marker')
                .attr('id', this.config.markArrow + '-adverse' + '-' + strokeString)
                .attr('orient', 'auto')
                .attr('markerHeight', 10)
                .attr('markerWidth', 10)
                .attr('markerUnits', 'userSpaceOnUse')
                .attr('refX', -5)
                .attr('refY', 0)
                .attr('viewBox', '-5 -5 10 10')
                .style('fill', this.line.style('stroke'));
            arrowMarkerAdverse.append('path').attr('d', 'M 0,0 m 5,5 L -5,0 L 5, -5 Z');
        }

        return strokeString;
    };

    BPMLine.DIRCTION = {
        RIGHT: 1,
        LEFT: -1,
        TOP: -2,
        BOTTOM: 2,
        AUTO: 0
    };

    BPMLine.AXIS = {
        HORIZONTAL: '1',
        VERTICAL: '-1'
    };

    BPMLine.getNumberSign = function (number) {
        return number < 0 ? -1 : 1;
    };

    BPMLine.getP2PDirection = function (startPoint, endPoint) {
        var dist = {
            x: Math.abs(endPoint.x - startPoint.x),
            y: Math.abs(endPoint.y - startPoint.y)
        };

        if (dist.x > dist.y) {
            return endPoint.x < startPoint.x ? BPMLine.DIRCTION.RIGHT : BPMLine.DIRCTION.LEFT;
        } else {
            return endPoint.y < startPoint.y ? BPMLine.DIRCTION.BOTTOM : BPMLine.DIRCTION.TOP;
        }
    };

    BPMLine.lineToPointNeighbour = function (startPoint, endPoint, startDirection, endDirection, maxTurnRadius, minJointLength) {
        var dist = {
            x: Math.abs(endPoint.x - startPoint.x),
            y: Math.abs(endPoint.y - startPoint.y)
        };

        var str = 'M' + startPoint.x + ',' + startPoint.y;
        var adverse = false;

        switch (startDirection) {
            case BPMLine.DIRCTION.TOP:
                switch (endDirection) {
                    case BPMLine.DIRCTION.LEFT:
                        if (startPoint.x > (endPoint.x - minJointLength) || endPoint.y > (startPoint.y - minJointLength)) {//线为四折线
                            var outTurnRadius = 0, inTurnRadius = 0, midTurnRadius = 0;//连线出口拐点半径，中间的拐点半径，进口拐点半径
                            var hTurnLineLength = Math.abs(startPoint.x - (endPoint.x - minJointLength));//四折线中拐弯后横向直线的长度
                            var vTurnLineLength = Math.abs(endPoint.y - (startPoint.y - minJointLength));//四折线中拐弯后纵向直线的长度

                            outTurnRadius = (hTurnLineLength < 2 * maxTurnRadius) ? (hTurnLineLength / 2) : maxTurnRadius;
                            inTurnRadius = (vTurnLineLength < 2 * maxTurnRadius) ? (vTurnLineLength / 2) : maxTurnRadius;
                            midTurnRadius = Math.min(outTurnRadius, inTurnRadius);

                            if (startPoint.x > (endPoint.x - minJointLength)) {
                                if (endPoint.y > (startPoint.y - minJointLength)) {
                                    str += 'v' + -(minJointLength - outTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                    str += 'h' + -(hTurnLineLength - outTurnRadius - midTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                    str += 'v' + (vTurnLineLength - inTurnRadius - midTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                    str += 'h' + (minJointLength - inTurnRadius);
                                } else {
                                    if (dist.y > 2 * minJointLength) {
                                        str += 'v' + -(dist.y / 2 - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                        str += 'h' + -(hTurnLineLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                        str += 'v' + -(dist.y / 2 - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                        str += 'h' + (minJointLength - inTurnRadius);
                                    } else {
                                        str += 'v' + -(minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                        str += 'h' + -(hTurnLineLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                        str += 'v' + -(dist.y - minJointLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                        str += 'h' + (minJointLength - inTurnRadius);
                                    }
                                }
                            } else {
                                if (endPoint.y > (startPoint.y - minJointLength)) {
                                    if (dist.x > 2 * minJointLength) {
                                        str += 'v' + -(minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                        str += 'h' + (dist.x / 2 - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                        str += 'v' + (vTurnLineLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                        str += 'h' + (dist.x / 2 - inTurnRadius);
                                    } else {
                                        str += 'v' + -(minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                        str += 'h' + (dist.x - minJointLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                        str += 'v' + (vTurnLineLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                        str += 'h' + (minJointLength - inTurnRadius);
                                    }
                                } else {
                                    //就是L型线
                                }
                            }

                        } else {//线为L型
                            str += 'v' + -(dist.y - maxTurnRadius);
                            str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, maxTurnRadius);
                            str += 'h' + (dist.x - maxTurnRadius);
                        }

                        break;
                    case BPMLine.DIRCTION.RIGHT:
                        if (startPoint.x < (endPoint.x + minJointLength) || endPoint.y > (startPoint.y - minJointLength)) {//线为四折线
                            var outTurnRadius = 0, inTurnRadius = 0, midTurnRadius = 0;//连线出口拐点半径，中间的拐点半径，进口拐点半径
                            var hTurnLineLength = Math.abs(startPoint.x - (endPoint.x + minJointLength));//四折线中拐弯后横向直线的长度
                            var vTurnLineLength = Math.abs(endPoint.y - (startPoint.y - minJointLength));//四折线中拐弯后纵向直线的长度

                            outTurnRadius = (hTurnLineLength < 2 * maxTurnRadius) ? (hTurnLineLength / 2) : maxTurnRadius;
                            inTurnRadius = (vTurnLineLength < 2 * maxTurnRadius) ? (vTurnLineLength / 2) : maxTurnRadius;
                            midTurnRadius = Math.min(outTurnRadius, inTurnRadius);

                            if (startPoint.x < (endPoint.x + minJointLength)) {
                                if (endPoint.y > (startPoint.y - minJointLength)) {
                                    str += 'v' + -(minJointLength - outTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                    str += 'h' + (hTurnLineLength - outTurnRadius - midTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                    str += 'v' + (vTurnLineLength - inTurnRadius - midTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                    str += 'h' + -(minJointLength - inTurnRadius);
                                } else {
                                    if (dist.y > 2 * minJointLength) {
                                        str += 'v' + -(dist.y / 2 - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                        str += 'h' + (hTurnLineLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                        str += 'v' + -(dist.y / 2 - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                        str += 'h' + -(minJointLength - inTurnRadius);
                                    } else {
                                        str += 'v' + -(minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                        str += 'h' + (hTurnLineLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                        str += 'v' + -(dist.y - minJointLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                        str += 'h' + -(minJointLength - inTurnRadius);
                                    }
                                }
                            } else {
                                if (endPoint.y > (startPoint.y - minJointLength)) {
                                    if (dist.x > 2 * minJointLength) {
                                        str += 'v' + -(minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                        str += 'h' + -(dist.x / 2 - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                        str += 'v' + (vTurnLineLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                        str += 'h' + -(dist.x / 2 - inTurnRadius);
                                    } else {
                                        str += 'v' + -(minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                        str += 'h' + -(dist.x - minJointLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                        str += 'v' + (vTurnLineLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                        str += 'h' + -(minJointLength - inTurnRadius);
                                    }
                                } else {
                                    //就是L型线
                                }
                            }

                        } else {//线为L型
                            str += 'v' + -(dist.y - maxTurnRadius);
                            str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, maxTurnRadius);
                            str += 'h' + -(dist.x - maxTurnRadius);
                        }
                        break;
                    default:
                        //error 方位不是邻接的点
                        break;
                }
                break;

            case BPMLine.DIRCTION.BOTTOM:
                switch (endDirection) {
                    case BPMLine.DIRCTION.LEFT:
                        if (startPoint.x > (endPoint.x - minJointLength) || endPoint.y < (startPoint.y + minJointLength)) {//线为四折线
                            var outTurnRadius = 0, inTurnRadius = 0, midTurnRadius = 0;//连线出口拐点半径，中间的拐点半径，进口拐点半径
                            var hTurnLineLength = Math.abs(startPoint.x - (endPoint.x - minJointLength));//四折线中拐弯后横向直线的长度
                            var vTurnLineLength = Math.abs(endPoint.y - (startPoint.y + minJointLength));//四折线中拐弯后纵向直线的长度

                            outTurnRadius = (hTurnLineLength < 2 * maxTurnRadius) ? (hTurnLineLength / 2) : maxTurnRadius;
                            inTurnRadius = (vTurnLineLength < 2 * maxTurnRadius) ? (vTurnLineLength / 2) : maxTurnRadius;
                            midTurnRadius = Math.min(outTurnRadius, inTurnRadius);

                            if (startPoint.x > (endPoint.x - minJointLength)) {
                                if (endPoint.y < (startPoint.y + minJointLength)) {
                                    str += 'v' + (minJointLength - outTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                    str += 'h' + -(hTurnLineLength - outTurnRadius - midTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                    str += 'v' + -(vTurnLineLength - inTurnRadius - midTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                    str += 'h' + (minJointLength - inTurnRadius);
                                } else {
                                    if (dist.y > 2 * minJointLength) {
                                        str += 'v' + (dist.y / 2 - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                        str += 'h' + -(hTurnLineLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                        str += 'v' + (dist.y / 2 - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                        str += 'h' + (minJointLength - inTurnRadius);
                                    } else {
                                        str += 'v' + (minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                        str += 'h' + -(hTurnLineLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                        str += 'v' + (dist.y - minJointLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                        str += 'h' + (minJointLength - inTurnRadius);
                                    }
                                }
                            } else {
                                if (endPoint.y < (startPoint.y + minJointLength)) {
                                    if (dist.x > 2 * minJointLength) {
                                        str += 'v' + (minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                        str += 'h' + (dist.x / 2 - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                        str += 'v' + -(vTurnLineLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                        str += 'h' + (dist.x / 2 - inTurnRadius);
                                    } else {
                                        str += 'v' + (minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                        str += 'h' + (dist.x - minJointLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                        str += 'v' + -(vTurnLineLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, inTurnRadius);
                                        str += 'h' + (minJointLength - inTurnRadius);
                                    }
                                } else {
                                    //就是L型线
                                }
                            }

                        } else {//线为L型
                            str += 'v' + (dist.y - maxTurnRadius);
                            str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, maxTurnRadius);
                            str += 'h' + (dist.x - maxTurnRadius);
                        }

                        break;
                    case BPMLine.DIRCTION.RIGHT:
                        if (startPoint.x < (endPoint.x + minJointLength) || endPoint.y < (startPoint.y + minJointLength)) {//线为四折线
                            var outTurnRadius = 0, inTurnRadius = 0, midTurnRadius = 0;//连线出口拐点半径，中间的拐点半径，进口拐点半径
                            var hTurnLineLength = Math.abs(startPoint.x - (endPoint.x + minJointLength));//四折线中拐弯后横向直线的长度
                            var vTurnLineLength = Math.abs(endPoint.y - (startPoint.y + minJointLength));//四折线中拐弯后纵向直线的长度

                            outTurnRadius = (hTurnLineLength < 2 * maxTurnRadius) ? (hTurnLineLength / 2) : maxTurnRadius;
                            inTurnRadius = (vTurnLineLength < 2 * maxTurnRadius) ? (vTurnLineLength / 2) : maxTurnRadius;
                            midTurnRadius = Math.min(outTurnRadius, inTurnRadius);

                            if (startPoint.x < (endPoint.x + minJointLength)) {
                                if (endPoint.y < (startPoint.y + minJointLength)) {
                                    str += 'v' + (minJointLength - outTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                    str += 'h' + (hTurnLineLength - outTurnRadius - midTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                    str += 'v' + -(vTurnLineLength - inTurnRadius - midTurnRadius);
                                    str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                    str += 'h' + -(minJointLength - inTurnRadius);
                                } else {
                                    if (dist.y > 2 * minJointLength) {
                                        str += 'v' + (dist.y / 2 - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                        str += 'h' + (hTurnLineLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                        str += 'v' + (dist.y / 2 - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                        str += 'h' + -(minJointLength - inTurnRadius);
                                    } else {
                                        str += 'v' + (minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, outTurnRadius);
                                        str += 'h' + (hTurnLineLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.TOP, midTurnRadius);
                                        str += 'v' + (dist.y - minJointLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                        str += 'h' + -(minJointLength - inTurnRadius);
                                    }
                                }
                            } else {
                                if (endPoint.y < (startPoint.y + minJointLength)) {
                                    if (dist.x > 2 * minJointLength) {
                                        str += 'v' + (minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                        str += 'h' + -(dist.x / 2 - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                        str += 'v' + -(vTurnLineLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                        str += 'h' + -(dist.x / 2 - inTurnRadius);
                                    } else {
                                        str += 'v' + (minJointLength - outTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, outTurnRadius);
                                        str += 'h' + -(dist.x - minJointLength - outTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                                        str += 'v' + -(vTurnLineLength - inTurnRadius - midTurnRadius);
                                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, inTurnRadius);
                                        str += 'h' + -(minJointLength - inTurnRadius);
                                    }
                                } else {
                                    //就是L型线
                                }
                            }

                        } else {//线为L型
                            str += 'v' + (dist.y - maxTurnRadius);
                            str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, maxTurnRadius);
                            str += 'h' + -(dist.x - maxTurnRadius);
                        }
                        break;
                    default:
                        //error 方位邻接的点
                        break;
                }

                break;

            case BPMLine.DIRCTION.LEFT:
                switch (endDirection) {
                    case BPMLine.DIRCTION.TOP:
                        str = BPMLine.lineToPointNeighbour(endPoint, startPoint, endDirection, startDirection, maxTurnRadius, minJointLength).lineStr;
                        adverse = true;
                        break;
                    case BPMLine.DIRCTION.BOTTOM:
                        str = BPMLine.lineToPointNeighbour(endPoint, startPoint, endDirection, startDirection, maxTurnRadius, minJointLength).lineStr;
                        adverse = true;
                        break;
                    default:
                        //error 不是方位不是邻接的点
                        break;
                }
                break;

            case BPMLine.DIRCTION.RIGHT:
                switch (endDirection) {
                    case BPMLine.DIRCTION.TOP:
                        str = BPMLine.lineToPointNeighbour(endPoint, startPoint, endDirection, startDirection, maxTurnRadius, minJointLength).lineStr;
                        adverse = true;
                        break;
                    case BPMLine.DIRCTION.BOTTOM:
                        str = BPMLine.lineToPointNeighbour(endPoint, startPoint, endDirection, startDirection, maxTurnRadius, minJointLength).lineStr;
                        adverse = true;
                        break;
                    default:
                        //error 不是方位不是邻接的点
                        break;
                }
                break;
        }

        return {
            lineStr: str,
            adverse: adverse
        };
    };

    BPMLine.lineToPointOpposite = function (startPoint, endPoint, direction, maxTurnRadius, minJointLength) {
        var dist = {
            x: Math.abs(endPoint.x - startPoint.x),
            y: Math.abs(endPoint.y - startPoint.y)
        };

        var str = 'M' + startPoint.x + ',' + startPoint.y;
        var adverse = false;

        switch (direction) {
            case BPMLine.DIRCTION.TOP:
                var outsideTurnRadius = 0;
                var jointLineLength = 0;

                if (endPoint.y < (startPoint.y - 2 * minJointLength)) {//三折线
                    outsideTurnRadius = (dist.x < 2 * maxTurnRadius) ? (dist.x / 2) : maxTurnRadius;
                    jointLineLength = (dist.y - 2 * outsideTurnRadius) / 2;

                    str += 'v' + -jointLineLength;
                    if (endPoint.x < startPoint.x) {//结束坐标在开始左边
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outsideTurnRadius);
                        str += 'h' + -(dist.x - 2 * outsideTurnRadius);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, outsideTurnRadius);
                    } else {
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, outsideTurnRadius);
                        str += 'h' + (dist.x - 2 * outsideTurnRadius);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, outsideTurnRadius);
                    }

                    str += 'v' + -jointLineLength;

                } else {//五折线
                    var midLineTotalLength = 0;
                    if (endPoint.y < startPoint.y) {
                        midLineTotalLength = 2 * minJointLength - dist.y;
                    } else {
                        midLineTotalLength = dist.y + 2 * minJointLength;
                    }

                    var midTurnRadius = (midLineTotalLength < 2 * maxTurnRadius) ? (midLineTotalLength / 2) : maxTurnRadius;

                    if (dist.x < 4 * midTurnRadius) {
                        outsideTurnRadius = midTurnRadius = dist.x / 4;
                    } else {
                        outsideTurnRadius = ((dist.x - 2 * midTurnRadius) < 2 * maxTurnRadius) ? ((dist.x - 2 * midTurnRadius) / 2) : maxTurnRadius;
                    }

                    var midLineLength = midLineTotalLength - 2 * midTurnRadius;


                    var totalTurnRadius = 2 * outsideTurnRadius + 2 * midTurnRadius;

                    jointLineLength = minJointLength - outsideTurnRadius;
                    str += 'v' + -jointLineLength;


                    if (endPoint.x < startPoint.x) {//结束坐标在开始左边
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outsideTurnRadius);
                        str += 'h' + -((dist.x - totalTurnRadius) / 2);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, midTurnRadius);
                        str += 'v' + midLineLength;
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, midTurnRadius);
                        str += 'h' + -((dist.x - totalTurnRadius) / 2);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, outsideTurnRadius);
                    } else {
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, outsideTurnRadius);
                        str += 'h' + ((dist.x - totalTurnRadius) / 2);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.TOP, midTurnRadius);
                        str += 'v' + midLineLength;
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, midTurnRadius);
                        str += 'h' + ((dist.x - totalTurnRadius) / 2);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, outsideTurnRadius);
                    }

                    str += 'v' + -jointLineLength;
                }

                break;
            case BPMLine.DIRCTION.BOTTOM:
                str = BPMLine.lineToPointOpposite(endPoint, startPoint, BPMLine.DIRCTION.TOP, maxTurnRadius, minJointLength).lineStr;
                adverse = true;

                break;
            case BPMLine.DIRCTION.LEFT:
                var outsideTurnRadius = 0;
                var jointLineLength = 0;

                if (endPoint.x < (startPoint.x - 2 * minJointLength)) {//三折线
                    outsideTurnRadius = (dist.y < 2 * maxTurnRadius) ? (dist.y / 2) : maxTurnRadius;
                    jointLineLength = (dist.x - 2 * outsideTurnRadius) / 2;

                    str += 'h' + -jointLineLength;
                    if (endPoint.y < startPoint.y) {//结束坐标在开始上边
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, outsideTurnRadius);
                        str += 'v' + -(dist.y - 2 * outsideTurnRadius);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outsideTurnRadius);
                    } else {
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, outsideTurnRadius);
                        str += 'v' + (dist.y - 2 * outsideTurnRadius);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, outsideTurnRadius);
                    }

                    str += 'h' + -jointLineLength;

                } else {//五折线
                    var midLineTotalLength = 0;
                    if (endPoint.x < startPoint.x) {
                        midLineTotalLength = 2 * minJointLength - dist.x;
                    } else {
                        midLineTotalLength = dist.x + 2 * minJointLength;
                    }

                    var midTurnRadius = (midLineTotalLength < 2 * maxTurnRadius) ? (midLineTotalLength / 2) : maxTurnRadius;

                    if (dist.y < 4 * midTurnRadius) {
                        outsideTurnRadius = midTurnRadius = dist.y / 4;
                    } else {
                        outsideTurnRadius = ((dist.y - 2 * midTurnRadius) < 2 * maxTurnRadius) ? ((dist.y - 2 * midTurnRadius) / 2) : maxTurnRadius;
                    }

                    var midLineLength = midLineTotalLength - 2 * midTurnRadius;


                    var totalTurnRadius = 2 * outsideTurnRadius + 2 * midTurnRadius;

                    jointLineLength = minJointLength - outsideTurnRadius;
                    str += 'h' + -jointLineLength;


                    if (endPoint.y < startPoint.y) {//结束坐标在开始上边
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, outsideTurnRadius);
                        str += 'v' + -((dist.y - totalTurnRadius) / 2);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, midTurnRadius);
                        str += 'h' + midLineLength;
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, midTurnRadius);
                        str += 'v' + -((dist.y - totalTurnRadius) / 2);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, outsideTurnRadius);
                    } else {
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, outsideTurnRadius);
                        str += 'v' + ((dist.y - totalTurnRadius) / 2);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, midTurnRadius);
                        str += 'h' + midLineLength;
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.TOP, midTurnRadius);
                        str += 'v' + ((dist.y - totalTurnRadius) / 2);
                        str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, outsideTurnRadius);
                    }

                    str += 'h' + -jointLineLength;
                }

                break;
            case BPMLine.DIRCTION.RIGHT:
                str = BPMLine.lineToPointOpposite(endPoint, startPoint, BPMLine.DIRCTION.LEFT, maxTurnRadius, minJointLength).lineStr;
                adverse = true;

                break;
        }

        return {
            lineStr: str,
            adverse: adverse
        };
    };

    BPMLine.lineToPointSame = function (startPoint, endPoint, direction, maxTurnRadius, minJointLength) {
        var dist = {
            x: Math.abs(endPoint.x - startPoint.x),
            y: Math.abs(endPoint.y - startPoint.y)
        };

        var str = 'M' + startPoint.x + ',' + startPoint.y;

        switch (direction) {
            case BPMLine.DIRCTION.TOP:
                var turnRadius = (dist.x < 2 * maxTurnRadius) ? (dist.x / 2) : maxTurnRadius;

                if (endPoint.y > startPoint.y) {//结束点在开始点的下方
                    str += 'v' + -minJointLength;
                } else {
                    str += 'v' + -(minJointLength + dist.y)
                }

                str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, (endPoint.x < startPoint.x ? BPMLine.DIRCTION.RIGHT : BPMLine.DIRCTION.LEFT), turnRadius);

                if (endPoint.x < startPoint.x) {
                    str += 'h' + -(dist.x - 2 * turnRadius);
                    str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.TOP, turnRadius);
                } else {
                    str += 'h' + (dist.x - 2 * turnRadius);
                    str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.TOP, turnRadius);
                }

                if (endPoint.y > startPoint.y) {//结束点在开始点的下方
                    str += 'v' + (minJointLength + dist.y);
                } else {
                    str += 'v' + minJointLength;
                }

                break;
            case BPMLine.DIRCTION.BOTTOM:
                var turnRadius = (dist.x < 2 * maxTurnRadius) ? (dist.x / 2) : maxTurnRadius;

                if (endPoint.y < startPoint.y) {//结束点在开始点的下方
                    str += 'v' + minJointLength;
                } else {
                    str += 'v' + (minJointLength + dist.y)
                }

                str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, (endPoint.x < startPoint.x ? BPMLine.DIRCTION.RIGHT : BPMLine.DIRCTION.LEFT), turnRadius);

                if (endPoint.x < startPoint.x) {
                    str += 'h' + -(dist.x - 2 * turnRadius);
                    str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, BPMLine.DIRCTION.BOTTOM, turnRadius);
                } else {
                    str += 'h' + (dist.x - 2 * turnRadius);
                    str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, BPMLine.DIRCTION.BOTTOM, turnRadius);
                }

                if (endPoint.y < startPoint.y) {//结束点在开始点的下方
                    str += 'v' + -(minJointLength + dist.y);
                } else {
                    str += 'v' + -minJointLength;
                }

                break;
            case BPMLine.DIRCTION.LEFT:
                var turnRadius = (dist.y < 2 * maxTurnRadius) ? (dist.y / 2) : maxTurnRadius;

                if (endPoint.x > startPoint.x) {//结束点在开始点的左边
                    str += 'h' + -minJointLength;
                } else {
                    str += 'h' + -(minJointLength + dist.x)
                }

                str += BPMLine.getArcStr(BPMLine.DIRCTION.LEFT, (endPoint.y < startPoint.y ? BPMLine.DIRCTION.BOTTOM : BPMLine.DIRCTION.TOP), turnRadius);

                if (endPoint.y < startPoint.y) {
                    str += 'v' + -(dist.y - 2 * turnRadius);
                    str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.LEFT, turnRadius);
                } else {
                    str += 'v' + (dist.y - 2 * turnRadius);
                    str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.LEFT, turnRadius);
                }

                if (endPoint.x > startPoint.x) {//结束点在开始点的下方
                    str += 'h' + (minJointLength + dist.x);
                } else {
                    str += 'h' + minJointLength;
                }

                break;
            case BPMLine.DIRCTION.RIGHT:
                var turnRadius = (dist.y < 2 * maxTurnRadius) ? (dist.y / 2) : maxTurnRadius;

                if (endPoint.x < startPoint.x) {//结束点在开始点的左边
                    str += 'h' + minJointLength;
                } else {
                    str += 'h' + (minJointLength + dist.x)
                }

                str += BPMLine.getArcStr(BPMLine.DIRCTION.RIGHT, (endPoint.y < startPoint.y ? BPMLine.DIRCTION.BOTTOM : BPMLine.DIRCTION.TOP), turnRadius);

                if (endPoint.y < startPoint.y) {
                    str += 'v' + -(dist.y - 2 * turnRadius);
                    str += BPMLine.getArcStr(BPMLine.DIRCTION.TOP, BPMLine.DIRCTION.RIGHT, turnRadius);
                } else {
                    str += 'v' + (dist.y - 2 * turnRadius);
                    str += BPMLine.getArcStr(BPMLine.DIRCTION.BOTTOM, BPMLine.DIRCTION.RIGHT, turnRadius);
                }

                if (endPoint.x < startPoint.x) {//结束点在开始点的下方
                    str += 'h' + -(minJointLength + dist.x);
                } else {
                    str += 'h' + -minJointLength;
                }

                break;
        }

        return {
            lineStr: str,
            adverse: false
        };
    };

    BPMLine.getArcStr = function (startDirection, endDirection, radius) {
        var str = 'a' + radius + ',' + radius + ',0,0,';

        switch (startDirection) {
            case BPMLine.DIRCTION.TOP:
                switch(endDirection) {
                    case BPMLine.DIRCTION.LEFT:
                        str += '1,' + radius + ',' + -radius;
                        break;
                    case BPMLine.DIRCTION.RIGHT:
                        str += '0,' + -radius + ',' + -radius;
                        break;
                }
                break;
            case BPMLine.DIRCTION.BOTTOM:
                switch(endDirection) {
                    case BPMLine.DIRCTION.LEFT:
                        str += '0,' + radius + ',' + radius;
                        break;
                    case BPMLine.DIRCTION.RIGHT:
                        str += '1,' + -radius + ',' + radius;
                        break;
                }
                break;
            case BPMLine.DIRCTION.LEFT:
                switch(endDirection) {
                    case BPMLine.DIRCTION.TOP:
                        str += '0,' + -radius + ',' + radius;
                        break;
                    case BPMLine.DIRCTION.BOTTOM:
                        str += '1,' + -radius + ',' + -radius;
                        break;
                }
                break;
            case BPMLine.DIRCTION.RIGHT:
                switch(endDirection) {
                    case BPMLine.DIRCTION.TOP:
                        str += '1,' + radius + ',' + radius;
                        break;
                    case BPMLine.DIRCTION.BOTTOM:
                        str += '0,' + radius + ',' + -radius;
                        break;
                }
                break;
        }

        return str;
    };

    BPMLine.prototype.lineTo = function (toPoint, targetDirection) {
        //结束点距离开始的绝对距离
        var dist = {
            x: Math.abs(toPoint.x - this.startPoint.x),
            y: Math.abs(toPoint.y - this.startPoint.y)
        };

        var toDirection = targetDirection === BPMLine.DIRCTION.AUTO ? BPMLine.getP2PDirection(this.startPoint, toPoint) : targetDirection;
        var line = {};
        if (this.config.startDirection === toDirection) {
            line = BPMLine.lineToPointSame(this.startPoint, toPoint, toDirection, this.config.maxTurnRadius, this.config.minJointLength);
        } else {
            if (this.config.startDirection + toDirection === 0) {
                line = BPMLine.lineToPointOpposite(this.startPoint, toPoint, this.config.startDirection, this.config.maxTurnRadius, this.config.minJointLength);
            } else {
                line = BPMLine.lineToPointNeighbour(this.startPoint, toPoint, this.config.startDirection, toDirection, this.config.maxTurnRadius, this.config.minJointLength);
            }
        }

        var arrowDirectionMap = {};
        arrowDirectionMap[BPMLine.DIRCTION.TOP] = 'up';
        arrowDirectionMap[BPMLine.DIRCTION.BOTTOM] = 'down';
        arrowDirectionMap[BPMLine.DIRCTION.LEFT] = 'left';
        arrowDirectionMap[BPMLine.DIRCTION.RIGHT] = 'right';

        if (line.adverse) {
            this.line.attr('marker-start', 'url(#' + this.config.markArrow + '-adverse-' + this.strokeString + ')');
            this.line.attr('marker-end', null);
        } else {
            this.line.attr('marker-start', null);
            this.line.attr('marker-end', 'url(#' + this.config.markArrow + '-' + this.strokeString + ')');
        }

        this.endPoint = toPoint;
        this.config.endDirection = toDirection;
        this.line.attr('d', line.lineStr);

    };

    BPMLine.prototype.redraw = function () {
        this.lineTo(this.endPoint, this.config.endDirection);
    };

    BPMLine.prototype.detachLinkElement = function () {
        var link = this.line.attr('data-link');

        if (link) {
            var linkIds = link.split('@');
            if (this.elementMap.has(linkIds[0])) {//Link Start Element
                this.elementMap.get(linkIds[0]).out.remove(linkIds[1]);
            }

            if (this.elementMap.has(linkIds[1])) {//Link End Element
                this.elementMap.get(linkIds[1]).in.remove(linkIds[0]);
            }
        }
    };

    BPMLine.prototype.destroy = function () {
        if (!this.line) {
            return;
        }
        this.destroyEvent();
        this.detachLinkElement();

        this.elementMap.remove(this.id);

        this.line.remove();
        this.line = null;
        this.elementMap = null;
    };

    return BPMLine;
});