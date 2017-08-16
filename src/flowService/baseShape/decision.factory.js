/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/11
 * $END$
 */


angular.module('wbgAdminApp').factory('BPMDecision', function (BPMUtils, BPM_CONSTANT, BPMShape, BPMLine) {
    function BPMDecision(container, point, elementMap, options) {
        var config = {
            filter: '#drop-shadow',
            width: 140,
            height: 80,
            radius: 2,
            text: '节点名称'
        };

        this.config = BPMUtils.assign({}, config, options);
        BPMShape.call(this, container, elementMap, this.config);

        this.shape = BPM_CONSTANT.SHAPE.DECISION;
        this.position = point;//图形左上角的点
        this.shapeGroup.attr('transform', 'translate(' + point.x + ', ' + point.y + ')');

        //菱形框路径
        var diamondPath = d3.path();
        diamondPath.moveTo(2, (this.config.height / 2 - 2));
        diamondPath.lineTo((this.config.width / 2 - 4), 2);
        diamondPath.quadraticCurveTo((this.config.width / 2), 0, (this.config.width / 2 + 4), 2);
        diamondPath.lineTo((this.config.width - 2), (this.config.height / 2 - 2));
        diamondPath.quadraticCurveTo(this.config.width, (this.config.height / 2), (this.config.width - 2), (this.config.height / 2 + 2));
        diamondPath.lineTo((this.config.width / 2 + 4), (this.config.height - 2));
        diamondPath.quadraticCurveTo((this.config.width / 2), this.config.height, (this.config.width / 2 - 4), (this.config.height - 2));
        diamondPath.lineTo(2, (this.config.height / 2 + 2));
        diamondPath.quadraticCurveTo(0, (this.config.height / 2), 2, (this.config.height / 2 - 2));

        this.element = this.shapeGroup.append('path').attr('d', diamondPath.toString())
            .attr('stroke', 'transparent')
            .attr('fill', '#ffffff').style('filter', 'url(' + this.config.filter + ')');

        this.shapeGroup.node().insertBefore(this.element.node(), this.jointGroup.node());//把joint放在rect下面; 在UI上覆盖rect;

        this.setText(this.config.text);
    }

    BPMDecision.prototype = Object.create(BPMShape.prototype);

    BPMDecision.prototype.check = function () {
        if (!this.in.size()) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_AT_LEAST_1_IN);
            return;
        }
        if (this.out.size() !== 2) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_ONLY_2_OUT);
            return;
        }
    };

    BPMDecision.convertDiagramInfo = function (diagramInfo, container, elementMap) {
        var bpmDecision = new BPMDecision(container, diagramInfo.position, elementMap, {
            id: diagramInfo.id,
            width: diagramInfo.width,
            height: diagramInfo.height,
            text: diagramInfo.text
        });

        diagramInfo.in.forEach(function (value) {
            bpmDecision.in.add(value);
        });
        diagramInfo.out.forEach(function (value) {
            bpmDecision.out.add(value);
        });

        return bpmDecision;
    };

    BPMDecision.prototype.getDiagramInfo = function () {
        return this.getBaseDiagramInfo();
    };

    BPMDecision.prototype.setText = function (text) {
        var svgText = null;
        text = text + '';
        if (this.shapeGroup.select('text.wbg-bpm-shape-name-text').empty()) {
            svgText = this.shapeGroup.append('text').classed('wbg-bpm-shape-name-text', true).attr('text-anchor', 'middle').attr('x', this.config.width / 2).attr('y', this.config.height / 2 + 5);
            if (text.length > 5) {
                svgText.append('tspan').attr('x', this.config.width / 2).attr('dy', -10).text(text.slice(0, 5));
                svgText.append('tspan').attr('x', this.config.width / 2).attr('dy', 20).text(text.slice(5));
            } else {
                svgText.text(text);
            }
            this.config.text = text;
        } else {
            svgText = this.shapeGroup.select('text.wbg-bpm-shape-name-text');
            svgText.html('');

            if (text.length > 5) {
                svgText.append('tspan').attr('x', this.config.width / 2).attr('dy', -10).text(text.slice(0, 5));
                svgText.append('tspan').attr('x', this.config.width / 2).attr('dy', 20).text(text.slice(5));
            } else {
                svgText.text(text);
            }
            this.config.text = text;
        }
    };

    BPMDecision.prototype.destroy = function () {
        this.remove();
    };

    return BPMDecision;
});