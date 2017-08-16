/**
 * Created by hunter on 2017-07-10.
 */
angular.module('wbgAdminApp')
    .factory('SHOW_JOINT_LIST', ['BPM_CONSTANT', function (BPM_CONSTANT) {
        //TODO 调整图标的类
        return [
            {
                name: '节点',
                type: BPM_CONSTANT.SHAPE.PROCESS,
                class: '1'
            }, {
                name: '条件',
                type: BPM_CONSTANT.SHAPE.DECISION,
                class: '1'
            }, {
                name: '并行开始',
                type: BPM_CONSTANT.SHAPE.BRANCH_ORIGIN,
                class: '1'
            }, {
                name: '并行结束',
                type: BPM_CONSTANT.SHAPE.BRANCH_TERMINAL,
                class: '1'
            }, {
                name: '开始',
                type: BPM_CONSTANT.SHAPE.ORIGIN,
                class: '1'
            }, {
                name: '结束',
                type: BPM_CONSTANT.SHAPE.TERMINAL,
                class: '1'
            }
        ];
    }]);