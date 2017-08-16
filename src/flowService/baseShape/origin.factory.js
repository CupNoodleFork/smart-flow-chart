/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/11
 * $END$
 */

angular.module('wbgAdminApp').factory('BPMOrigin', function (BPMUtils, BPM_CONSTANT, BPMShape, BPMLine) {
    function BPMOrigin(container, point, elementMap, options) {
        var config = {
            filter: '#drop-shadow',
            width: 70,
            height: 70,
            radius: 2,
            text: '节点名称'
        };

        this.config = BPMUtils.assign({}, config, options);
        BPMShape.call(this, container, elementMap, this.config);

        this.shape = BPM_CONSTANT.SHAPE.ORIGIN;
        this.position = point;//图形左上角的点
        this.shapeGroup.attr('transform', 'translate(' + point.x + ', ' + point.y + ')');

        this.element = this.shapeGroup.append('rect')
            .attr('width', this.config.width)
            .attr('height', this.config.height)
            .attr('rx', this.config.width)
            .attr('ry', this.config.width)
            .style('stroke', '#757580')
            .style('stroke-width', 4)
            .style('fill', '#ededed');

        this.shapeGroup.node().insertBefore(this.element.node(), this.jointGroup.node());//把joint放在rect下面; 在UI上覆盖rect;

        this.setText(this.config.text);
    }

    BPMOrigin.prototype = Object.create(BPMShape.prototype);

    BPMOrigin.prototype.check = function () {
        if (this.out.size() !== 1) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_ONLY_1_OUT);
            return;
        }
        if (this.in.size()) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_NO_IN);
            return;
        }
    };

    BPMOrigin.convertDiagramInfo = function (diagramInfo, container, elementMap) {
        var bpmOrigin = new BPMOrigin(container, diagramInfo.position, elementMap, {
            id: diagramInfo.id,
            width: diagramInfo.width,
            height: diagramInfo.height,
            text: diagramInfo.text
        });

        diagramInfo.in.forEach(function (value) {
            bpmOrigin.in.add(value);
        });
        diagramInfo.out.forEach(function (value) {
            bpmOrigin.out.add(value);
        });

        return bpmOrigin;
    };

    BPMOrigin.prototype.getDiagramInfo = function () {
        return this.getBaseDiagramInfo();
    };

    BPMOrigin.prototype.setText = function (text) {
        text = text + '';
        if (this.shapeGroup.select('text.wbg-bpm-shape-name-text').empty()) {
            this.shapeGroup.append('text').classed('wbg-bpm-shape-name-text', true).attr('text-anchor', 'middle').attr('x', this.config.width / 2).attr('y', this.config.height / 2 + 5).text(text);
        } else {
            this.shapeGroup.select('text.wbg-bpm-shape-name-text').text(text);
        }
        this.config.text = text;
    };

    BPMOrigin.prototype.destroy = function () {
        this.remove();
    };

    return BPMOrigin;
});