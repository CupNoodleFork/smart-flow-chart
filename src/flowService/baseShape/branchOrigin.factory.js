/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/12
 * $END$
 */

angular.module('wbgAdminApp').factory('BPMBranchOrigin', function (BPM_CONSTANT, BPMUtils, BPMShape) {
    function BPMBranchOrigin(container, point, elementMap, options) {
        var config = {
            filter: '#drop-shadow',
            width: 60,
            height: 60,
            radius: 2,
            text: '节点名称'
        };

        this.config = BPMUtils.assign({}, config, options);
        BPMShape.call(this, container, elementMap, this.config);

        this.shape = BPM_CONSTANT.SHAPE.BRANCH_ORIGIN;
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

        //中间的十字
        this.shapeGroup.append('rect')
            .attr('width', 2).attr('height', 20)
            .attr('stroke', 'transparent')
            .attr('fill', '#ffffff').attr('transform', 'translate(' + (this.config.width / 2 - 1) + ', ' + (this.config.height / 2 - 10) + ')');

        this.shapeGroup.append('rect')
            .attr('width', 20).attr('height', 2)
            .attr('stroke', 'transparent')
            .attr('fill', '#ffffff').attr('transform', 'translate(' + (this.config.width / 2 - 10) + ', ' + (this.config.height / 2 - 1) + ')');
    }

    BPMBranchOrigin.prototype = Object.create(BPMShape.prototype);

    /**
     * @desc 绘图逻辑检查
     */
    BPMBranchOrigin.prototype.check = function (elementMap, noCyclePaths) {
        var self = this;

        //至少1个连入
        if (!this.in.size()) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_AT_LEAST_1_IN);
            return;
        }
        //至少2个连出
        if (this.out.size() < 2) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_AT_LEAST_2_OUT);
            return;
        }

        //找到从我开始之后路径上的并行结束节点
        var branchTerminalNodeIntersection = this.findBranchTerminalNode(elementMap, noCyclePaths);

        branchTerminalNodeIntersection.forEach(function (branchTerminalId, index) {
            //反查并行结束的相关联的并行开始节点, 看我是不是在他的路径上所有的并行开始节点的交集中
            var branchOriginNode = elementMap.get(branchTerminalId).findBranchOriginNode(elementMap, noCyclePaths, self.id);

            (branchOriginNode.length === 1 && branchOriginNode[0] === self.id) || (branchTerminalNodeIntersection[index] = '');
        });

        if (!branchTerminalNodeIntersection.filter(function (id) {
                return id !== '';
            }).length) {
            this.setErrorTip(BPM_CONSTANT.ERROR.BRANCH_ORIGIN_MUST_HAS_TERMINAL);
        }
    };

    /**
     *
     * @desc 从所有无环路径中向后查找每条路径上的并行结束节点，直到每条路径上的endId（包含该节点）为止。最后将每条路径上找到的所有并行结束节点取并集
     * @param elementMap
     * @param noCyclePaths 流程图中包含自身节点的所有无环路径
     * @param endId - option
     * @return {*}
     */
    BPMBranchOrigin.prototype.findBranchTerminalNode = function (elementMap, noCyclePaths, endId) {
        var self = this;

        //以下匹配的结束节点校验
        //获取多条路径中包含我的路径，并且只截取一条路径中我之后的路径
        var pathsHasMeAndAfterMe = noCyclePaths.filter(function (path) {
            return path.indexOf(self.id) >= 0;
        });

        pathsHasMeAndAfterMe = pathsHasMeAndAfterMe.map(function (path) {
            return path.slice(path.indexOf(self.id));
        });

        if (endId) {
            pathsHasMeAndAfterMe = pathsHasMeAndAfterMe.map(function (path) {
                return path.slice(0, path.indexOf(endId) < 0 ? undefined : (path.indexOf(endId) + 1));
            });
        }

        //从上面路径中提取出每条路径中的并行结束节点
        var pathsOnlyHasBranchTerminal = pathsHasMeAndAfterMe.map(function (path) {
            return path.filter(function (id) {
                return elementMap.get(id).shape === BPM_CONSTANT.SHAPE.BRANCH_TERMINAL;
            });
        });

        //取所有路径上并行结束节点的交集
        return BPMUtils.intersection.apply(null, pathsOnlyHasBranchTerminal);
    };

    BPMBranchOrigin.convertDiagramInfo = function (diagramInfo, container, elementMap) {
        var bpmBranchOrigin = new BPMBranchOrigin(container, diagramInfo.position, elementMap, {
            id: diagramInfo.id,
            width: diagramInfo.width,
            height: diagramInfo.height,
            text: diagramInfo.text
        });

        diagramInfo.in.forEach(function (value) {
            bpmBranchOrigin.in.add(value);
        });
        diagramInfo.out.forEach(function (value) {
            bpmBranchOrigin.out.add(value);
        });

        return bpmBranchOrigin;
    };

    BPMBranchOrigin.prototype.getDiagramInfo = function () {
        return this.getBaseDiagramInfo();
    };

    BPMBranchOrigin.prototype.destroy = function () {
        this.remove();
    };

    return BPMBranchOrigin;
});