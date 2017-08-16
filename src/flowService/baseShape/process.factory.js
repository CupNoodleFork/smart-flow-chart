/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/11
 * $END$
 */

angular.module('wbgAdminApp').factory('BPMProcess', function (BPMShape, BPMUtils, BPMLine, BPM_CONSTANT) {
    function BPMProcess(container, point, elementMap, options) {
        var config = {
            filter: '#drop-shadow',
            width: 160,
            height: 50,
            radius: 2,
            text: '节点名称'
        };

        this.config = BPMUtils.assign({}, config, options);
        BPMShape.call(this, container, elementMap, this.config);

        this.shape = BPM_CONSTANT.SHAPE.PROCESS;
        this.position = point;
        this.shapeGroup.attr('transform', 'translate(' + point.x + ', ' + point.y + ')');
        this.element = this.shapeGroup.append('rect').attr('fill', '#ffffff').attr('width', this.config.width).attr('height', this.config.height).attr('rx', this.config.radius).attr('ry', this.config.radius).style('filter', 'url(' + this.config.filter + ')');
        this.shapeGroup.node().insertBefore(this.element.node(), this.jointGroup.node());//把joint放在rect下面; 在UI上覆盖rect;

        this.setText(this.config.text);
    }

    BPMProcess.prototype = Object.create(BPMShape.prototype);

    BPMProcess.prototype.check = function () {
        //至少一个连入
        if (!this.in.size()) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_AT_LEAST_1_IN);
            return;
        }
        //只能有一个连出
        if (this.out.size() !== 1) {
            this.setErrorTip(BPM_CONSTANT.ERROR.NODE_ONLY_1_OUT);
            return;
        }

    };

    BPMProcess.convertDiagramInfo = function (diagramInfo, container, elementMap) {
        var bpmProcess = new BPMProcess(container, diagramInfo.position, elementMap, {
            id: diagramInfo.id,
            width: diagramInfo.width,
            height: diagramInfo.height,
            text: diagramInfo.text
        });
        diagramInfo.in.forEach(function (value) {
            bpmProcess.in.add(value);
        });
        diagramInfo.out.forEach(function (value) {
            bpmProcess.out.add(value);
        });

        return bpmProcess;
    };

    BPMProcess.prototype.getDiagramInfo = function () {
        return this.getBaseDiagramInfo();
    };

    BPMProcess.prototype.setText = function (text) {
        text = text + '';
        if (this.shapeGroup.select('text.wbg-bpm-shape-name-text').empty()) {
            this.shapeGroup.append('text').classed('wbg-bpm-shape-name-text', true).attr('text-anchor', 'middle').attr('x', this.config.width / 2).attr('y', this.config.height / 2 + 5).text(text);
        } else {
            this.shapeGroup.select('text.wbg-bpm-shape-name-text').text(text);
        }
        this.config.text = text;
        //TODO 记得根据服务端更换属性名
        this.extension && (this.extension.title = text);
    };

    BPMProcess.prototype.destroy = function () {
        this.remove();
    };

    return BPMProcess;
});