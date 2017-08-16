/**
 * @file $INfO$
 * @author zhangchaowei
 * @copyright QiYu Times Technology Ltd.
 * 2017/7/12
 * $END$
 */

angular.module('wbgAdminApp').constant('BPM_CONSTANT', (function () {
    return {
        OPERATE_MODE: {
            NORMAL: 'normal',
            DRAG: 'drag',
            VIEW: 'view'
        },
        ELEMENT_TYPE: {
            SHAPE: 'shape',
            LINE: 'line',
            SVG: 'svg'
        },
        SHAPE: {
            ORIGIN: 1, //起始
            TERMINAL: 2, //结束
            PROCESS: 3, //一般流程节点
            DECISION: 4, //判断
            BRANCH_ORIGIN: 5, //分支开始
            BRANCH_TERMINAL: 6
        },
        ERROR: {
            VALID_FALSE: '该业务流校验失败，请检查错误的节点',
            MUST_HAS_ORIGIN: '该业务流有且必须包含一个开始节点',
            MUST_HAS_TERMINAL: '该业务流有且必须包含一个结束节点',
            BAD_LOOP: '此节点可能产生死循环',
            NODE_NO_IN: '该节点不能存在连入的线',
            NODE_ONLY_1_IN: '该节点有且只能有一条连入的线',
            NODE_AT_LEAST_1_IN: '该节点至少有一条连入的线',
            NODE_AT_LEAST_2_IN: '该节点至少有两条连入的线',
            NODE_NO_OUT: '该节点不能存在连出的线',
            NODE_ONLY_1_OUT: '该节点有且只能有一条连出的线',
            NODE_ONLY_2_OUT: '该节点有且只能有两条连出的线',
            NODE_AT_LEAST_1_OUT: '该节点至少有一条连出的线',
            NODE_AT_LEAST_2_OUT: '该节点至少有两条连出的线',
            BRANCH_ORIGIN_MUST_HAS_TERMINAL: '必须有一个匹配的并行结束节点',
            BRANCH_TERMINAL_MUST_HAS_ORIGIN: '必须有一个匹配的并行开始节点'
        }
    };
})());