/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/12
 * $END$
 */

angular.module('wbgAdminApp').factory('BPMTerminal', function (BPMUtils, BPM_CONSTANT, BPMShape, BPMLine) {
    function BPMTerminal(container, point, elementMap, options) {
        var config = {
            filter: '#drop-shadow',
            width: 70,
            height: 70,
            radius: 2,
            text: '节点名称'
        };

        this.config = BPMUtils.assign({}, config, options);
        BPMShape.call(this, container, elementMap, this.config);

        this.shape = BPM_CONSTANT.SHAPE.TERMINAL;
        this.position = point;//图形左上角的点
        this.shapeGroup.attr('transform', 'translate(' + point.x + ', ' + point.y + ')');

        //外面的大圈
        this.element = this.shapeGroup.append('rect')
            .attr('width', this.config.width)
            .attr('height', this.config.height)
            .attr('rx', this.config.width)
            .attr('ry', this.config.height)
            .style('stroke', '#757580')
            .style('stroke-width', 4)
            .style('fill', '#ededed');

        //内部装饰性的细线圆
        this.shapeGroup.append('rect')
            .attr('width', this.config.width - 12)
            .attr('height', this.config.height - 12)
            .attr('rx', this.config.width - 12)
            .attr('ry', this.config.height - 12).attr('transform', 'translate(6, 6)')
            .style('stroke', '#757580')
            .style('stroke-width', 1)
            .style('fill', 'transparent');

        this.shapeGroup.node().insertBefore(this.element.node(), this.jointGroup.node());//把joint放在rect下面; 在UI上覆盖rect;

        this.setText(this.config.text);
    }

    BPMTerminal.prototype = Object.create(BPMShape.prototype);

    BPMTerminal.prototype.check = function () {
        //至少一条连入的线
        if (!this.in.size()) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_AT_LEAST_1_IN);
            return;
        }
        if (this.out.size()) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_NO_OUT);
            return;
        }
    };

    BPMTerminal.convertDiagramInfo = function (diagramInfo, container, elementMap) {
        var bpmTerminal = new BPMTerminal(container, diagramInfo.position, elementMap, {
            id: diagramInfo.id,
            width: diagramInfo.width,
            height: diagramInfo.height,
            text: diagramInfo.text
        });

        diagramInfo.in.forEach(function (value) {
            bpmTerminal.in.add(value);
        });
        diagramInfo.out.forEach(function (value) {
            bpmTerminal.out.add(value);
        });

        return bpmTerminal;
    };

    BPMTerminal.prototype.getDiagramInfo = function () {
        return this.getBaseDiagramInfo();
    };

    BPMTerminal.prototype.setText = function (text) {
        text = text + '';
        if (this.shapeGroup.select('text.wbg-bpm-shape-name-text').empty()) {
            this.shapeGroup.append('text').classed('wbg-bpm-shape-name-text', true).attr('text-anchor', 'middle').attr('x', this.config.width / 2).attr('y', this.config.height / 2 + 5).text(text);
        } else {
            this.shapeGroup.select('text.wbg-bpm-shape-name-text').text(text);
        }

        this.config.text = text;
    };

    BPMTerminal.prototype.destroy = function () {
        this.remove();
    };

    return BPMTerminal;
});