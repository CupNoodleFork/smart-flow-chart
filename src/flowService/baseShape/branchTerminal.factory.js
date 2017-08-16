/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/12
 * $END$
 */

angular.module('wbgAdminApp').factory('BPMBranchTerminal', function (BPM_CONSTANT, BPMUtils, BPMShape) {
    function BPMBranchTerminal(container, point, elementMap, options) {
        var config = {
            filter: '#drop-shadow',
            width: 60,
            height: 60,
            radius: 2,
            text: '节点名称'
        };

        this.config = BPMUtils.assign({}, config, options);
        BPMShape.call(this, container, elementMap, this.config);

        this.shape = BPM_CONSTANT.SHAPE.BRANCH_TERMINAL;
        this.position = point;//图形左上角的点
        this.shapeGroup.attr('transform', 'translate(' + point.x + ', ' + point.y + ')');

        var sideLength = Math.sqrt(Math.pow(this.config.width / 2, 2) + Math.pow(this.config.height / 2, 2));
        this.element = this.shapeGroup.append('rect')
            .attr('width', sideLength)
            .attr('height', sideLength)
            .attr('rx', this.config.radius + 2)
            .attr('ry', this.config.radius + 2)
            .style('stroke', 'transparent')
            .style('fill', '#757580').attr('transform', 'translate(' + ((this.config.width - sideLength) / 2) + ', ' + ((this.config.height - sideLength) / 2) + ') rotate(45,' + sideLength / 2 + ',' + sideLength / 2 + ')');

        this.shapeGroup.node().insertBefore(this.element.node(), this.jointGroup.node());//把joint放在rect下面; 在UI上覆盖rect;

        //中间的圈
        this.shapeGroup.append('rect')
            .attr('width', 20).attr('height', 20)
            .attr('rx', 20).attr('ry', 20)
            .attr('stroke', '#ffffff').style('stroke-width', 2)
            .attr('fill', 'transparent').attr('transform', 'translate(' + (this.config.width / 2 - 10) + ', ' + (this.config.height / 2 - 10) + ')');
    }

    BPMBranchTerminal.prototype = Object.create(BPMShape.prototype);

    /**
     * @desc 绘图逻辑检查
     */
    BPMBranchTerminal.prototype.check = function (elementMap, noCyclePaths) {
        var self = this;

        //至少有2个连入
        if (this.in.size() < 2) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_AT_LEAST_2_IN);
            return;
        }
        //只能有一个连出
        if (this.out.size() !== 1) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_ONLY_1_OUT);
            return;
        }

        var branchOriginNodeIntersection = this.findBranchOriginNode(elementMap, noCyclePaths);

        //找到从我开始之后路径上的并行结束节点
        branchOriginNodeIntersection.forEach(function (branchOriginId, index) {
            //反查并行结束的相关联的并行开始节点, 看我是不是在他的路径上所有的并行开始节点的交集中
            var branchTerminalNode = elementMap.get(branchOriginId).findBranchTerminalNode(elementMap, noCyclePaths, self.id);

            (branchTerminalNode.length === 1 && branchTerminalNode[0] === self.id) || (branchOriginNodeIntersection[index] = '');
        });

        if (!branchOriginNodeIntersection.filter(function (id) {
                return id !== '';
            }).length) {
            this.setErrorTip(BPM_CONSTANT.ERROR.BRANCH_TERMINAL_MUST_HAS_ORIGIN);
        }
    };

    /**
     *
     * @desc 从所有无环路径中向前查找每条路径上的并行开始节点，直到每条路径上的fromId（包含该节点）为止。最后将每条路径上找到的所有并行开始节点取并集
     * @param elementMap
     * @param noCyclePaths 流程图中包含自身节点的所有无环路径
     * @param fromId - option
     * @return {*}
     */
    BPMBranchTerminal.prototype.findBranchOriginNode = function (elementMap, noCyclePaths, fromId) {
        var self = this;

        //以下匹配的结束节点校验
        //获取多条路径中包含我的路径，并且只截取一条路径中我之前（包含我）的路径
        var pathsHasMeAndBeforeMe = noCyclePaths.filter(function (path) {
            return path.indexOf(self.id) >= 0;
        });

        if (fromId) {
            pathsHasMeAndBeforeMe = pathsHasMeAndBeforeMe.map(function (path) {
                return path.slice(path.indexOf(fromId) < 0 ? 0 : path.indexOf(fromId));
            });
        }

        pathsHasMeAndBeforeMe = pathsHasMeAndBeforeMe.map(function (path) {
            return path.slice(0, path.indexOf(self.id) + 1);
        });

        //从上面路径中提取出每条路径中的并行开始节点
        var pathsOnlyHasBranchOrigin = pathsHasMeAndBeforeMe.map(function (path) {
            return path.filter(function (id) {
                return elementMap.get(id).shape === BPM_CONSTANT.SHAPE.BRANCH_ORIGIN;
            });
        });

        //取所有路径上并行结束节点的交集
        return BPMUtils.intersection.apply(null, pathsOnlyHasBranchOrigin);
    };

    BPMBranchTerminal.convertDiagramInfo = function (diagramInfo, container, elementMap) {
        var bpmBranchTerminal = new BPMBranchTerminal(container, diagramInfo.position, elementMap, {
            id: diagramInfo.id,
            width: diagramInfo.width,
            height: diagramInfo.height,
            text: diagramInfo.text
        });

        diagramInfo.in.forEach(function (value) {
            bpmBranchTerminal.in.add(value);
        });
        diagramInfo.out.forEach(function (value) {
            bpmBranchTerminal.out.add(value);
        });

        return bpmBranchTerminal;
    };

    BPMBranchTerminal.prototype.getDiagramInfo = function () {
        return this.getBaseDiagramInfo();
    };

    BPMBranchTerminal.prototype.destroy = function () {
        this.remove();
    };

    return BPMBranchTerminal;
});