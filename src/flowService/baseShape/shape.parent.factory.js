/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/11
 * $END$
 */

angular.module('wbgAdminApp')
    .factory('BPMShape', function (BPMUtils, BPM_CONSTANT, BPMLine) {
        function BPMShape(container, elementMap, options) {
            var self = this;

            this.id = options.id || BPMUtils.getUID();
            this.type = BPM_CONSTANT.ELEMENT_TYPE.SHAPE;
            this.config = BPMUtils.assign({}, options);
            this.in = d3.set();
            this.out = d3.set();
            this.joints = [];
            this.isError = false;
            this.extension = {}; //附加信息
            this.elementMap = elementMap;
            //最外层的group
            this.shapeGroup = container.append('g').classed('wbg-bpm-shape', true).attr('id', this.id).attr('tabindex', 0);

            //内部的连接点用的group
            this.jointGroup = this.shapeGroup.append('g').classed('wbg-bpm-shape-joints', true);

            this.jointsPosition = [
                {x: -6, y: (this.config.height / 2 - 6), direction: BPMLine.DIRCTION.LEFT},
                {x: (this.config.width - 6), y: (this.config.height / 2 - 6), direction: BPMLine.DIRCTION.RIGHT},
                {x: (this.config.width / 2 - 6), y: -6, direction: BPMLine.DIRCTION.TOP},
                {x: (this.config.width / 2 - 6), y: (this.config.height - 6), direction: BPMLine.DIRCTION.BOTTOM}
            ];

            this.jointGroup.append('rect')
                .attr('fill', 'transparent')
                .attr('width', this.config.width)
                .attr('height', this.config.height)
                .attr('rx', 2)
                .attr('ry', 2)
                .classed('wbg-bpm-shape-joint-fake', true)
                .attr('stroke', 'transparent');

            this.jointsPosition.forEach(function (p) {
                self.putJoint(p, p.direction);
            });

            //错误提示信息元素
            this.errorTipGroup = this.shapeGroup.append('g').classed('wbg-bpm-error-tip-group', true).attr('transform', 'translate(0, ' + (this.config.height + 10) + ')');
            //错误提示小红叹号
            this.errorTipGroup.append('rect')
                .attr('width', 16).attr('height', 16).attr('rx', 16).attr('ry', 16)
                .attr('x', 0).attr('y', 0).attr('fill', '#f25d49');
            this.errorTipGroup.append('rect')
                .attr('width', 2).attr('height', 6)
                .attr('x', 7).attr('y', 4)
                .attr('fill', '#ffffff');
            this.errorTipGroup.append('rect')
                .attr('width', 2).attr('height', 2)
                .attr('x', 7).attr('y', 11)
                .attr('fill', '#ffffff');
            //错误提示信息文字
            this.errorTipGroup.append('text').classed('wbg-bpm-error-tip', true).attr('x', 21).attr('y', 12)
                .attr('fill', '#f25d49').style('font-size', '12px');

            if (elementMap) {
                elementMap.set(this.id, this);
            }
        }

        /**
         * @desc 实现元素自身基础校验，提示错误信息
         */
        BPMShape.prototype.check = function () {
            //NOTICE 不要在这写东西，在继承的子类里面各自去实现校验该元素的方法。！！！
        };

        BPMShape.prototype.getBaseDiagramInfo = function () {
            var diagramInfo = {
                id: this.id,
                width: this.config.width,
                height: this.config.height,
                text: this.config.text,
                position: {
                    x: this.position.x,
                    y: this.position.y
                },
                in: this.in.values(),
                out: this.out.values(),
                type: this.type,
                shape: this.shape
            };

            return diagramInfo;
        };

        /**
         * @desc 基于getBaseDiagramInfo，在各自元素实现自身的getDiagramInfo。在BPMController中被调用
         */
        BPMShape.prototype.getDiagramInfo = function () {
            //NOTICE 不要在这写东西，在继承的子类里面各自去实现校验该元素的方法。！！！
        };

        /**
         * @desc 设置元素错误提示文案，errorTip为空时候清除错误提示
         * @param errorTip
         */
        BPMShape.prototype.setErrorTip = function (errorTip) {
            errorTip = $.trim(errorTip);
            if (!errorTip.length) {
                this.errorTipGroup.classed('show', false);
                this.isError = false;
            } else {
                this.errorTipGroup.classed('show', true);
                this.errorTipGroup.select('.wbg-bpm-error-tip').text(errorTip);
                this.isError = true;
            }
        };

        /**
         * @desc 放置连线连接点
         * @param point 坐标
         * @param direction in BPMLine.DIRECTION
         */
        BPMShape.prototype.putJoint = function (point, direction) {
            var joint = this.jointGroup.append('rect');

            joint.attr('width', 12).attr('height', 12).attr('fill', 'white').attr('stroke', '#289bf0').attr('rx', 12).attr('ry', 12).attr('x', point.x).attr('y', point.y);
            joint.classed('wbg-bpm-line-joint', true).attr('data-parent-id', this.id).attr('data-joint-direction', direction);

            //hover 出现的点。因为不能简单的用transform的scale。
            var jointHover = this.jointGroup.append('rect');
            jointHover.attr('width', 16).attr('height', 16).attr('fill', 'transparent').attr('rx', 16).attr('ry', 16).attr('x', point.x - 2).attr('y', point.y - 2);
            jointHover.classed('wbg-bpm-line-joint', true).attr('data-parent-id', this.id).attr('data-joint-direction', direction);

            //trick chrome 当鼠标左键按住的时候，经过元素的时候元素的hover样式不会触发
            jointHover.on('mouseenter', function () {
                d3.select(this).classed('wbg-bpm-line-joint-hover', true);
            }).on('mouseleave', function () {
                d3.select(this).classed('wbg-bpm-line-joint-hover', false);
            });

            this.joints.push({x: point.x, y: point.y, direction: direction});
        };

        /**
         * 移动到某个点
         * @param point
         */
        BPMShape.prototype.moveToPoint = function (point) {
            this.shapeGroup.attr('transform', 'translate(' + point.x + ', ' + point.y + ')');
            var offset = {
                x: point.x - this.position.x,
                y: point.y - this.position.y
            };

            this.redrawLineWithPointOffset(offset);

            this.position = point;
        };

        /**
         * @desc 移动一个偏移量
         * @param offset
         */
        BPMShape.prototype.moveToOffset = function (offset) {
            var point = {
                x: this.position.x + offset.x,
                y: this.position.y + offset.y
            };

            this.shapeGroup.attr('transform', 'translate(' + point.x + ', ' + point.y + ')');

            this.redrawLineWithPointOffset(offset);

            this.position = point;
        };

        /**
         * @desc 获取自身连接的线的对象map
         * @return {{}}
         */
        BPMShape.prototype.getLinkLineInElementMap = function () {
            var map = {};
            var self = this;

            var lines = d3.selectAll('path[data-link*="' + this.id + '"]');
            lines.each(function () {
                var lId = d3.select(this).attr('id');
                if (self.elementMap.has(lId)) {
                    map[lId] = self.elementMap.get(lId);
                }
            });

            return map;
        };

        /**
         * @desc 通过偏移量重绘连接的线
         * @param offset {x, y}
         */
        BPMShape.prototype.redrawLineWithPointOffset = function (offset) {
            var lineMap = this.getLinkLineInElementMap();

            for(var key in lineMap) {
                if (lineMap.hasOwnProperty(key)) {
                    var link = lineMap[key].line.attr('data-link');
                    if (link) {
                        var linkIds = link.split('@');
                        var line = lineMap[key];
                        if (linkIds[0] == this.id) {//start
                            line.startPoint.x += offset.x;
                            line.startPoint.y += offset.y;
                        } else if (linkIds[1] == this.id) {//end
                            line.endPoint.x += offset.x;
                            line.endPoint.y += offset.y;
                        }
                        line.redraw && line.redraw();
                    }
                }
            }
        };

        /**
         * @desc 移除相互连接的点
         */
        BPMShape.prototype.removeLinkLine = function () {
            var lineMap = this.getLinkLineInElementMap();
            var self = this;

            for(var key in lineMap) {
                if (lineMap.hasOwnProperty(key)) {
                    var link = lineMap[key].line.attr('data-link');
                    if (link) {
                        var linkIds = link.split('@');
                        var line = lineMap[key];
                        line.destroy();
                    }
                }
            }
        };

        /**
         * @desc 移除该形状元素
         */
        BPMShape.prototype.remove = function () {
            if (!this.element) {
                return;
            }

            this.removeLinkLine();

            this.elementMap.remove(this.id);
            this.shapeGroup.remove();
            this.shapeGroup = null;
            this.elementMap = null;
            this.jointGroup = null;
            this.element && (this.element = null);
        };

        BPMShape.prototype.destroy = function () {
            //NOTICE 不要在这写东西，在继承的子类里面各自去实现校验该元素的方法。！！！
        };

        return BPMShape;
    });