(function() {
var handlers;
handlers = {
    end: endHandler,
    fun: funHandler,
    loop: loopHandler,
    chunk: chunkHandler,
    callback: callbackHandler,
    receive: receiveHandler,
    feedback: feedbackHandler
};
function addCallback(interpreter, name, callback) {
    if (name in interpreter.callbacks) {
        throw new Error('Callback is already registered: ' + name);
    }
    if (typeof callback !== 'function') {
        throw new Error('Callback is not a function: ' + name);
    }
    interpreter.callbacks[name] = callback;
}
function addFunction(interpreter, obj, name) {
    var fun;
    if (name in interpreter.functions) {
        throw new Error('Function is already registered: ' + name);
    }
    fun = obj[name];
    if (!fun) {
        throw new Error('Function is not present in obj: ' + name);
    }
    if (typeof fun !== 'function') {
        throw new Error('Not a function: ' + name);
    }
    interpreter.functions[name] = fun;
}
async function addLoop(interpreter, folder, name) {
    var obj, path;
    path = folder + '/' + name + '.free';
    obj = await loadJson(path);
    if (name in interpreter.loopDiagrams) {
        throw new Error('Loop is already registered: ' + name);
    }
    interpreter.loopDiagrams[name] = obj;
}
function bar(arg) {
    console.log('bar', arg);
}
function callbackHandler(interpreter, loop, runState, op) {
    var arg, fun, stack;
    stack = runState.stack;
    fun = interpreter.callbacks[op.callback];
    arg = getVariable(interpreter, op);
    fun(arg);
    stack.push(op.next);
}
function chunkHandler(interpreter, loop, runState, op) {
    var arg, stack;
    stack = runState.stack;
    arg = getVariable(interpreter, op);
    setVariable(interpreter, op.targetActor, op.targetVar, arg);
    stack.push(op.targetOp);
    stack.push(op.next);
}
function compileLoops(interpreter) {
    var stage1;
    stage1 = compileStage1(interpreter);
    compileStage2(interpreter, stage1);
}
function compileLoopsOld(interpreter) {
    var onothing, ops;
    interpreter.actors = {
        grey: {},
        yellow: {}
    };
    ops = [];
    ops.push({
        op: 'fun',
        fun: 'appleToOrange',
        actor: 'grey',
        next: 1
    });
    ops.push({
        op: 'chunk',
        variable: 'orange',
        actor: 'grey',
        next: 2,
        targetActor: 'yellow',
        targetVar: 'orange',
        targetOp: 7
    });
    ops.push({
        op: 'fun',
        fun: 'processOrange',
        actor: 'grey',
        next: 3
    });
    ops.push({
        op: 'receive',
        actor: 'grey',
        next: 4,
        join: 0
    });
    ops.push({
        op: 'fun',
        fun: 'makeCarrot',
        actor: 'grey',
        next: 5
    });
    ops.push({
        op: 'callback',
        callback: 'foo',
        variable: 'carrot',
        actor: 'grey',
        next: 6
    });
    ops.push({ op: 'end' });
    ops.push({
        op: 'fun',
        fun: 'makeVegetables',
        actor: 'yellow',
        next: 8
    });
    ops.push({
        op: 'feedback',
        variable: 'tomato',
        actor: 'yellow',
        next: 9,
        join: 0,
        targetActor: 'grey',
        targetVar: 'soup',
        targetOp: 4
    });
    ops.push({
        op: 'callback',
        callback: 'bar',
        variable: 'tomato',
        actor: 'yellow',
        next: 10
    });
    ops.push({ op: 'end' });
    onothing = {
        ops: ops,
        startActor: 'grey',
        startVariable: 'apple',
        joinCount: 1
    };
    interpreter.loops = { 'OuterNothing': onothing };
}
function compileStage1(interpreter) {
    var _collection_2, diagram, diagram2, name, stage1;
    stage1 = {};
    _collection_2 = interpreter.loopDiagrams;
    for (name in _collection_2) {
        diagram = _collection_2[name];
        diagram2 = diagramStage1(interpreter, diagram, name);
        stage1[name] = diagram2;
    }
    return stage1;
}
function compileStage2(interpreter, stage1) {
    var diagram, loop, name;
    for (name in stage1) {
        diagram = stage1[name];
        loop = compileToLoop(diagram);
        interpreter.loops[name] = loop;
    }
}
function compileToLoop(diagram) {
    var _collection_6, context, first, firstOp, loop, op;
    context = {
        idToOrdinal: {},
        idToJoin: {},
        joins: 0,
        ops: []
    };
    firstOp = jumpToFirstOp(context, diagram.items, diagram.start);
    flattenSubtree(diagram.items, context, firstOp);
    _collection_6 = context.ops;
    for (op of _collection_6) {
        rewirePointers(context.idToOrdinal, op);
    }
    first = context.ops[0];
    loop = {
        ops: context.ops,
        startActor: context.startActor,
        startVariable: context.startVariable,
        joinCount: context.joins
    };
    return loop;
}
function createCallback(context, item, left) {
    var op;
    op = {
        op: 'callback',
        callback: getText(left),
        variable: getText(item),
        actor: item.actor
    };
    pushOp(context, op);
}
function createChunk(context, item, right) {
    var op;
    op = {
        op: 'chunk',
        variable: getText(item),
        actor: item.actor,
        targetActor: right.actor,
        targetVar: getText(right),
        targetOp: right.next
    };
    pushOp(context, op);
}
function createFeedback(context, item, left) {
    var op;
    op = {
        op: 'feedback',
        variable: getText(item),
        actor: item.actor,
        join: context.idToJoin[left.join],
        targetActor: left.actor,
        targetVar: getText(left),
        targetOp: left.next
    };
    pushOp(context, op);
}
function createFun(context, item) {
    var fun, op, text;
    text = getText(item);
    if (!text.endsWith('()')) {
        throw new Error('Function call should end with (): ' + text);
    }
    fun = text.substring(0, text.length - 2);
    op = {
        op: 'fun',
        fun: fun,
        actor: item.actor
    };
    pushOp(context, op);
}
function createInterpreter(globalContext) {
    return {
        loopDiagrams: {},
        globalContext: globalContext,
        loops: {},
        actors: {},
        callbacks: {},
        functions: {}
    };
}
function createReceive(context, item) {
    var op;
    op = {
        op: 'receive',
        actor: item.actor,
        join: context.joins
    };
    context.idToJoin[item.id] = op.join;
    context.joins++;
    pushOp(context, op);
}
function diagramStage1(interpreter, diagram, name) {
    var _collection_8, actor, bottom, conn, connections, header, headers, id, item, item2, items, left, leftmost, right, start, top;
    items = {};
    connections = [];
    headers = [];
    leftmost = Number.MAX_VALUE;
    start = undefined;
    if (diagram.items) {
        _collection_8 = diagram.items;
        for (id in _collection_8) {
            item = _collection_8[id];
            if (item.type === 'connection') {
                item2 = normalizeConnection(diagram, id, item);
                connections.push(item2);
            } else {
                item2 = {
                    id: id,
                    text: htmlToString(item.content),
                    type: item.type,
                    left: item.left,
                    top: item.top,
                    width: item.width,
                    height: item.height
                };
                if (item.type === 'f_begin') {
                    headers.push(item2);
                } else {
                    if (item.type === 'f_circle') {
                        start = id;
                    }
                }
                items[id] = item2;
            }
        }
    }
    if (headers.length === 0) {
        throw new Error('No headers in diagram');
    }
    if (!start) {
        throw new Error('No start in diagram');
    }
    for (conn of connections) {
        if (conn.role === 'horizontal') {
            left = items[conn.left];
            right = items[conn.right];
            if (conn.direction === 'left') {
                left.join = true;
                right.outLeft = conn.left;
            } else {
                left.outRight = conn.right;
            }
        } else {
            top = items[conn.top];
            bottom = items[conn.bottom];
            top.next = bottom.id;
        }
    }
    for (header of headers) {
        actor = getText(header);
        setActor(items, header, actor);
        interpreter.actors[actor] = {};
    }
    return {
        name: name,
        start: start,
        items: items
    };
}
function endHandler() {
}
function feedbackHandler(interpreter, loop, runState, op) {
    var arg, joins, stack;
    stack = runState.stack;
    joins = runState.joins;
    arg = getVariable(interpreter, op);
    setVariable(interpreter, op.targetActor, op.targetVar, arg);
    joins[op.join]--;
    stack.push(op.next);
    if (!(joins[op.join] > 0)) {
        stack.push(op.targetOp);
    }
}
function flattenSubtree(items, context, id) {
    var _state_, item, left, ordinal, right, text;
    _state_ = 'Branch1';
    while (true) {
        switch (_state_) {
        case 'Branch1':
            if (id) {
                item = items[id];
                if (item.type === 'rectangle') {
                    ordinal = context.ops.length;
                    context.idToOrdinal[id] = ordinal;
                    _state_ = 'Rectangle';
                } else {
                    flattenSubtree(items, context, item.next);
                    _state_ = 'Exit';
                }
            } else {
                context.ops.push({ op: 'end' });
                _state_ = 'Exit';
            }
            break;
        case 'Rectangle':
            text = getText(item);
            if (item.outLeft) {
                if (item.outRight) {
                    throw new Error('Two outgoing errors from rectangle');
                } else {
                    left = items[item.outLeft];
                    if (left.type === 'f_ptr_left') {
                        createCallback(context, item, left);
                        flattenSubtree(items, context, item.next);
                    } else {
                        createFeedback(context, item, left);
                        flattenSubtree(items, context, item.next);
                    }
                }
            } else {
                if (item.outRight) {
                    right = items[item.outRight];
                    createChunk(context, item, right);
                    flattenSubtree(items, context, item.next);
                    flattenSubtree(items, context, right.next);
                } else {
                    if (item.join) {
                        createReceive(context, item);
                    } else {
                        createFun(context, item);
                    }
                    flattenSubtree(items, context, item.next);
                }
            }
            _state_ = 'Exit';
            break;
        case 'Exit':
            _state_ = undefined;
            break;
        default:
            return;
        }
    }
}
function foo(arg) {
    console.log('foo', arg);
}
function funHandler(interpreter, loop, runState, op) {
    var actor, fun, result, stack;
    fun = interpreter.functions[op.fun];
    actor = interpreter.actors[op.actor];
    result = fun(actor, interpreter.globalContext, runState.locals);
    stack = runState.stack;
    if (result && typeof result.then === 'function') {
        result.then(function () {
            stack.push(op.next);
            traverseOps(interpreter, loop, runState);
        });
    } else {
        stack.push(op.next);
    }
}
function getHandler(op) {
    var handler;
    handler = handlers[op];
    if (handler) {
        return handler;
    } else {
        throw new Error('Unsupported opcode: ' + op);
    }
}
function getLoop(interpreter, loopName) {
    var loop;
    loop = interpreter.loops[loopName];
    if (loop) {
        return loop;
    } else {
        throw new Error('Unknown look: ' + loopName);
    }
}
function getText(item) {
    var text;
    text = item.text[0];
    if (!text) {
        throw new Error('Empty item');
    }
    return text;
}
function getVariable(interpreter, op) {
    var actor, arg;
    actor = interpreter.actors[op.actor];
    arg = actor[op.variable];
    return arg;
}
function jumpToFirstOp(context, items, start) {
    var firstHeader, inputNode, startIcon;
    startIcon = items[start];
    firstHeader = items[startIcon.next];
    inputNode = items[firstHeader.next];
    context.startActor = getText(firstHeader);
    context.startVariable = getText(inputNode);
    return inputNode.next;
}
async function loadJson(path) {
    var obj, result;
    result = await sendRequest('GET', path);
    obj = JSON.parse(result.body);
    return obj;
}
function loopHandler(interpreter, loop, stack, op) {
}
async function loopsMain() {
    var algo, dataFolder, interpreter, method, name;
    dataFolder = 'loops1-data';
    interpreter = createInterpreter({ x: 10 });
    await addLoop(interpreter, dataFolder, 'OuterNothing');
    addCallback(interpreter, 'foo', foo);
    addCallback(interpreter, 'bar', bar);
    algo = Loops1Algo();
    for (name in algo) {
        method = algo[name];
        addFunction(interpreter, algo, name);
    }
    compileLoops(interpreter);
    startLoop(interpreter, 'OuterNothing', 21);
}
function normalizeConnection(diagram, id, item) {
    var begin, bottom, direct, direction, end, left, right, style, top;
    begin = diagram.items[item.begin];
    end = diagram.items[item.end];
    if (item.style) {
        style = JSON.parse(item.style);
    } else {
        style = {};
    }
    if (style.headStyle === 'arrow' || style.tailStyle !== 'arrow') {
        direct = true;
    } else {
        direct = false;
    }
    if (item.role === 'horizontal') {
        if (begin.left < end.left) {
            left = item.begin;
            right = item.end;
        } else {
            direct = !direct;
            left = item.end;
            right = item.begin;
        }
        if (direct) {
            direction = 'right';
        } else {
            direction = 'left';
        }
        return {
            id: id,
            type: item.type,
            role: item.role,
            left: left,
            right: right,
            direction: direction
        };
    } else {
        if (begin.top < end.top) {
            top = item.begin;
            bottom = item.end;
        } else {
            top = item.end;
            bottom = item.begin;
        }
        return {
            id: id,
            type: item.type,
            role: item.role,
            top: top,
            bottom: bottom
        };
    }
}
function pushOp(context, op) {
    context.ops.push(op);
    op.next = context.ops.length;
}
function receiveHandler(interpreter, loop, runState, op) {
    var joins, stack;
    stack = runState.stack;
    joins = runState.joins;
    joins[op.join]--;
    if (!(joins[op.join] > 0)) {
        stack.push(op.next);
    }
}
function repeat(value, count) {
    var i, result;
    result = [];
    for (i = 0; i < count; i++) {
        result.push(value);
    }
    return result;
}
function rewirePointers(idToOrdinal, op) {
    if (op.targetOp) {
        op.targetOp = idToOrdinal[op.targetOp];
    }
}
function setActor(items, item, actor) {
    while (true) {
        item.actor = actor;
        if (item.next) {
            item = items[item.next];
        } else {
            break;
        }
    }
}
function setVariable(interpreter, actorName, variable, arg) {
    var actor;
    actor = interpreter.actors[actorName];
    actor[variable] = arg;
}
function startLoop(interpreter, loopName, arg) {
    var loop, runState;
    loop = getLoop(interpreter, loopName);
    setVariable(interpreter, loop.startActor, loop.startVariable, arg);
    runState = {
        locals: {},
        stack: [0],
        joins: repeat(2, loop.joinCount)
    };
    traverseOps(interpreter, loop, runState);
}
function traverseOps(interpreter, loop, runState) {
    var currentOpId, handler, op, stack;
    stack = runState.stack;
    while (true) {
        currentOpId = stack.pop();
        op = loop.ops[currentOpId];
        handler = getHandler(op.op);
        handler(interpreter, loop, runState, op);
        if (stack.length === 0) {
            break;
        }
    }
}
window.loopsMain = loopsMain;
})();