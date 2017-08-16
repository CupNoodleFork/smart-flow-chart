/**
 * @file 操作控制，拖拽，连线等
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/11
 *
 */

angular.module('wbgAdminApp').factory('BPMController', function (BPMUtils, BPM_CONSTANT, BPMLinkDetector, BPMLine, BPMProcess, BPMDecision, BPMOrigin, BPMTerminal, BPMBranchOrigin, BPMBranchTerminal) {
    function BPMController(svg, options) {
        var config = {
            translateX: 0,
            translateY: 0,
            scale: 1
        };

        this.config = BPMUtils.assign({}, config, options);

        this.id = BPMUtils.getUID();
        this.svg = svg;
        this.type = BPM_CONSTANT.ELEMENT_TYPE.SVG;
        this.operateMode = BPM_CONSTANT.OPERATE_MODE.NORMAL;
        this.undoStack = []; //撤销栈

        this.mainGroup = svg.append('g').classed('wbg-bpm-main-group', true)
            .attr('data-scale', this.config.scale)
            .attr('transform', 'translate(' + this.config.translateX + ',' + this.config.translateY + ') scale(' + this.config.scale + ')');
        this.lineContainer = this.mainGroup.append('g').classed('wbg-bpm-line-group', true);
        this.elementContainer = this.mainGroup.append('g').classed('wbg-bpm-element-group', true);
        this.dragArea = svg.append('rect').attr('width', '100%').attr('height', '100%').attr('fill', 'transparent').classed('wbg-bpm-drag-area', true);

        this.elementMap = d3.map();
        this.linkDetector = new BPMLinkDetector(svg, this.lineContainer, this.elementMap, this.config, this.pushUndoStack.bind(this), this.popUndoStack.bind(this));
        this.initFilter(svg);
        this.initEvent();
    }

    /**
     * @desc 通过图形类型获取元素列表
     * @param shape
     * @return {*}
     */
    BPMController.prototype.getElementByShapeType = function (shape) {
        return this.elementMap.values().filter(function (element) {
            return element.shape === shape;
        });
    };

    /**
     * @desc 图的检查
     */
    BPMController.prototype.check = function () {
        var hasOrigin = false;
        var hasTerminal = false;
        var errorTip;
        /*
        * TIP
        * 1. 图中所有形状元素自身的检查。实现元素类的check方法
        * 2. 图是否有开始和结束元素，是否能从开始到结束
        * 3. 图的基本检查，图中是否有闭环。
        * */
        this.elementMap.values().forEach(function (element) {
            element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE && element.setErrorTip();
            element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE && element.shape === BPM_CONSTANT.SHAPE.ORIGIN && (hasOrigin = true);
            element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE && element.shape === BPM_CONSTANT.SHAPE.TERMINAL && (hasTerminal = true);
        });

        var pathsObject = this.getPaths();

        !this.validElements(pathsObject) && (errorTip = BPM_CONSTANT.ERROR.VALID_FALSE);
        !this.validDiagram(pathsObject) && (errorTip = BPM_CONSTANT.ERROR.VALID_FALSE);

        !hasTerminal && (errorTip = BPM_CONSTANT.ERROR.MUST_HAS_TERMINAL);
        !hasOrigin && (errorTip = BPM_CONSTANT.ERROR.MUST_HAS_ORIGIN);

        return errorTip;
    };

    /**
     * @desc 获取没有成环的所有从开始节点 到结束（没有下一个元素，即out里没有内容）的路径
     */
    BPMController.prototype.getPaths = function () {
        var self = this;
        var noCyclePaths = []; // 没有成环的完整的路径
        var cyclePaths = []; // 路径中形成成环的那部分节点

        function _getOriginElement() {
            var origins = self.elementMap.values().filter(function (element) {
                return element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE && element.shape === BPM_CONSTANT.SHAPE.ORIGIN;
            });

            return origins[0];
        }

        function _searchCircle(element, path) {
            if (!element) {
                return;
            }

            var children = element.out.values();
            var travelPath = path || []; //已经走过的路径
            travelPath.push(element.id);

            if (children.length) {
                children.forEach(function (cId) {
                    var findIndex = travelPath.indexOf(cId);
                    if (findIndex < 0) {
                        _searchCircle(self.elementMap.get(cId), travelPath.slice(0));
                    } else {
                        cyclePaths.push(travelPath.slice(findIndex));
                    }
                });
            } else {
                noCyclePaths.push(travelPath.slice(0));
            }
        }

        _searchCircle(_getOriginElement());

        return {
            cyclePaths: cyclePaths,
            noCyclePaths: noCyclePaths
        }
    };

    /**
     * @desc 使用深度优先搜索算法，单纯的根据元素的in和out校验该图是不是有向无环图。如果有环，返回形成环的节点
     *  查找除判断元素以外出现产生环的元素
     * （例如，某个判断元素的一个条件回指，使得这个图出现了环，会被校验出来，但是其实是合乎逻辑的，在最后过滤掉该判断元素）
     * 有且仅当图上有一个开始(origin)元素的时候，从这个开始元素开始遍历
     */
    BPMController.prototype.validGraphCycle = function (cyclePaths) {
        var self = this;
        var loopElementMap = d3.map();

        cyclePaths.forEach(function (circle) {
            if (circle.filter(function (id) {
                    return self.elementMap.get(id).shape === BPM_CONSTANT.SHAPE.DECISION;
                }).length === 0) {
                circle.forEach(function (id) {
                    loopElementMap.set(id, self.elementMap.get(id));
                });
            }
        });

        return loopElementMap.values();
    };

    BPMController.prototype.validDiagram = function (pathsObject) {
        var loopElements = this.validGraphCycle(pathsObject.cyclePaths);
        loopElements.forEach(function (element) {
            element.setErrorTip(BPM_CONSTANT.ERROR.BAD_LOOP);
        });

        return !loopElements.length;
    };

    BPMController.prototype.validElements = function (pathsObject) {
        var self = this;
        var valid = true;
        this.elementMap.values().forEach(function (element) {
            if (element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE) {
                switch (element.shape) {
                    case BPM_CONSTANT.SHAPE.BRANCH_ORIGIN:
                    case BPM_CONSTANT.SHAPE.BRANCH_TERMINAL:
                        element.check(self.elementMap, pathsObject.noCyclePaths);
                        break;
                    default:
                        element.check();
                        break;
                }

                valid = !element.isError;
            }
        });

        return valid;
    };

    /**
     * @desc 获取element的存的其他的扩展信息Map, 节点属性设置信息
     * @return {{}}
     */
    BPMController.prototype.getShapeExtensionInfoMap = function () {
        var extensionInfoMap = {};

        this.elementMap.values().forEach(function (element) {
            if (element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE) {
                //TODO 先写着。再根据服务端需要更换属性名
                extensionInfoMap[element.id] = JSON.parse(JSON.stringify(element.extension || {}));
                extensionInfoMap[element.id].id = element.id;
                extensionInfoMap[element.id].shape = element.shape;
            }
        });

        return extensionInfoMap;
    };

    /**
     * @desc 获取element连接的Map
     */
    BPMController.prototype.getElementLinkMap = function () {
        var linkMap = {};

        this.elementMap.values().forEach(function (element) {
            if (element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE) {
                linkMap[element.id] = {
                    //TODO 先写着。再根据服务端需要更换属性名
                    type: element.shape,
                    next: element.out.values()
                };
            }
        });

        return linkMap;
    };

    /**
     * @desc 获取业务流信息
     * @return {{activities: {}, flow}}
     */
    BPMController.prototype.getFlow = function () {
        return {
            //TODO 先写着。再根据服务端需要更换属性名
            activities: this.getShapeExtensionInfoMap(),
            link: this.getElementLinkMap()
        }
    };

    BPMController.prototype.convertFlow = function (flow) {
        //TODO 先写着。再根据服务端需要更换属性名
        for (var key in flow.activities) {
            if (flow.activities.hasOwnProperty(key)) {
                this.elementMap.get(flow.activities[key].id).extension = flow.activities[key];
            }
        }
    };

    /**
     * @desc 获取图表的绘图信息
     * @return {{}}
     */
    BPMController.prototype.getDiagram = function () {
        //从elementMap分成shapes和lines是因为，lines反显必须放在shapes之后，因为lines的反显需要改写相关联的shapes的in和out
        var diagram = {
            width: 0,
            height: 0,
            shapes: [],
            lines: []
        };

        var rect = this.mainGroup.node().getBoundingClientRect();
        var scale = this.mainGroup.attr('data-scale');
        diagram.width = Math.round(rect.width / scale);
        diagram.height = Math.round(rect.height / scale);

        this.elementMap.each(function (element) {
            if (element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE) {
                diagram.shapes.push(element.getDiagramInfo());
            } else if (element.type === BPM_CONSTANT.ELEMENT_TYPE.LINE) {
                diagram.lines.push(element.getDiagramInfo());
            }
        });

        return diagram;
    };

    /**
     * @desc 转化绘图信息，绘制
     * @param diagram
     */
    BPMController.prototype.convertDiagram = function (diagram) {
        var self = this;

        diagram.shapes.forEach(function (elementDiagramInfo) {
            switch (elementDiagramInfo.shape) {
                case BPM_CONSTANT.SHAPE.PROCESS:
                    BPMProcess.convertDiagramInfo(elementDiagramInfo, self.elementContainer, self.elementMap);
                    break;
                case BPM_CONSTANT.SHAPE.DECISION:
                    BPMDecision.convertDiagramInfo(elementDiagramInfo, self.elementContainer, self.elementMap);
                    break;
                case BPM_CONSTANT.SHAPE.ORIGIN:
                    BPMOrigin.convertDiagramInfo(elementDiagramInfo, self.elementContainer, self.elementMap);
                    break;
                case BPM_CONSTANT.SHAPE.TERMINAL:
                    BPMTerminal.convertDiagramInfo(elementDiagramInfo, self.elementContainer, self.elementMap);
                    break;
                case BPM_CONSTANT.SHAPE.BRANCH_ORIGIN:
                    BPMBranchOrigin.convertDiagramInfo(elementDiagramInfo, self.elementContainer, self.elementMap);
                    break;
                case BPM_CONSTANT.SHAPE.BRANCH_TERMINAL:
                    BPMBranchTerminal.convertDiagramInfo(elementDiagramInfo, self.elementContainer, self.elementMap);
                    break;
                default:
                    //ERROR
                    break;
            }
        });

        diagram.lines.forEach(function (elementDiagramInfo) {
            BPMLine.convertDiagramInfo(elementDiagramInfo, self.lineContainer, self.elementMap);
        });

        this.config.onDiagramConvert && this.config.onDiagramConvert();
    };

    /**
     * @desc 获取图表快照
     * @return {{diagram: {}, flow: {activities: {}, flow}}}
     */
    BPMController.prototype.getSnapShot = function () {
        return {
            //TODO 先写着。再根据服务端需要更换属性名
            diagram: this.getDiagram(),
            flow: this.getFlow()
        }
    };

    BPMController.prototype.convertSnapShot = function (snapShot) {
        //TODO 先写着。再根据服务端需要更换属性名
        this.convertDiagram(snapShot.diagram);
        this.convertFlow(snapShot.flow);
    };

    /**
     * @desc 保存撤销需要的内容
     */
    BPMController.prototype.pushUndoStack = function () {
        this.undoStack.push(this.getSnapShot());
        if (this.undoStack.length > 30) {
            this.undoStack.shift();
        }
    };

    /**
     * @desc 废弃上一次存的撤销需要的内容
     */
    BPMController.prototype.popUndoStack = function () {
        this.undoStack.pop();
    };

    /**
     * @desc 撤销还原上一次操作保存的内容
     * @return {boolean} - 是否撤销成功
     */
    BPMController.prototype.undo = function () {
        if (this.undoStack.length) {
            this.cleanElementMap();
            this.config.onShapeActive && this.config.onShapeActive.call(null, this);
            var snapShot = this.undoStack.pop();
            this.convertSnapShot(snapShot);
            return true;
        } else {
            return false;
        }
    };

    BPMController.prototype.changeOperateMode = function (mode) {
        this.operateMode = mode;

        if (mode === BPM_CONSTANT.OPERATE_MODE.NORMAL) {
            this.dragArea.classed('show', false);
        } else if (mode === BPM_CONSTANT.OPERATE_MODE.DRAG) {
            this.dragArea.classed('show', true);
        } else if (mode === BPM_CONSTANT.OPERATE_MODE.VIEW) {
            this.dragArea.classed('show', true);
        }

        this.config.onOperaModeChange && this.config.onOperaModeChange.call(null, mode);
    };

    /**
     * @desc 设置svg filter 滤镜。
     * @param svg
     */
    BPMController.prototype.initFilter = function (svg) {
        //图形阴影滤镜
        var filter = svg.append('defs').append('filter').attr("id", "drop-shadow").attr("height", "160%").attr('y', '-30%');

        filter.append('feGaussianBlur')
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 4)
            .attr("result", "blur");

        filter.append("feOffset")
            .attr('in', 'blur')
            .attr("dx", 0)
            .attr("dy", 2)
            .attr("result", "offsetBlur");

        filter.append('feFlood').attr('flood-color', 'black').attr('flood-opacity', 0.2).attr('alpha_20');

        filter.append('feComposite').attr('in', 'alpha_20').attr('in2', 'offsetBlur').attr('operator', 'in').attr('result', 'alpha_blur');

        var feMerge = filter.append("feMerge");

        feMerge.append("feMergeNode").attr('in', 'alpha_blur');
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");
    };

    /**
     * @desc 拖拽一个偏移量 {x,y}
     * @param offset
     */
    BPMController.prototype.dragOffset = function (offset) {
        this.config.translateX += offset.x;
        this.config.translateY += offset.y;
        this.mainGroup.attr('transform', 'translate(' + this.config.translateX + ',' + this.config.translateY + ') scale(' + this.config.scale + ')');
    };

    /**
     * @desc 缩放
     */
    BPMController.prototype.zoomTo = function (scale) {
        this.config.scale = scale;
        this.config.scale = Math.round(this.config.scale * 10) / 10;
        if (this.config.scale > 3) {
            this.config.scale = 3;
        } else if (this.config.scale < 0.1) {
            this.config.scale = 0.1;
        }
        this.mainGroup.attr('data-scale', this.config.scale).attr('transform', 'translate(' + this.config.translateX + ',' + this.config.translateY + ') scale(' + this.config.scale + ')');
        this.config.onZoom && this.config.onZoom.call(null, this.config.scale);
    };

    /**
     * @desc 缩小10%
     */
    BPMController.prototype.zoomIn = function () {
        var scale = this.config.scale - 0.1 < 0.1 ? 0.1 : this.config.scale - 0.1;
        this.zoomTo(scale);
    };

    /**
     * @desc 放大10%
     */
    BPMController.prototype.zoomOut = function () {
        var scale = this.config.scale + 0.1 > 3 ? 3 : this.config.scale + 0.1;
        this.zoomTo(scale);
    };

    BPMController.prototype.removeElement = function (id) {
        var self = this;
        if (this.elementMap.has(id)) {
            var element = this.elementMap.get(id);
            var associatedElements = []; //关联的元素
            var canRemove = true;

            if (element.type === BPM_CONSTANT.ELEMENT_TYPE.LINE) {
                associatedElements = element.line.attr('data-link').split('@').map(function (linkId) {
                    return self.elementMap.get(linkId);
                });
            } else if (element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE) {
                var elementsSet = d3.set();//去重
                element.in.each(function (linkId) {
                   elementsSet.add(linkId);
                });
                element.out.each(function (linkId) {
                    elementsSet.add(linkId);
                });

                associatedElements = elementsSet.values().map(function (linkId) {
                    return self.elementMap.get(linkId);
                });
            }

            this.config.onBeforeElementRemove && (canRemove = this.config.onBeforeElementRemove.call(null, element, associatedElements));

            if (canRemove == undefined) {
                canRemove = true;
            }

            canRemove && element.destroy();

            this.config.onElementRemoved && canRemove && this.config.onElementRemoved.call(null, element, associatedElements);
        }
    };

    /**
     * @desc 初始化绑定事件
     */
    BPMController.prototype.initEvent = function () {
        var self = this;
        this.svg.on('drop.' + this.id, function () {
            console.info('in drop event handler');
            console.info('drop data:', d3.event.dataTransfer.getData('value'));
            d3.selectAll('[class=wbg-shadow-img]').remove();

            if(!d3.event.dataTransfer.getData('value')){
                return null;
            }

            var _elementInfo = JSON.parse(d3.event.dataTransfer.getData('value'));

            var position = d3.mouse(self.elementContainer.node());
            var bpmElement = null;
            var canAdded = true;

            self.config.onBeforeElementAdd && (canAdded = self.config.onBeforeElementAdd && self.config.onBeforeElementAdd.call(null, _elementInfo));

            if (canAdded == undefined) {
                canAdded = true;
            }

            if (canAdded) {
                self.pushUndoStack();

                switch (_elementInfo.type) {
                    case BPM_CONSTANT.SHAPE.PROCESS:
                        bpmElement = new BPMProcess(self.elementContainer, {x: position[0], y: position[1]}, self.elementMap, {text: _elementInfo.name});
                        break;
                    case BPM_CONSTANT.SHAPE.DECISION:
                        bpmElement = new BPMDecision(self.elementContainer, {x: position[0], y: position[1]}, self.elementMap, {text: _elementInfo.name});
                        break;
                    case BPM_CONSTANT.SHAPE.ORIGIN:
                        bpmElement = new BPMOrigin(self.elementContainer, {x: position[0], y: position[1]}, self.elementMap, {text: _elementInfo.name});
                        break;
                    case BPM_CONSTANT.SHAPE.TERMINAL:
                        bpmElement = new BPMTerminal(self.elementContainer, {x: position[0], y: position[1]}, self.elementMap, {text: _elementInfo.name});
                        break;
                    case BPM_CONSTANT.SHAPE.BRANCH_ORIGIN:
                        bpmElement = new BPMBranchOrigin(self.elementContainer, {x: position[0], y: position[1]}, self.elementMap, {text: _elementInfo.name});
                        break;
                    case BPM_CONSTANT.SHAPE.BRANCH_TERMINAL:
                        bpmElement = new BPMBranchTerminal(self.elementContainer, {x: position[0], y: position[1]}, self.elementMap, {text: _elementInfo.name});
                        break;
                    default:
                        //ERROR
                        break;
                }

                self.config.onElementAdded && self.config.onElementAdded.call(null, bpmElement);
            }
        });

        this.svg.on('mousedown.' + this.id, function () {
            if ($(d3.event.target).parents('.wbg-bpm-shape').length > 0 && !$(d3.event.target).hasClass('wbg-bpm-line-joint')) {
                var shapeId = $(d3.event.target).parents('.wbg-bpm-shape').attr('id');
                var pid = BPMUtils.getUID(); //拖动事件的进程ID，用于结束的时候销毁
                if (self.elementMap.has(shapeId)) {
                    var element = self.elementMap.get(shapeId);
                    var point = d3.mouse(self.elementContainer.node());
                    var offset = {
                        x: point[0] - element.position.x,
                        y: point[1] - element.position.y
                    };
                    self.pushUndoStack();

                    self.svg.on('mousemove.' + pid, function () {
                        var movePoint = d3.mouse(self.elementContainer.node());
                        element.moveToPoint({x: movePoint[0] - offset.x, y: movePoint[1] - offset.y});
                    }).on('mouseup.' + pid, function () {
                        self.svg.on('.' + pid, null);

                        var movePoint = d3.mouse(self.elementContainer.node());
                        //如果拖动幅度小，当做点击该元素，激活该元素；如果拖动幅度大，当做拖拽元素，不触发点击元素，即不激活元素。
                        if (Math.max(Math.abs(movePoint[0] - point[0]), Math.abs(movePoint[1] - point[1])) < 5) {
                            d3.select('.wbg-bpm-node-active').classed('wbg-bpm-node-active', false);
                            element.shapeGroup.classed('wbg-bpm-node-active', true);
                            self.config.onShapeActive && self.config.onShapeActive.call(null, element);
                            self.popUndoStack();
                        }
                    });
                }
            } else if ($(d3.event.target).is('.wbg-bpm-svg')) {
                d3.select('.wbg-bpm-node-active').classed('wbg-bpm-node-active', false);
                self.config.onShapeActive && self.config.onShapeActive.call(null, self);
            }
        });

        d3.select('body').on('keydown.' + this.id, function () {
            var keyCode = d3.event.keyCode || d3.event.which;
            var tagName = d3.event.target.tagName;
            if (tagName.toLowerCase() === 'svg' || tagName.toLowerCase() === 'body' || tagName.toLowerCase() === 'g' || tagName.toLowerCase() === 'path') {
                if (typeof keyCode !== 'undefined') {
                    var activeNode = $('.wbg-bpm-node-active');

                    if (activeNode.length
                        && activeNode.attr('id')
                        && self.elementMap.has(activeNode.attr('id'))) {

                        var element = self.elementMap.get(activeNode.attr('id'));

                        //element 可能是线，可能是图形

                        if (element.type === BPM_CONSTANT.ELEMENT_TYPE.SHAPE) { //是图形的时候，可以方向键微调
                            //方向键微调
                            d3.event.stopPropagation();
                            d3.event.preventDefault();
                            if (keyCode == 38) { //arrow up
                                element.moveToOffset({x: 0, y: -1});
                            } else if (keyCode == 40) { //arrow down
                                element.moveToOffset({x: 0, y: 1});
                            } else if (keyCode == 37) { //arrow left
                                element.moveToOffset({x: -1, y: 0});
                            } else if (keyCode == 39) { // arrow down
                                element.moveToOffset({x: 1, y: 0});
                            }
                        }

                        if (keyCode == 8 || keyCode == 46) {//8：backspace 46：delete
                            self.pushUndoStack();
                            self.removeElement(activeNode.attr('id'));
                        }
                    }

                    /** TIP
                     * 撤销- 只记录最近的X步操作（非正式功能。如不需要可去除）
                     * 记录关键步骤的必要信息的快照。只能做关于绘图的操作的撤销，不做元素设置的撤销。
                     * 关键步骤：
                     * 1. 拖拽（mouseup的时候记录一下当前的必要信息的快照）
                     * 2. 添加元素
                     * 3. 连线
                     * 4. 删除线/元素
                     * 关键信息：
                     * 1. 绘图信息。diagram()
                     * 2. 元素设置的信息. 不能删除了一个元素以后，撤销了以后，元素的绘图信息回来了，但是元素设置的信息为初始的
                     * */
                    if (keyCode == 90 && d3.event.ctrlKey) {
                        self.undo()
                    }
                }
            }
        });

        this.dragArea.on('mousedown.' + this.id, function () {
            d3.event.stopPropagation();
            var pid = BPMUtils.getUID(); //拖动事件的进程ID，用于结束的时候销毁
            var startPoint = {
                x: d3.event.x,
                y: d3.event.y
            };
            var lastPoint = {
                x: d3.event.x,
                y: d3.event.y
            };
            self.dragArea.classed('grabbing', true);
            self.dragArea.on('mousemove.' + pid, function () {
                var offset = {
                    x: d3.event.x - lastPoint.x,
                    y: d3.event.y - lastPoint.y
                };

                lastPoint = {
                    x: d3.event.x,
                    y: d3.event.y
                };

                self.dragOffset(offset);
            }).on('mouseup.' + pid, function () {
                var move = {
                    x: d3.event.x - startPoint.x,
                    y: d3.event.y - startPoint.y
                };

                if (Math.max(Math.abs(move.x), Math.abs(move.y)) < 1) {//没有拖拽，当做点击空白处处理，直接返回普通模式
                    if (self.operateMode === BPM_CONSTANT.OPERATE_MODE.DRAG) {
                        self.changeOperateMode(BPM_CONSTANT.OPERATE_MODE.NORMAL);
                    }
                }
                self.dragArea.classed('grabbing', false);
                self.dragArea.on('.' + pid, null);
            });
        });
    };

    /**
     * 注销绑定的事件。千万弄干净点。
     */
    BPMController.prototype.destroyEvent = function () {
        this.svg.on('.' + this.id, null);
        this.dragArea.on('.' + this.id, null);
        d3.select('body').on('.' + this.id, null);
    };

    BPMController.prototype.cleanElementMap = function () {
        this.elementMap.values().forEach(function (element) {
            element.destroy();
        });

        this.elementMap.clear();
    };

    /**
     * @desc 销毁
     */
    BPMController.prototype.destroy = function () {
        this.linkDetector.destroy();
        this.destroyEvent();
        this.cleanElementMap();

        this.mainGroup.remove();

        this.lineContainer = null;
        this.elementContainer = null;
        this.dragArea = null;
        this.mainGroup = null;
        this.svg = null;
        this.elementMap = null;
    };

    return BPMController;
});