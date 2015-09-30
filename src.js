var test = monad(function () {
	var a = bind([1, 2]);
	var b = bind(test2());
	return a + b;
});

var test2 = monad(function () {
	return bind([1, 2]);
});

function runList(m) {
    if (!m.monadic) {
        throw "Hey, this is no monadic computation";
    }
    return m({
        bind: function (x, f) {
            var xx = x.monadic ? runList(x) : x;
            return Array.prototype.concat.apply([], xx.map(f));
        },
        wrap: function (x) {
            return [x];
        }
    });
}

console.log(runList(test()));