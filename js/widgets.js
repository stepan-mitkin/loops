(function() {
var currentStyleSection, gDialogRoot, gPopupElement, gPopupRoot, utils;
gPopupRoot = undefined;
gPopupElement = undefined;
gDialogRoot = undefined;
currentStyleSection = undefined;
utils = createUtils();
function VerticalMenu_onItemClicked(callbackContext, event) {
    var newActive, props;
    props = callbackContext.props;
    newActive = event.userData;
    return {
        setLocalState: { active: newActive },
        emit: [{
                target: props.target,
                name: props.targetMethod,
                arg: newActive
            }]
    };
}
function VerticalMenu_render(renderContext) {
    var active, child, children, item, items;
    items = renderContext.props.items;
    active = renderContext.state.active;
    children = [];
    for (item of items) {
        if (item.id === active) {
            child = {
                type: 'tag',
                tag: 'div',
                className: 'verticalmenu-item-active',
                text: renderContext.translate(item.text)
            };
        } else {
            child = {
                type: 'tag',
                tag: 'div',
                className: 'verticalmenu-item',
                text: renderContext.translate(item.text),
                events: {
                    target: renderContext.id,
                    click: {
                        method: 'onItemClicked',
                        userData: item.id
                    }
                }
            };
        }
        children.push(child);
    }
    return { children: children };
}
function VerticalMenu_setActive(callbackContext, newActive) {
    return { setLocalState: { active: newActive } };
}
function buildWidgetStyles(theme) {
    startStyleSection('widget-styles');
    createStyle('.verticalmenu-item', 'line-height: 30px', 'color: ' + theme['text'], 'background: ' + theme['background'], 'user-select: none', 'cursor: pointer');
    createStyle('.verticalmenu-item:hover', 'color: ' + theme['text'], 'background: ' + theme['hover']);
    createStyle('.verticalmenu-item:active', 'color: ' + theme['activeText'], 'background: ' + theme['activeBackground']);
    createStyle('.verticalmenu-item-active', 'line-height: 30px', 'color: ' + theme['selectedText'], 'background: ' + theme['selectedBackground'], 'user-select: none', 'cursor: pointer');
    endStyleSection();
}
function collapseTreeNode(callbackContext, event) {
    var _collection_5, childId, itemId, parent, props, state;
    state = copyTreeViewState(callbackContext);
    props = callbackContext.props;
    itemId = event.userData;
    parent = state.items[itemId];
    _collection_5 = parent.children;
    for (childId of _collection_5) {
        removeTreeNode(state, childId);
    }
    updateTreeViewItem(state, itemId, {
        state: 'collapsed',
        children: []
    });
    return { setLocalState: state };
}
function copyTreeViewState(callbackContext) {
    var state;
    state = callbackContext.state;
    return { items: utils.clone(state.items) };
}
function createLeftRightContainer(props) {
    return { render: renderLeftRightContainer };
}
function createMultiWidget() {
    return {
        state: { active: undefined },
        render: multiWidget_render,
        setActive: multiWidget_setActive
    };
}
function createPopup(left, top) {
    var element;
    removePopup();
    element = document.createElement('div');
    gPopupRoot.appendChild(element);
    element.style.display = 'inline-block';
    element.style.position = 'fixed';
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    gPopupElement = element;
    document.addEventListener('click', onPopupBackgroundClick);
    return element;
}
function createSolid(props) {
    var background;
    background = props.background;
    return {
        state: { background: background },
        setColor: setSolidColor,
        render: renderSolid
    };
}
function createStyle() {
    var i, lines, name, style;
    name = arguments[0];
    lines = [];
    for (i = 1; i < arguments.length; i++) {
        lines.push(arguments[i]);
    }
    style = {
        name: name,
        lines: lines
    };
    currentStyleSection.styles.push(style);
}
function createTopBottomContainer(props) {
    return { render: renderTopBottomContainer };
}
function createTreeNode(state, item) {
    var id, itemState, node, parent, parentId;
    id = item.id;
    if (item.expandable) {
        itemState = 'collapsed';
    } else {
        itemState = 'leaf';
    }
    node = {
        id: id,
        text: item.text,
        state: itemState,
        parent: item.parent,
        children: []
    };
    if (item.parent) {
        parentId = item.parent;
    } else {
        parentId = 'root';
    }
    parent = state.items[parentId];
    parent.children.push(id);
    state.items[id] = node;
    return node;
}
function createTreeView() {
    return {
        state: createTreeViewState(),
        render: renderTree,
        setRootItems: setRootItems,
        collapseTreeNode: collapseTreeNode,
        onTreeNodeExpanded: onTreeNodeExpanded,
        setChildren: setTreeChildren,
        onTreeItemContextMenu: onTreeItemContextMenu,
        onTreeItemDoubleClick: onTreeItemDoubleClick,
        onTreeItemClick: onTreeItemClick
    };
}
function createTreeViewState() {
    var id, rootNode, state;
    id = 'root';
    rootNode = {
        id: id,
        text: '<root>',
        state: 'root',
        parent: undefined,
        children: []
    };
    state = { items: {} };
    state.items[id] = rootNode;
    return state;
}
function createVerticalMenu() {
    return {
        state: {},
        onItemClicked: VerticalMenu_onItemClicked,
        setActive: VerticalMenu_setActive,
        render: VerticalMenu_render
    };
}
function endStyleSection() {
    var chunks, existing, style, text;
    chunks = currentStyleSection.styles.map(printStyle);
    existing = document.getElementById(currentStyleSection.id);
    if (existing) {
        existing.remove();
    }
    text = chunks.join('\n');
    style = document.createElement('style');
    style.id = currentStyleSection.id;
    style.innerText = text;
    document.head.appendChild(style);
}
function get(id) {
    var element;
    element = document.getElementById(id);
    if (element) {
        return element;
    } else {
        throw new Error('get: element with id not found: ' + id);
    }
}
function initWidgets(dialogRoot, popupRoot) {
    gDialogRoot = dialogRoot;
    gPopupRoot = popupRoot;
}
function multiWidget_render(renderContext) {
    var active, child, childId, childRect, rect;
    active = renderContext.state.active;
    rect = renderContext.rect;
    if (active === undefined) {
        return {};
    } else {
        childRect = {
            left: 0,
            top: 0,
            width: rect.width,
            height: rect.height
        };
        childId = renderContext.children[active];
        child = renderContext.buildAbsElement(childId, childRect);
        return { children: [child] };
    }
}
function multiWidget_setActive(callbackContext, active) {
    if (active !== callbackContext.state.active) {
        return { setLocalState: { active: active } };
    }
}
function onPopupBackgroundClick(event) {
    var current;
    current = event.target;
    while (true) {
        if (current) {
            if (current === gPopupElement) {
                break;
            } else {
                current = current.parentElement;
            }
        } else {
            removePopup();
            break;
        }
    }
}
function onTreeItemClick(callbackContext, event) {
    var emit, props;
    props = callbackContext.props;
    emit = [];
    if (props.onItemClick) {
        emit.push({
            target: props.eventTarget,
            name: props.onItemClick,
            arg: event
        });
    }
    return { emit: emit };
}
function onTreeItemContextMenu(callbackContext, event) {
    var emit, props;
    props = callbackContext.props;
    emit = [];
    if (props.onItemContextMenu) {
        emit.push({
            target: props.eventTarget,
            name: props.onItemContextMenu,
            arg: event
        });
    }
    return { emit: emit };
}
function onTreeItemDoubleClick(callbackContext, event) {
    var emit, props;
    props = callbackContext.props;
    emit = [];
    if (props.onItemDoubleClick) {
        emit.push({
            target: props.eventTarget,
            name: props.onItemDoubleClick,
            arg: event
        });
    }
    return { emit: emit };
}
function onTreeNodeExpanded(callbackContext, event) {
    var emits, itemId, props, state;
    props = callbackContext.props;
    itemId = event.userData;
    state = copyTreeViewState(callbackContext);
    updateTreeViewItem(state, itemId, { state: 'expanding' });
    if (props.onExpand) {
        emits = [{
                target: props.eventTarget,
                name: props.onExpand,
                arg: itemId
            }];
    } else {
        emits = undefined;
    }
    return {
        setLocalState: state,
        emit: emits
    };
}
function printStyle(style) {
    var _collection_3, line, lines;
    lines = [];
    lines.push(style.name + ' {');
    _collection_3 = style.lines;
    for (line of _collection_3) {
        lines.push('    ' + line + ';');
    }
    lines.push('}');
    lines.push('');
    return lines.join('\n');
}
function registerWidgetBuilders(boxes) {
    boxes.registerBuilder('createTopBottomContainer', createTopBottomContainer);
    boxes.registerBuilder('createSolid', createSolid);
    boxes.registerBuilder('createLeftRightContainer', createLeftRightContainer);
    boxes.registerBuilder('createVerticalMenu', createVerticalMenu);
    boxes.registerBuilder('createMultiWidget', createMultiWidget);
    boxes.registerBuilder('createTreeView', createTreeView);
}
function removePopup() {
    gPopupRoot.innerHTML = '';
    gPopupElement = undefined;
    document.removeEventListener('click', onPopupBackgroundClick);
}
function removeTreeNode(state, nodeId) {
    var _collection_7, childId, node;
    node = state.items[nodeId];
    _collection_7 = node.children;
    for (childId of _collection_7) {
        removeTreeNode(state, childId);
    }
    delete state.items[nodeId];
}
function renderLeftRightContainer(renderContext) {
    var children, left, leftRect, props, rect, right, rightRect;
    rect = renderContext.rect;
    props = renderContext.props;
    children = renderContext.children;
    leftRect = {
        left: 0,
        top: 0,
        width: props.leftWidth,
        height: rect.height
    };
    rightRect = {
        left: props.leftWidth,
        top: 0,
        width: rect.width - props.leftWidth,
        height: rect.height
    };
    left = renderContext.buildAbsElement(children[0], leftRect);
    right = renderContext.buildAbsElement(children[1], rightRect);
    return {
        children: [
            left,
            right
        ]
    };
}
function renderSolid(renderContext) {
    var children;
    if (renderContext.children) {
        children = renderContext.children.map(renderContext.buildInlineBlockElement);
    } else {
        children = [];
    }
    return {
        children: children,
        style: { background: renderContext.state.background }
    };
}
function renderTopBottomContainer(renderContext) {
    var bottom, bottomRect, children, props, rect, top, topRect;
    rect = renderContext.rect;
    props = renderContext.props;
    children = renderContext.children;
    topRect = {
        width: rect.width,
        height: props.topHeight,
        left: 0,
        top: 0
    };
    bottomRect = {
        left: 0,
        top: props.topHeight,
        width: rect.width,
        height: rect.height - props.topHeight
    };
    top = renderContext.buildAbsElement(children[0], topRect);
    bottom = renderContext.buildAbsElement(children[1], bottomRect);
    return {
        children: [
            top,
            bottom
        ]
    };
}
function renderTree(renderContext) {
    var _collection_9, childId, children, root, table;
    root = renderContext.state.items['root'];
    children = [];
    _collection_9 = root.children;
    for (childId of _collection_9) {
        renderTreeNode(renderContext, childId, 0, children);
    }
    table = tag('table', 'treeview-table', children);
    return {
        children: [table],
        rememberScroll: true,
        style: {
            overflowX: 'auto',
            overflowY: 'auto'
        }
    };
}
function renderTreeNode(renderContext, itemId, depth, output) {
    var _collection_13, _selectValue_11, childId, element, events, expandIcon, expandText, height, indent, indentation, node, parts, props, state, td, textPart, widgetId;
    height = 30;
    state = renderContext.state;
    props = renderContext.props;
    node = state.items[itemId];
    indentation = depth * height;
    widgetId = renderContext.id;
    indent = {
        type: 'tag',
        tag: 'div',
        style: {
            display: 'inline-block',
            width: indentation
        }
    };
    _selectValue_11 = node.state;
    if (_selectValue_11 === 'collapsed') {
        expandText = '+';
        events = {
            target: widgetId,
            'click': {
                method: 'onTreeNodeExpanded',
                stopPropagation: true,
                userData: node.id
            }
        };
    } else {
        if (_selectValue_11 === 'expanded') {
            expandText = '\u2014';
            events = {
                target: widgetId,
                'click': {
                    method: 'collapseTreeNode',
                    stopPropagation: true,
                    userData: node.id
                }
            };
        } else {
            if (_selectValue_11 === 'expanding') {
                expandText = '\u2014';
            }
        }
    }
    expandIcon = {
        type: 'tag',
        tag: 'div',
        text: expandText,
        style: {
            display: 'inline-block',
            textAlign: 'center',
            width: height,
            lineHeight: height
        },
        events: events
    };
    textPart = {
        type: 'tag',
        tag: 'div',
        text: node.text,
        style: {
            display: 'inline-block',
            lineHeight: height
        }
    };
    parts = [
        indent,
        expandIcon,
        textPart
    ];
    td = tag('td', 'treeview-item', parts);
    td.style = { userSelect: 'none' };
    td.events = {
        target: widgetId,
        contextmenu: {
            method: 'onTreeItemContextMenu',
            returnFalse: true,
            preventDefault: true,
            userData: node.id
        },
        doubleclick: {
            method: 'onTreeItemDoubleClick',
            userData: node.id
        },
        click: {
            method: 'onTreeItemClick',
            userData: node.id
        }
    };
    element = tag('tr', undefined, [td]);
    output.push(element);
    _collection_13 = node.children;
    for (childId of _collection_13) {
        renderTreeNode(renderContext, childId, depth + 1, output);
    }
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
        reject(new Error('Network error'));
    };
    xhr.send(body);
}
function setFixedPosition(element, left, top, width, height) {
    element.style.display = 'inline-block';
    element.style.position = 'fixed';
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.style.width = width + 'px';
    element.style.height = height + 'px';
}
function setRootItems(callbackContext, items) {
    var item, state;
    state = createTreeViewState();
    for (item of items) {
        createTreeNode(state, item);
    }
    return { setLocalState: state };
}
function setSolidColor(callbackContext, color) {
    return { setLocalState: { background: color } };
}
function setTreeChildren(callbackContext, arg) {
    var _collection_15, _collection_17, childId, children, item, parent, parentId, state;
    state = copyTreeViewState(callbackContext);
    parentId = arg.parent;
    parent = state.items[parentId];
    _collection_15 = parent.children;
    for (childId of _collection_15) {
        removeTreeNode(state, childId);
    }
    children = [];
    _collection_17 = arg.children;
    for (item of _collection_17) {
        createTreeNode(state, item);
        children.push(item.id);
    }
    updateTreeViewItem(state, parentId, {
        state: 'expanded',
        children: children
    });
    return { setLocalState: state };
}
function setWholeScreen(element) {
    setFixedPosition(element, 0, 0, window.innerWidth, window.innerHeight);
}
function showContextMenu(left, top, items) {
    var menu;
    menu = createPopup(left, top);
    menu.style.background = 'yellow';
    menu.style.width = '200px';
    menu.style.height = '400px';
}
function startStyleSection(id) {
    currentStyleSection = {
        id: id,
        styles: []
    };
}
function tag(tagName, className, children) {
    return {
        type: 'tag',
        tag: tagName,
        className: className,
        children: children || []
    };
}
function updateTreeViewItem(state, itemId, update) {
    var copy, existing;
    existing = state.items[itemId];
    copy = utils.clone(existing);
    Object.assign(copy, update);
    state.items[itemId] = copy;
}
window.buildWidgetStyles = buildWidgetStyles;
window.createLeftRightContainer = createLeftRightContainer;
window.createMultiWidget = createMultiWidget;
window.createPopup = createPopup;
window.createSolid = createSolid;
window.createStyle = createStyle;
window.createTopBottomContainer = createTopBottomContainer;
window.createTreeView = createTreeView;
window.createVerticalMenu = createVerticalMenu;
window.endStyleSection = endStyleSection;
window.initWidgets = initWidgets;
window.registerWidgetBuilders = registerWidgetBuilders;
window.removePopup = removePopup;
window.sendRequest = sendRequest;
window.setFixedPosition = setFixedPosition;
window.setWholeScreen = setWholeScreen;
window.showContextMenu = showContextMenu;
window.startStyleSection = startStyleSection;
})();