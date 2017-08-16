/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/11
 * $END$
 */

angular.module('wbgAdminApp').factory('BPMLinkDetector', function (BPMUtils, BPMLine) {
    function LinkLineDetector(listenContainer, lineContainer, elementMap, options, pushUndoStack, popUndoStack) {
        this.id = BPMUtils.getUID();
        var config = {
            detectClassName: 'wbg-bpm-line-joint'
        };
        this.config = BPMUtils.assign({}, config, options);
        this.listenContainer = listenContainer;
        this.lineContainer = lineContainer;
        this.initEvent(elementMap, pushUndoStack, popUndoStack);
    }

    LinkLineDetector.prototype.getJointCenterPoint = function (jointNode) {
        function _point(node, event) {
            var svg = node.ownerSVGElement || node;

            if (svg.createSVGPoint) {
                var point = svg.createSVGPoint();
                point.x = event.clientX;
                point.y = event.clientY;
                point = point.matrixTransform(node.getScreenCTM().inverse());
                return [point.x, point.y];
            }

            var rect = node.getBoundingClientRect();
            return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
        }

        var rect = jointNode.getBoundingClientRect();
        var rectPositionInLineContainer = _point(this.lineContainer.node(), {clientX: rect.left, clientY: rect.top});

        var mainGroupScale = d3.select('.wbg-bpm-main-group').attr('data-scale');

        return [(rectPositionInLineContainer[0] + (rect.width / mainGroupScale / 2)), (rectPositionInLineContainer[1] + (rect.height / mainGroupScale / 2))]
    };

    /**
     * @desc 通过线的开始和结束连接的元素id 获取线的对象
     * @param fromId
     * @param toId
     * @return {boolean|*}
     */
    LinkLineDetector.prototype.getLineByStartAndEndId = function (elementMap, fromId, toId) {
        var line = d3.select('path.wbg-bpm-line[data-link="' + fromId + '@' + toId + '"]');
        var lineId = !line.empty() && line.attr('id');

        return lineId && elementMap.get(lineId);
    };

    LinkLineDetector.prototype.initEvent = function (elementMap, pushUndoStack, popUndoStack) {
        var self = this;

        this.listenContainer.on('mousedown.' + this.id, function () {
            if (d3.select(d3.event.target).classed(self.config.detectClassName)) {
                var drawingProcessId = BPMUtils.getUID();
                var startId = d3.select(d3.event.target).attr('data-parent-id');
                var startPoint = self.getJointCenterPoint(d3.event.target);
                pushUndoStack();
                var line = new BPMLine({x: startPoint[0], y: startPoint[1]}, self.lineContainer, elementMap, {startDirection: Number(d3.select(d3.event.target).attr('data-joint-direction'))});
                $('.wbg-bpm-shape').addClass('line-able');
                self.listenContainer.on('mousemove.' + drawingProcessId, function () {
                    var movePoint = d3.mouse(self.lineContainer.node());

                    line.lineTo({x: movePoint[0], y: movePoint[1]}, BPMLine.DIRCTION.AUTO);
                }).on('mouseup.' + drawingProcessId, function () {
                    var endTarget = d3.select(d3.event.target);
                    var endId = endTarget.attr('data-parent-id');
                    if (endTarget.classed(self.config.detectClassName) && endId != startId && !self.getLineByStartAndEndId(elementMap, startId, endId)) {
                        var endPoint = self.getJointCenterPoint(d3.event.target);
                        line.lineTo({x: endPoint[0], y: endPoint[1]}, Number(d3.select(d3.event.target).attr('data-joint-direction')));
                        line.line.attr('data-link', startId + '@' + endId);
                        elementMap.set(line.id, line);
                        elementMap.has(startId) && elementMap.get(startId).out.add(endId);
                        elementMap.has(endId) && elementMap.get(endId).in.add(startId);
                        if (self.config.onDrawLine) {
                            self.config.onDrawLine.call(self, elementMap.get(startId), elementMap.get(endId));
                        }
                    } else {
                        line.destroy();
                        line = null;
                        popUndoStack();
                    }
                    $('.wbg-bpm-shape').removeClass('line-able');

                    self.listenContainer.on('.' + drawingProcessId, null);
                });
            }
        });
    };

    LinkLineDetector.prototype.destroyEvent = function () {
        this.listenContainer.on('.' + this.id, null);
    };

    LinkLineDetector.prototype.destroy = function () {
        this.destroyEvent();
        this.listenContainer = null;
        this.lineContainer = null;
    };

    return LinkLineDetector;
});