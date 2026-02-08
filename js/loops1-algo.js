(function() {
function Loops1Algo() {
    var self = {};
    function appleToOrange(actor) {
        actor.orange = actor.apple + 1;
    }
    function makeCarrot(actor) {
        actor.carrot = actor.orange + actor.soup;
    }
    function makeVegetables(actor) {
        actor.tomato = actor.orange + 10;
    }
    function processOrange(actor) {
        actor.orange *= 2;
    }
    self.appleToOrange = appleToOrange;
    self.makeCarrot = makeCarrot;
    self.makeVegetables = makeVegetables;
    self.processOrange = processOrange;
    return self;
}
window.Loops1Algo = Loops1Algo;
})();