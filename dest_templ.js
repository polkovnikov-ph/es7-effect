var test = function () {
	var res = function ($monad) {
		return $monad.bind([1, 2], function ($1) {
			var a = $1;
			return $monad.bind(test2(), function ($2) {
				var b = $2;
				return $monad.wrap(a + b);
			});
		});
	};
    res.$monadic = true;
    return res;
};

var test2 = function () {
	var res = function ($monad) {
        return $monad.bind([1, 2], function ($1) {
			return $monad.wrap($1);
		});
    };
    res.$monadic = true;
    return res;
};
