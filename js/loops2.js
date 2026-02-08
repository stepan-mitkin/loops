(function() {
var globals;
const canvasWidth = 380;
const canvasPadding = 30;
const doorWidth = 80;
const doorHeight = 130;
const floorThickness = 20;
const floorWidth = 160;
const floorHeight = 180;
const cabinThickness = 10;
const floorCount = 4;
const accelerationDistance = 60;
const cabinVelocity = 100;
const doorVelocity = 1;
const doorTimeout = 1000;
const fontFace = 'Arial';
const fontSize = 17;
const buttonSize = 40;
const buttonMargin = 10;
const activeButton = 'yellow';
const normalButton = '#f0f0f0';
const background = 'white';
const lineColor = 'black';
const openColor = '#8a98d1';
globals = {
    inter: undefined,
    canvas: undefined,
    ctx: undefined,
    lift: undefined
};
function Butt2(id) {
    var self = {};
    function reset(locals) {
        console.log('Butt2::reset', id, locals.input);
    }
    self.reset = reset;
    return self;
}
function Cabin() {
    var self = {};
    var direction, downButtons, floor, position, state, target, upButtons;
    state = 'closedstill';
    direction = 'up';
    floor = 1;
    target = undefined;
    position = floorToPosition(floor);
    upButtons = createButtonState();
    downButtons = createButtonState();
    function addNewTarget(button) {
        var _selectValue_22;
        _selectValue_22 = button.role;
        if (_selectValue_22 === 'up') {
            upButtons[button.floor] = true;
        } else {
            if (_selectValue_22 === 'down') {
                downButtons[button.floor] = true;
            } else {
                if (_selectValue_22 !== 'inner') {
                    throw new Error('Unexpected case value: ' + _selectValue_22);
                }
                downButtons[button.floor] = true;
                upButtons[button.floor] = true;
            }
        }
    }
    function clearButtons() {
        upButtons[floor] = false;
        downButtons[floor] = false;
    }
    function createButtonState() {
        var i, result;
        result = [undefined];
        for (i = 0; i < floorCount; i++) {
            result.push(false);
        }
        return result;
    }
    function findNextTargetDown() {
        var floorY, found, i;
        found = undefined;
        for (i = 1; i <= floorCount; i++) {
            floorY = floorToPosition(i);
            if (floorY > position) {
                if (found) {
                    if (downButtons[i]) {
                        found = i;
                    }
                } else {
                    if (isFloorRequested(i)) {
                        found = i;
                    }
                }
            } else {
                break;
            }
        }
        return found;
    }
    function findNextTargetUp() {
        var floorY, found, i;
        found = undefined;
        for (i = floorCount; i > 0; i--) {
            floorY = floorToPosition(i);
            if (floorY < position) {
                if (found) {
                    if (upButtons[i]) {
                        found = i;
                    }
                } else {
                    if (isFloorRequested(i)) {
                        found = i;
                    }
                }
            } else {
                break;
            }
        }
        return found;
    }
    function isFloorRequested(number) {
        if (upButtons[number] || downButtons[number]) {
            return true;
        } else {
            return false;
        }
    }
    function onArrived(arg, output) {
        floor = target;
        target = undefined;
        output.doorTarget = 1;
        state = 'opening';
    }
    function onCommand(button, output) {
        addNewTarget(button);
        if (state === 'closedstill') {
            if (requestedCurrentFloor()) {
                output.doorTarget = 1;
                state = 'opening';
            } else {
                state = startMovement(output);
            }
        } else {
            if (state === 'closing') {
                if (requestedCurrentFloor()) {
                    output.doorTarget = 1;
                    state = 'opening';
                }
            } else {
                if (state === 'moving') {
                    target = updateDestination();
                    output.motorTarget = floorToPosition(target);
                }
            }
        }
    }
    function onDoor(arg, output) {
        if (state === 'opening') {
            clearButtons();
            output.opened = true;
            output.floor = floor;
            state = 'open';
        } else {
            if (state === 'closing') {
                clearButtons();
                output.floor = floor;
                state = startMovement(output);
            }
        }
    }
    function requestedCurrentFloor() {
        return isFloorRequested(floor);
    }
    function startMovement(output) {
        var nextTarget;
        if (direction === 'up') {
            nextTarget = findNextTargetUp();
            if (nextTarget) {
                direction = 'up';
            } else {
                nextTarget = findNextTargetDown();
                direction = 'down';
            }
        } else {
            nextTarget = findNextTargetDown();
            if (nextTarget) {
                direction = 'down';
            } else {
                nextTarget = findNextTargetUp();
                direction = 'up';
            }
        }
        target = nextTarget;
        if (target === undefined) {
            return 'closedstill';
        } else {
            output.motorTarget = floorToPosition(target);
            return 'moving';
        }
    }
    function updateDestination() {
        if (direction === 'up') {
            return findNextTargetUp();
        } else {
            return findNextTargetDown();
        }
    }
    function updatePosition(arg) {
        position = arg;
    }
    async function waitOpen(arg, output) {
        await pause(2000);
        output.doorTarget = 0;
        state = 'closing';
    }
    self.onArrived = onArrived;
    self.onCommand = onCommand;
    self.onDoor = onDoor;
    self.updatePosition = updatePosition;
    self.waitOpen = waitOpen;
    return self;
}
function Compiler() {
    var self = {};
    self.types = {};
    function addLoop(typeName, name, diagram) {
        var stage1, stage2, type;
        type = self.types[typeName];
        stage1 = diagramStage1(diagram, name);
        stage2 = compileToLoop(stage1);
        mainLog(JSON.stringify(stage2, null, 4));
        type.loops[name] = stage2;
    }
    function clearNext(context, next) {
        var last, ops;
        ops = context.ops;
        last = ops.length - 1;
        ops[last].next = next;
    }
    function compileStage1(interpreter) {
        var _collection_9, diagram, diagram2, name, stage1;
        stage1 = {};
        _collection_9 = interpreter.loopDiagrams;
        for (name in _collection_9) {
            diagram = _collection_9[name];
            diagram2 = diagramStage1(interpreter, diagram, name);
            stage1[name] = diagram2;
        }
        return stage1;
    }
    function compileToLoop(diagram) {
        var _collection_16, context, loop, op;
        context = {
            idToOrdinal: {},
            idToJoin: {},
            joins: 0,
            ops: []
        };
        flattenSubtree(diagram.items, context, diagram.start);
        _collection_16 = context.ops;
        for (op of _collection_16) {
            rewirePointers(context.idToOrdinal, op);
        }
        loop = {
            name: diagram.name,
            ops: context.ops,
            startActor: context.startActor,
            params: diagram.params,
            joinCount: context.joins
        };
        return loop;
    }
    function createCallback(context, item, left) {
        var op;
        op = {
            op: 'callback',
            callback: getText(left),
            actor: item.actor
        };
        parseConditionalVariable(item, op);
        pushOp(context, item, op);
    }
    function createChunk(context, item, rightId) {
        var op;
        op = {
            op: 'chunk',
            actor: item.actor,
            targetOp: rightId
        };
        parseConditionalVariable(item, op);
        pushOp(context, item, op);
    }
    function createFeedback(context, item, left) {
        var op;
        op = {
            op: 'feedback',
            actor: item.actor,
            join: context.idToJoin[left.join],
            targetVar: getText(left),
            targetOp: left.next
        };
        parseConditionalVariable(item, op);
        pushOp(context, item, op);
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
        pushOp(context, item, op);
    }
    function createLoopCall(items, context, item, prev) {
        var current, end, next, op, outputVar;
        op = {
            op: 'loop',
            loop: item.text,
            actor: item.actor,
            ports: []
        };
        if (prev) {
            item.id = prev.id;
            if (prev.one) {
                op.one = prev.one;
                op.arg = prev.arg;
            } else {
                if (prev.many) {
                    op.many = prev.many;
                    op.arg = prev.arg;
                }
            }
        }
        pushOp(context, item, op);
        end = context.ops.length;
        context.ops.push({ op: 'end' });
        next = item.next;
        while (true) {
            if (next) {
                current = items[next];
                outputVar = parseConditionalVariable(current, {});
                if (current.type !== 'rectangle') {
                    throw new Error('A rectangle expected');
                }
                if (current.outLeft) {
                    handleLeftArrow(items, context, current);
                    clearNext(context, end);
                    op.ports.push([
                        outputVar,
                        current.id
                    ]);
                } else {
                    if (current.outRight) {
                        handleRightArrow(items, context, current);
                        clearNext(context, end);
                        flattenSubtree(items, context, current.outRight);
                        op.ports.push([
                            outputVar,
                            current.id
                        ]);
                    } else {
                        op.ports.push([
                            outputVar,
                            0
                        ]);
                    }
                }
                next = current.next;
            } else {
                break;
            }
        }
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
        pushOp(context, item, op);
    }
    function createType(name) {
        self.types[name] = {
            name: name,
            loops: {}
        };
    }
    function diagramStage1(diagram, name) {
        var _collection_12, actor, bottom, conn, connections, header, headers, id, item, item2, items, left, leftmost, params, right, start, top;
        items = {};
        connections = [];
        headers = [];
        leftmost = Number.MAX_VALUE;
        start = undefined;
        params = undefined;
        if (diagram.items) {
            _collection_12 = diagram.items;
            for (id in _collection_12) {
                item = _collection_12[id];
                if (item.type === 'connection') {
                    item2 = normalizeConnection(diagram, id, item);
                    connections.push(item2);
                } else {
                    item2 = {
                        id: id,
                        text: extractText(item.content),
                        type: item.type,
                        left: item.left,
                        top: item.top,
                        width: item.width,
                        height: item.height
                    };
                    if (item.type === 'f_begin') {
                        headers.push(item2);
                        if (item.left < leftmost) {
                            leftmost = item.left;
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
        for (id in items) {
            item = items[id];
            if (item.type === 'rectangle' && item.outRight === start) {
                params = getText(item);
            }
        }
        for (header of headers) {
            actor = getText(header);
            setActor(items, header, actor);
        }
        return {
            name: name,
            start: items[start].next,
            params: params,
            items: items
        };
    }
    function extractText(html) {
        var texts;
        texts = htmlToString(html);
        if (texts) {
            return texts[0];
        } else {
            return '';
        }
    }
    function flattenSubtree(items, context, id, prev) {
        var _state_, item, nextPrev;
        _state_ = 'Branch1';
        while (true) {
            switch (_state_) {
            case 'Branch1':
                nextPrev = undefined;
                if (id) {
                    item = items[id];
                    _state_ = 'Rectangle';
                } else {
                    context.ops.push({ op: 'end' });
                    _state_ = 'Exit';
                }
                break;
            case 'Rectangle':
                if (item.outLeft) {
                    handleLeftArrow(items, context, item);
                    flattenSubtree(items, context, item.next);
                } else {
                    if (item.outRight) {
                        handleRightArrow(items, context, item);
                        flattenSubtree(items, context, item.next);
                        flattenSubtree(items, context, item.outRight);
                    } else {
                        if (item.type === 'rounded') {
                            createLoopCall(items, context, item, prev);
                        } else {
                            if (item.join) {
                                createReceive(context, item);
                            } else {
                                nextPrev = tryParseFanOut(item);
                                if (!nextPrev) {
                                    createFun(context, item);
                                }
                            }
                            flattenSubtree(items, context, item.next, nextPrev);
                        }
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
    function getText(item) {
        var text;
        text = item.text;
        if (!text) {
            throw new Error('Empty item');
        }
        return text;
    }
    function getType(name) {
        return self.types[name];
    }
    function handleLeftArrow(items, context, item) {
        var left;
        if (item.outRight) {
            throw new Error('Two outgoing arrows from rectangle');
        } else {
            left = items[item.outLeft];
            if (left.type === 'f_ptr_left') {
                createCallback(context, item, left);
            } else {
                createFeedback(context, item, left);
            }
        }
    }
    function handleRightArrow(items, context, item) {
        createChunk(context, item, item.outRight);
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
    function parseConditionalVariable(item, op) {
        var text;
        text = item.text || '';
        text = text.trim();
        if (text) {
            if (text.endsWith('?')) {
                op.cond = true;
                text = text.substring(0, text.length - 1);
                if (text.startsWith('NOT ')) {
                    op.not = true;
                    op.variable = text.substring(4).trim();
                } else {
                    op.variable = text;
                }
            } else {
                op.variable = text;
            }
        } else {
            op.variable = text;
        }
        return op.variable;
    }
    function pushOp(context, item, op) {
        var ordinal;
        ordinal = context.ops.length;
        context.idToOrdinal[item.id] = ordinal;
        context.ops.push(op);
        op.next = context.ops.length;
    }
    function rewirePointers(idToOrdinal, op) {
        var _collection_18, item;
        if (op.targetOp) {
            op.targetOp = idToOrdinal[op.targetOp];
        }
        if (op.ports) {
            _collection_18 = op.ports;
            for (item of _collection_18) {
                if (item[1] !== -1) {
                    item[1] = idToOrdinal[item[1]];
                }
            }
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
    function tryParseFanOut(item) {
        var arg, fun, parts, result, text, text2, type;
        text = item.text || '';
        text = text.trim();
        if (text.startsWith('ONE ')) {
            text2 = text.substring(4).trim();
            type = 'one';
            parts = text.split(' ');
            fun = parts[1];
            arg = parts[2];
            result = {};
            result[type] = fun;
            result.arg = arg;
            result.id = item.id;
            return result;
        } else {
            if (text.startsWith('MANY ')) {
                text2 = text.substring(5).trim();
                type = 'many';
                parts = text.split(' ');
                fun = parts[1];
                arg = parts[2];
                result = {};
                result[type] = fun;
                result.arg = arg;
                result.id = item.id;
                return result;
            } else {
                return undefined;
            }
        }
    }
    self.addLoop = addLoop;
    self.createType = createType;
    self.getType = getType;
    return self;
}
function ImaginaryButton(id) {
    var self = {};
    function click(arg, output) {
        console.log('click', id, arg);
        output.done = id + ': ' + arg;
    }
    function getId() {
        return id;
    }
    function reset() {
        console.log('reset', id);
    }
    self.click = click;
    self.getId = getId;
    self.reset = reset;
    return self;
}
function Interpreter() {
    var self = {};
    self.callbacks = {};
    self.handlers = {
        end: endHandler,
        fun: funHandler,
        loop: loopHandler,
        chunk: chunkHandler,
        callback: callbackHandler,
        receive: receiveHandler,
        feedback: feedbackHandler
    };
    function addCallbacks(obj) {
        Object.assign(self.callbacks, obj);
    }
    function callbackHandler(obj, loop, frame, op) {
        var arg, fun, locals, stack;
        locals = frame.locals;
        stack = frame.stack;
        if (checkCondition(op, locals)) {
            fun = frame.callbacks[op.callback];
            arg = locals[op.variable];
            fun(arg);
        }
        stack.push(op.next);
    }
    function checkCondition(op, locals) {
        var falsy;
        if (op.cond) {
            falsy = isFalsy(locals[op.variable]);
            if (op.not) {
                return falsy;
            } else {
                return !falsy;
            }
        } else {
            return true;
        }
    }
    function chunkHandler(obj, loop, frame, op) {
        var arg, locals, stack;
        locals = frame.locals;
        stack = frame.stack;
        if (checkCondition(op, locals)) {
            if (op.variable) {
                arg = locals[op.variable];
            } else {
                arg = undefined;
            }
            frame.pocket = arg;
            stack.push(op.next);
            stack.push(op.targetOp);
        } else {
            stack.push(op.next);
        }
    }
    function completeFunLoopCall(frame, op, output) {
        var i, name, opId, port;
        for (i = op.ports.length - 1; i >= 0; i--) {
            port = op.ports[i];
            name = port[0];
            opId = port[1];
            frame.locals[name] = output[name];
            if (opId) {
                frame.stack.push(opId);
            }
        }
    }
    function continueLoop(obj, loop, frame, opId) {
        frame.stack.push(opId);
        traverseOps(obj, loop, frame);
    }
    function createCodeObject(obj) {
        return {
            type: 'code',
            obj: obj
        };
    }
    function createFrame(typeName, loop, parent, callbacks) {
        var frame;
        frame = {
            name: typeName + '.' + loop.name,
            locals: {},
            stack: [0],
            joins: repeat(2, loop.joinCount),
            parent: parent,
            callbacks: callbacks
        };
        return frame;
    }
    function createLoopObject(definition, actors, obj) {
        return {
            type: 'loop',
            definition: definition,
            actors: actors,
            obj: obj
        };
    }
    function createSubLoopCallback(obj, loop, frame, opId, name) {
        return function (arg) {
            subLoopCallback(obj, loop, frame, opId, name, arg);
        };
    }
    function createSubLoopCallbacks(obj, loop, frame, op) {
        var _collection_20, callbacks, name, opId, port;
        callbacks = {};
        _collection_20 = op.ports;
        for (port of _collection_20) {
            name = port[0];
            opId = port[1];
            callbacks[name] = createSubLoopCallback(obj, loop, frame, opId, name);
        }
        return callbacks;
    }
    function endHandler() {
    }
    function feedbackHandler(obj, loop, frame, op) {
        var arg, joins, locals, stack;
        locals = frame.locals;
        stack = frame.stack;
        if (checkCondition(op, locals)) {
            joins = frame.joins;
            arg = locals[op.variable];
            locals[op.targetVar] = arg;
            joins[op.join]--;
            stack.push(op.next);
            if (!(joins[op.join] > 0)) {
                stack.push(op.targetOp);
            }
        } else {
            stack.push(op.next);
        }
    }
    function funHandler(obj, loop, frame, op) {
        var fun, result, stack;
        fun = obj.obj[op.fun];
        stack = frame.stack;
        result = fun(frame.locals);
        if (isPromise(result)) {
            result.then(function () {
                continueLoop(obj, loop, frame, op.next);
            });
        } else {
            stack.push(op.next);
        }
    }
    function getActor(obj, frame, op) {
        var arg, collection, fun;
        if (op.actor === 'this') {
            return obj;
        } else {
            if (op.one) {
                collection = obj.actors[op.actor];
                fun = obj.obj[op.one];
                arg = frame.locals[op.arg];
                return fun(collection, arg);
            } else {
                return obj.actors[op.actor];
            }
        }
    }
    function getHandler(op) {
        var handler;
        handler = self.handlers[op];
        if (handler) {
            return handler;
        } else {
            throw new Error('Unsupported opcode: ' + op);
        }
    }
    function getMany(obj, frame, op) {
        var arg, collection, fun;
        collection = obj.actors[op.actor];
        fun = obj.obj[op.many];
        arg = frame.locals[op.arg];
        return fun(collection, arg);
    }
    function isFalsy(value) {
        if (value === false || value === undefined || value === '' || value === null) {
            return true;
        } else {
            return false;
        }
    }
    function isPromise(result) {
        if (result && typeof result.then === 'function') {
            return true;
        } else {
            return false;
        }
    }
    function loopHandler(obj, loop, frame, op) {
        var actor, arg, callbacks, collection, fun, output, result, singleActor;
        arg = frame.pocket;
        if (op.many) {
            collection = getMany(obj, frame, op);
            for (singleActor of collection) {
                if (singleActor.type === 'loop') {
                    runLoopCore(singleActor, op.loop, arg, frame, {});
                } else {
                    output = {};
                    fun = singleActor.obj[op.loop];
                    fun(arg, output);
                }
            }
        } else {
            actor = getActor(obj, frame, op);
            if (actor) {
                if (actor.type === 'loop') {
                    callbacks = createSubLoopCallbacks(obj, loop, frame, op);
                    runLoopCore(actor, op.loop, arg, frame, callbacks);
                } else {
                    output = {};
                    fun = actor.obj[op.loop];
                    result = fun(arg, output);
                    if (isPromise(result)) {
                        result.then(function () {
                            completeFunLoopCall(frame, op, output);
                            traverseOps(obj, loop, frame);
                        });
                    } else {
                        completeFunLoopCall(frame, op, output);
                    }
                }
            }
        }
    }
    function receiveHandler(obj, loop, frame, op) {
        var joins, stack;
        joins = frame.joins;
        joins[op.join]--;
        if (!(joins[op.join] > 0)) {
            stack = frame.stack;
            stack.push(op.next);
        }
    }
    function runLoop(obj, loopName, arg) {
        runLoopCore(obj, loopName, arg, undefined, self.callbacks);
    }
    function runLoopCore(obj, loopName, arg, parentFrame, callbacks) {
        var frame, loop;
        loop = obj.definition.loops[loopName];
        frame = createFrame(obj.definition.name, loop, parentFrame, callbacks);
        if (loop.params) {
            frame.pocket = arg;
            frame.locals[loop.params] = arg;
        }
        traverseOps(obj, loop, frame);
    }
    function subLoopCallback(obj, loop, frame, opId, name, arg) {
        frame.locals[name] = arg;
        if (opId) {
            continueLoop(obj, loop, frame, opId);
        }
    }
    function traverseOps(obj, loop, frame) {
        var currentOpId, handler, op, stack;
        stack = frame.stack;
        while (true) {
            currentOpId = stack.pop();
            op = loop.ops[currentOpId];
            handler = getHandler(op.op);
            handler(obj, loop, frame, op);
            if (stack.length === 0) {
                break;
            }
        }
    }
    self.addCallbacks = addCallbacks;
    self.createCodeObject = createCodeObject;
    self.createLoopObject = createLoopObject;
    self.runLoop = runLoop;
    self.runLoopCore = runLoopCore;
    return self;
}
function Lift() {
    var self = {};
    function findButton(collection, evt) {
        var button, pos;
        pos = clientToElement(globals.canvas, evt);
        for (button of collection) {
            if (button.obj.hit(pos)) {
                return button;
            }
        }
        return undefined;
    }
    function getButtonsByFloor(buttons, floor) {
        return buttons.filter(function (button) {
            return button.obj.getUserData().floor === floor;
        });
    }
    self.findButton = findButton;
    self.getButtonsByFloor = getButtonsByFloor;
    return self;
}
function LinearMotor(velocity, startValue) {
    var self = {};
    var current, state, target;
    state = 'idle';
    current = startValue;
    target = undefined;
    function getCurrent() {
        return current;
    }
    function start(arg) {
        target = arg;
        if (target > current) {
            state = 'up';
            requestUpdate();
        } else {
            if (target < current) {
                state = 'down';
                requestUpdate();
            }
        }
    }
    function updateMotor(dt, output) {
        if (state === 'up') {
            requestUpdate();
            current += velocity * dt;
            if (current >= target) {
                current = target;
                output.done = true;
                state = 'idle';
            }
        } else {
            if (state === 'down') {
                requestUpdate();
                current -= velocity * dt;
                if (current <= target) {
                    current = target;
                    output.done = true;
                    state = 'idle';
                }
            }
        }
        output.position = current;
    }
    self.getCurrent = getCurrent;
    self.start = start;
    self.updateMotor = updateMotor;
    return self;
}
function OneWayButton(x, y, role, text, userData) {
    var self = {};
    var on;
    on = false;
    function click(arg, output) {
        if (!on) {
            on = true;
            output.command = userData;
        }
    }
    function drawButton() {
        if (role === 'up') {
            if (on) {
                drawActiveUp(x, y);
            } else {
                drawNormalUp(x, y);
            }
        } else {
            if (role === 'down') {
                if (on) {
                    drawActiveDown(x, y);
                } else {
                    drawNormalDown(x, y);
                }
            } else {
                if (role !== 'inner') {
                    throw new Error('Unexpected case value: ' + role);
                }
                if (on) {
                    drawActiveButton(x, y, text);
                } else {
                    drawNormalButton(x, y, text);
                }
            }
        }
    }
    function getUserData() {
        return userData;
    }
    function hit(pos) {
        return hitBox(x, y, buttonSize, buttonSize, pos.x, pos.y);
    }
    function resetButton() {
        on = false;
    }
    self.click = click;
    self.drawButton = drawButton;
    self.getUserData = getUserData;
    self.hit = hit;
    self.resetButton = resetButton;
    return self;
}
function RedFunctions() {
    var self = {};
    function buildMur(locals) {
        locals.mur = locals.input * 3;
    }
    function calcUs(locals) {
        locals.done = 'calcUs: ' + locals.u1 + ' + ' + locals.u2;
    }
    function calculateBar(locals) {
        if (locals.input % 2 === 0) {
            locals.bar = 'Even!';
        } else {
            locals.bar = '';
        }
    }
    function calculateHelloBye(locals) {
        locals.hello = 'HELLO IS HELLO';
        locals.bye = 'BYE IS BYE';
    }
    function chooseGrey(locals) {
        locals.buttonId = 'grey';
    }
    function combineOut3Out4(locals) {
        locals.combined = locals.out3 + ' ' + locals.out4;
    }
    function filterGoodButtons(collection) {
        return collection;
    }
    function getButton(collection, arg) {
        var button, id;
        for (button of collection) {
            id = button.obj.getId();
            if (id === arg) {
                return button;
            }
        }
        throw new Error('Button not found: ' + locals.input);
    }
    function helloToInput(locals) {
        locals.input = locals.hello * 10;
    }
    async function wait2(locals) {
        console.log('wait2');
        await wait(2000);
        locals.out2 = locals.input * 2;
        console.log('wait2 completed');
    }
    self.buildMur = buildMur;
    self.calcUs = calcUs;
    self.calculateBar = calculateBar;
    self.calculateHelloBye = calculateHelloBye;
    self.chooseGrey = chooseGrey;
    self.combineOut3Out4 = combineOut3Out4;
    self.filterGoodButtons = filterGoodButtons;
    self.getButton = getButton;
    self.helloToInput = helloToInput;
    self.wait2 = wait2;
    return self;
}
function add(parent, child) {
    parent.appendChild(child);
}
function addElementWithText(container, tag, text) {
    var element;
    element = document.createElement(tag);
    addText(element, text);
    add(container, element);
}
function addLine(depth, container, name, value, bold) {
    var indent, nameEl, objLine, valueEl, valueStr;
    objLine = document.createElement('div');
    objLine.style.margin = '5px';
    if (depth) {
        indent = document.createElement('span');
        indent.style.display = 'inline-block';
        indent.style.verticalAlign = 'middle';
        indent.style.width = 20 * depth + 'px';
        add(objLine, indent);
    }
    nameEl = document.createElement('span');
    nameEl.style.display = 'inline-block';
    nameEl.style.verticalAlign = 'middle';
    addText(nameEl, name + ': ');
    nameEl.style.minWidth = '100px';
    add(objLine, nameEl);
    if (bold) {
        nameEl.style.fontWeight = 'bold';
    }
    if (value !== undefined) {
        valueStr = formatValue(value);
        valueEl = document.createElement('span');
        valueEl.style.display = 'inline-block';
        valueEl.style.verticalAlign = 'middle';
        addText(valueEl, valueStr);
        add(objLine, valueEl);
        valueEl.style.fontWeight = 'bold';
    }
    add(container, objLine);
}
async function addLoopToType(compiler, folder, type, name) {
    var obj, path;
    path = folder + '/' + type + '/' + name + '.free';
    obj = await loadJson(path);
    compiler.addLoop(type, name, obj);
}
function addText(element, text) {
    var tnode;
    tnode = document.createTextNode(text);
    element.appendChild(tnode);
}
async function buildStructures() {
    var actors, buttons, cabin, compiler, door, down, floor, folder, inter, lift, liftMethods, liftType, method, motor, up;
    folder = 'loops2-data';
    compiler = Compiler();
    compiler.createType('Lift');
    liftMethods = [
        'onClick',
        'updateDoor',
        'updateMotor'
    ];
    for (method of liftMethods) {
        await addLoopToType(compiler, folder, 'Lift', method);
    }
    liftType = compiler.getType('Lift');
    inter = Interpreter();
    globals.inter = inter;
    buttons = [];
    for (floor = 1; floor <= floorCount; floor++) {
        up = floor !== floorCount;
        down = floor !== 1;
        createFloor(inter, buttons, floor, up, down);
    }
    cabin = inter.createCodeObject(Cabin());
    motor = inter.createCodeObject(LinearMotor(cabinVelocity, floorToPosition(1)));
    door = inter.createCodeObject(LinearMotor(doorVelocity, 0));
    actors = {
        buttons: buttons,
        cabin: cabin,
        motor: motor,
        door: door
    };
    lift = inter.createLoopObject(liftType, actors, Lift());
    globals.lift = lift;
    inter.addCallbacks({ requestUpdate: requestUpdate });
}
function clear(node) {
    while (true) {
        if (node.firstChild) {
            node.removeChild(node.lastChild);
        } else {
            break;
        }
    }
}
function clientToElement(element, evt) {
    var crect, x, y;
    crect = element.getBoundingClientRect();
    x = evt.clientX - crect.left;
    y = evt.clientY - crect.top;
    return {
        x: x,
        y: y
    };
}
function createButton(inter, buttons, floor, role, text, x, y) {
    var button, userData;
    userData = {
        floor: floor,
        role: role
    };
    button = inter.createCodeObject(OneWayButton(x, y, role, text, userData));
    buttons.push(button);
}
function createCanvas() {
    var canvas, canvasHeight, mainDiv, scale, status;
    canvasHeight = getCanvasHeight();
    mainDiv = get('main');
    clear(mainDiv);
    canvas = document.createElement('canvas');
    canvas.style.display = 'inline-block';
    canvas.style.verticalAlign = 'top';
    status = document.createElement('div');
    status.style.display = 'inline-block';
    status.style.verticalAlign = 'top';
    scale = getRetinaFactor();
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    add(mainDiv, canvas);
    add(mainDiv, status);
    globals.canvas = canvas;
    globals.status = status;
    globals.retina = scale;
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onHover);
}
function createFloor(inter, buttons, floor, up, down) {
    var bottom, centerY, innerBottom, left, nleft, y, y1, y2;
    bottom = getFloorBottom(floor);
    centerY = Math.round(bottom - floorHeight / 2);
    left = canvasPadding + floorWidth + canvasPadding;
    if (up) {
        if (down) {
            y1 = centerY - (buttonSize + buttonMargin / 2);
            y2 = y1 + buttonSize + buttonMargin;
            createButton(inter, buttons, floor, 'up', undefined, left, y1);
            createButton(inter, buttons, floor, 'down', undefined, left, y2);
        } else {
            y = centerY - buttonSize / 2;
            createButton(inter, buttons, floor, 'up', undefined, left, y);
        }
    } else {
        if (down) {
            y = centerY - buttonSize / 2;
            createButton(inter, buttons, floor, 'down', undefined, left, y);
        }
    }
    innerBottom = getFloorBottom(1);
    nleft = left + buttonSize + canvasPadding * 2;
    y = innerBottom - canvasPadding - floorThickness - buttonSize - (floor - 1) * (buttonSize + buttonMargin);
    createButton(inter, buttons, floor, 'inner', floor.toString(), nleft, y);
}
function drawActiveButton(x, y, text) {
    drawButton(x, y, buttonSize, buttonSize, text, normalButton, lineColor);
}
function drawActiveDown(x, y) {
    drawDown(x, y, buttonSize, buttonSize, normalButton, lineColor);
}
function drawActiveUp(x, y) {
    drawUp(x, y, buttonSize, buttonSize, normalButton, lineColor);
}
function drawButton(x, y, width, height, text, color, background) {
    var bottom, ctx, left, textWidth;
    ctx = globals.ctx;
    ctx.fillStyle = background;
    fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    rect(x, y, width, height);
    textWidth = ctx.measureText(text).width;
    left = Math.round(x + (width - textWidth) / 2);
    bottom = Math.floor(y + height - (height - fontSize * 0.9) / 2);
    ctx.font = fontSize + 'px ' + fontFace;
    ctx.fillStyle = color;
    ctx.textBaseLine = 'bottom';
    ctx.fillText(text, left, bottom);
}
function drawCabin(cabinFloorY, doorOpening) {
    var cabinHeight, cabinLeft, cabinTop, cabinWidth, ctx, doorLeft, doorTop, left, leftDoorX, rightDoorX;
    ctx = globals.ctx;
    left = canvasPadding;
    doorLeft = left + (floorWidth - doorWidth) / 2;
    cabinLeft = doorLeft - cabinThickness;
    doorTop = cabinFloorY - doorHeight;
    cabinTop = doorTop - cabinThickness;
    cabinWidth = doorWidth + cabinThickness * 2;
    cabinHeight = doorHeight + cabinThickness * 2;
    ctx.fillStyle = openColor;
    fillRect(doorLeft, doorTop, doorWidth, doorHeight);
    leftDoorX = doorLeft - doorWidth * 0.45 * doorOpening;
    ctx.fillStyle = normalButton;
    fillRect(leftDoorX, doorTop, doorWidth / 2, doorHeight);
    ctx.strokeStyle = lineColor;
    rect(leftDoorX, doorTop, doorWidth / 2, doorHeight);
    rightDoorX = doorLeft + doorWidth / 2 + doorWidth * 0.45 * doorOpening;
    fillRect(rightDoorX, doorTop, doorWidth / 2, doorHeight);
    rect(rightDoorX, doorTop, doorWidth / 2, doorHeight);
    ctx.fillStyle = lineColor;
    fillRect(cabinLeft, cabinTop, cabinWidth, cabinThickness);
    fillRect(cabinLeft, doorTop, cabinThickness, doorHeight);
    fillRect(cabinLeft, cabinFloorY, cabinWidth, cabinThickness);
    fillRect(doorLeft + doorWidth, doorTop, cabinThickness, doorHeight);
}
function drawDown(x, y, width, height, color, background) {
    var bottom, ctx, left, middle, right, top;
    ctx = globals.ctx;
    ctx.fillStyle = background;
    fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    rect(x, y, width, height);
    left = Math.round(x + width / 3);
    right = Math.round(x + width * 2 / 3);
    middle = (left + right) / 2;
    top = Math.round(y + height / 3);
    bottom = Math.round(y + height * 2 / 3);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(middle, bottom);
    ctx.fill();
}
function drawFloor(number) {
    var bottom, canvasHeight, ctx, doorHigh, doorLeft, doorLow, left, middle;
    ctx = globals.ctx;
    left = canvasPadding;
    canvasHeight = getCanvasHeight();
    bottom = getFloorBottom(number);
    doorLow = bottom - floorThickness;
    doorHigh = doorLow + doorHeight;
    middle = left + floorWidth / 2;
    doorLeft = left + (floorWidth - doorWidth) / 2;
    ctx.strokeStyle = lineColor;
    line(left, bottom, left + floorWidth, bottom);
    line(left, doorLow, left + floorWidth, doorLow);
    rect(doorLeft, doorLow - doorHeight, doorWidth, doorHeight);
    line(middle, doorLow - doorHeight, middle, doorLow);
}
function drawGuiButton(button) {
    var _selectValue_3;
    _selectValue_3 = button.type;
    if (_selectValue_3 === 'up') {
        if (button.machine.on) {
            drawActiveUp(button.x, button.y);
        } else {
            drawNormalUp(button.x, button.y);
        }
    } else {
        if (_selectValue_3 === 'down') {
            if (button.machine.on) {
                drawActiveDown(button.x, button.y);
            } else {
                drawNormalDown(button.x, button.y);
            }
        } else {
            if (_selectValue_3 !== 'inner') {
                throw new Error('Unexpected case value: ' + _selectValue_3);
            }
            if (button.machine.on) {
                drawActiveButton(button.x, button.y, button.text);
            } else {
                drawNormalButton(button.x, button.y, button.text);
            }
        }
    }
}
function drawNormalButton(x, y, text) {
    drawButton(x, y, buttonSize, buttonSize, text, lineColor, normalButton);
}
function drawNormalDown(x, y) {
    drawDown(x, y, buttonSize, buttonSize, lineColor, normalButton);
}
function drawNormalUp(x, y) {
    drawUp(x, y, buttonSize, buttonSize, lineColor, normalButton);
}
function drawUp(x, y, width, height, color, background) {
    var bottom, ctx, left, middle, right, top;
    ctx = globals.ctx;
    ctx.fillStyle = background;
    fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    rect(x, y, width, height);
    left = Math.round(x + width / 3);
    right = Math.round(x + width * 2 / 3);
    middle = (left + right) / 2;
    top = Math.round(y + height / 3);
    bottom = Math.round(y + height * 2 / 3);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(middle, top);
    ctx.lineTo(right, bottom);
    ctx.fill();
}
function fillRect(x, y, width, height) {
    var ctx;
    ctx = globals.ctx;
    ctx.fillRect(x, y, width, height);
}
function floorToPosition(number) {
    var canvasHeight;
    canvasHeight = getCanvasHeight();
    return canvasHeight - canvasPadding - (number - 1) * floorHeight - floorThickness;
}
function formatValue(value) {
    if (typeof value === 'number') {
        if (value === Math.round(value)) {
            return value.toString();
        } else {
            return value.toFixed(2).toString();
        }
    } else {
        return value.toString();
    }
}
function get(id) {
    var element;
    element = document.getElementById(id);
    if (element) {
        return element;
    } else {
        throw new Error('Element not found ' + id);
    }
}
function getCabinPos() {
    return globals.lift.actors.motor.obj.getCurrent();
}
function getCanvasHeight() {
    return canvasPadding * 2 + floorCount * floorHeight;
}
function getDoorPos() {
    return globals.lift.actors.door.obj.getCurrent();
}
function getFloorBottom(number) {
    var bottom, canvasHeight;
    canvasHeight = getCanvasHeight();
    bottom = canvasHeight - canvasPadding - (number - 1) * floorHeight;
    return bottom;
}
function getRetina() {
    return window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches) || window.devicePixelRatio && window.devicePixelRatio > 1.3;
}
function getRetinaFactor() {
    if (window.devicePixelRatio) {
        return window.devicePixelRatio;
    } else {
        if (isRetina()) {
            return 2;
        } else {
            return 1;
        }
    }
}
function hitBox(left, top, width, height, x, y) {
    var bottom, right;
    if (x >= left && y >= top) {
        right = left + width;
        if (x < right) {
            bottom = top + height;
            if (y < bottom) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}
function initLog() {
    var main;
    main = document.getElementById('main');
}
async function liftMain() {
    initLog();
    await buildStructures();
    createCanvas();
    redraw();
}
function line(x1, y1, x2, y2) {
    var ctx;
    ctx = globals.ctx;
    x1 += 0.5;
    y1 += 0.5;
    x2 += 0.5;
    y2 += 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
async function loadJson(path) {
    var obj, result;
    result = await sendRequest('GET', path);
    if (result.status === 200) {
        obj = JSON.parse(result.body);
        return obj;
    } else {
        throw new Error('Could not get file: ' + path);
    }
}
async function loopsMain() {
    var actors, compiler, folder, grey, grey2, longfun, machine, name, one, red, root, yellow, yellow2;
    initLog();
    folder = 'loops2-data';
    compiler = Compiler();
    compiler.createType('Red');
    red = [
        'subLoopActorManyLoop',
        'subLoopActorOneChunk',
        'callSequental',
        'chunkFunction',
        'chunkFunctionJoin',
        'conditionalOutputs',
        'oneInputTwoOutputs',
        'sequental',
        'subLoop',
        'subLoopActorManyChunk',
        'subLoopActorOne',
        'subLoopChunk',
        'subLoopVar'
    ];
    for (name of red) {
        await addLoopToType(compiler, folder, 'Red', name);
    }
    compiler.createType('Butt2');
    await addLoopToType(compiler, folder, 'Butt2', 'reset');
    machine = Interpreter();
    makeFakeCallbacks(machine, [
        'foo',
        'bar',
        'u1',
        'u2',
        'out1',
        'out2',
        'out3'
    ]);
    grey = machine.createCodeObject(ImaginaryButton('grey'));
    yellow = machine.createCodeObject(ImaginaryButton('yellow'));
    grey2 = machine.createLoopObject(compiler.getType('Butt2'), {}, Butt2('grey'));
    yellow2 = machine.createLoopObject(compiler.getType('Butt2'), {}, Butt2('yellow'));
    actors = {
        buttons: [
            grey,
            yellow
        ],
        buttons2: [
            grey2,
            yellow2
        ]
    };
    root = machine.createLoopObject(compiler.getType('Red'), actors, RedFunctions());
    one = false;
    if (one) {
        machine.runLoop(root, 'subLoopActorManyLoop', 'cool');
    } else {
        machine.runLoop(root, 'oneInputTwoOutputs', 10);
        machine.runLoop(root, 'conditionalOutputs', 5);
        machine.runLoop(root, 'conditionalOutputs', 6);
        machine.runLoop(root, 'chunkFunction', 4);
        machine.runLoop(root, 'chunkFunctionJoin', 4);
        machine.runLoop(root, 'subLoop', 2);
        machine.runLoop(root, 'subLoopChunk', 3);
        machine.runLoop(root, 'subLoopActorOne', 'yellow');
        machine.runLoop(root, 'subLoopActorOneChunk', 'fine');
        machine.runLoop(root, 'subLoopActorManyChunk', 'fine');
        machine.runLoop(root, 'subLoopActorManyLoop', 'cool');
        longfun = 2;
        if (longfun === 1) {
            machine.runLoop(root, 'callSequental', 7);
        } else {
            if (longfun !== 2) {
                throw new Error('Unexpected case value: ' + longfun);
            }
            machine.runLoop(root, 'subLoopVar', 7);
        }
    }
}
function mainLog(text) {
    var main, pre;
    main = document.getElementById('main');
    pre = document.createElement('pre');
    pre.appendChild(document.createTextNode(text));
    pre.style.padding = '10px';
    pre.style.borderBottom = 'solid 1px grey';
    main.appendChild(pre);
}
function makeFakeCallback(name) {
    return function (arg) {
        console.log(name, arg);
    };
}
function makeFakeCallbacks(machine, names) {
    var name, obj;
    obj = {};
    for (name of names) {
        obj[name] = makeFakeCallback(name);
    }
    machine.addCallbacks(obj);
}
function onClick(evt) {
    globals.inter.runLoop(globals.lift, 'onClick', evt);
}
function onHover(evt) {
    var button;
    button = globals.lift.obj.findButton(globals.lift.actors.buttons, evt);
    if (button) {
        globals.canvas.style.cursor = 'pointer';
    } else {
        globals.canvas.style.cursor = 'default';
    }
}
function pause(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
function printMachine(container, machine, depth) {
    var _selectValue_7, name, names, value;
    if (machine && machine.state) {
        addLine(depth, container, 'state', machine.state, true);
        names = Object.keys(machine);
        names.sort();
        for (name of names) {
            if (name !== 'state') {
                value = machine[name];
                _selectValue_7 = typeof value;
                if (_selectValue_7 === 'object') {
                    addLine(depth, container, name, undefined, false);
                    printMachine(container, value, depth + 1);
                } else {
                    if (_selectValue_7 !== 'function') {
                        addLine(depth, container, name, value, false);
                    }
                }
            }
        }
    }
}
function rect(x, y, width, height) {
    var ctx;
    ctx = globals.ctx;
    x += 0.5;
    y += 0.5;
    ctx.strokeRect(x, y, width, height);
}
function redraw() {
    var _collection_5, button, canvasHeight, ctx, floor;
    ctx = globals.canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(globals.retina, globals.retina);
    globals.ctx = ctx;
    ctx.fillStyle = background;
    canvasHeight = getCanvasHeight();
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    for (floor = 1; floor <= floorCount; floor++) {
        drawFloor(floor);
    }
    drawCabin(getCabinPos(), getDoorPos());
    _collection_5 = globals.lift.actors.buttons;
    for (button of _collection_5) {
        button.obj.drawButton();
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
function requestUpdate() {
    globals.updateRequested = true;
    requestAnimationFrame(updateWorld);
}
function sendRequest(method, url, body, headers) {
    return new Promise(function (resolve, reject) {
        sendRequestCore(method, url, body, headers, resolve, reject);
    });
}
function sendRequestCore(method, url, body, headers, resolve, reject) {
    var name, value, xhr;
    xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    if (headers) {
        for (name in headers) {
            value = headers[name];
            xhr.setRequestHeader(name, value);
        }
    }
    xhr.onload = function () {
        resolve({
            status: xhr.status,
            body: xhr.responseText
        });
    };
    xhr.onerror = function () {
        reject(new Error('Network error: ' + url));
    };
    xhr.send(body);
}
function showMachineStatus() {
    var root, status;
    status = globals.status;
    clear(status);
    root = {
        cabin: globals.cabin,
        currentFloor: globals.currentFloor,
        state: 'ok'
    };
    printMachine(status, root, 0);
}
function updateFrameTime() {
    var delta, now;
    now = new Date().getTime();
    if (globals.lastFrame) {
        delta = Math.min(0.2, (now - globals.lastFrame) / 1000);
    } else {
        delta = 0;
    }
    globals.lastFrame = now;
    return delta;
}
function updateWorld() {
    var delta;
    globals.updateRequested = false;
    delta = updateFrameTime();
    globals.inter.runLoop(globals.lift, 'updateMotor', delta);
    globals.inter.runLoop(globals.lift, 'updateDoor', delta);
    redraw();
    if (globals.updateRequested) {
        globals.updateRequested = false;
    } else {
        globals.lastFrame = 0;
    }
}
function wait(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
window.liftMain = liftMain;
window.loopsMain = loopsMain;
window.sendRequest = sendRequest;
})();