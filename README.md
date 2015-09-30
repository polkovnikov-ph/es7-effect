# es7-effect
Experiments for ES7 proposal to add monads instead of async/await which is essentially a continuation monad.

## What is this for?

There's a pretty language called Haskell that have shown us that the way the individual parts of the program are assembled could be factored into a new structure: a monad. In that way you may get rid of exceptions, state, input-output, async/await, generators etc. in the compiler's sources, get these into userland and let user determine if (s)he want exceptions or not, and how exactly these should work.

Actually, most professional JavaScript programmers already have tried a monad called `Cont`: that's what generators + promises thing is all about. But due to absence of `Iterator.clone` method, it's impossible to use that same thing to work with promise-like objects that call `resolve` several times. Yes, it would be possible to do FRP with just several `yield` operators thrown into the code, if iterators were cloneable.

While fixing this FRP issue would be already nice, I've found it strange to create new syntax for every single monad. I've thought that it's possible to add something like `do`-notation from Haskell into an imperative language. First I've imagined a different kind of syntax sugar for monads, an operator `bind :: (Monad m) => m a -> a`. As it turned out after several month there's already a bang operator (`!`) in Idris and an implementation of exactly the same idea in Scala by @pelotom [here](https://github.com/pelotom/effectful).

While `effectful` is a brilliant solution that even understands constructions such as loops and, hopefully, `try...catch`, there's a problem in JavaScript that it lacks static typing and type inference, and there's no way to infer monads from the context they're used. Yet I think it's possible to invert control and let user pass an object `{bind: ..., wrap: ...}` into a function that is a result of monadic computation.

## How should this work?

 - Use `sweet.js` to convert `monad` and `bind` operators into function calls, so that it becomes a valid EcmaScript.
 - Use `esprima`, `espree` or `acorn` to parse this intermediate form.
 - Use `estraverse` to desugar `bind` inside `monad` environments almost as Haskell does.
 - Use `escodegen` to get the resulting file.
 
## What's the plan?
 
 - Add tests.
 - Try out several real-world monads: Events, FRP, State, Trampoline, Free.
 - Add support for conditionals, exception handling, loops and generators.
 - Write back to Brendan Eich who asked me if I have an implementation of this.
